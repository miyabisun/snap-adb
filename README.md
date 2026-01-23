# adb-pilot

A lightweight web-based tool to stream an Android device's screen via ADB and capture high-quality, cropped screenshots (icons) to a local directory.

## Features

- **Low-Latency Streaming**: Uses `adb screenrecord` piped to `ffmpeg` for a persistent, low-overhead MJPEG stream (~10fps).
- **Web Interface**: Simple React-based UI to view the stream and control capture.
- **Cropping**: Intuitive mouse-based selection to crop specific areas (e.g., icons).
- **High-Quality Snapshots**: Uses `adb exec-out screencap -p` to capture lossless PNGs directly from the device.
- **Subdirectory Support**: Supports saving files into subdirectories (e.g., `category/icon_name`) with automatic folder creation.
- **Gallery**: Built-in file browser to view, delete, and manage captured screenshots directly from the UI.
- **Automation**: Template matching and device control via REST API (tap, seek, swipe) for UI automation scripting.
- **Single Port**: Frontend and Backend run on a single port (3000) for easy access.

## Prerequisites

### System Dependencies

| Dependency | Purpose | Install (Ubuntu/Debian) |
|------------|---------|-------------------------|
| **Node.js** (v20+) | Runtime for backend/frontend | `nvm install 20` or [nodejs.org](https://nodejs.org/) |
| **ADB** | Android device communication | `sudo apt install android-tools-adb` |
| **FFmpeg** | Video stream transcoding | `sudo apt install ffmpeg` |

### Hardware

- **Android Device**: Connected via USB with **USB Debugging** enabled in Developer Options.

### npm Packages (auto-installed)

These are installed automatically by `./bin/install`:

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `jimp` | Image processing (crop, read PNG) |
| `opencv-wasm` | Template matching (WebAssembly, no native deps) |
| `@danielx/civet` | Civet language transpiler |
| `react` + `vite` | Frontend UI |

## Installation

1. Clone the repository.
2. Run the install script to setup dependencies for both backend and frontend:
   ```bash
   ./bin/install
   ```

## Usage

1. Connect your Android device via USB.
2. Start the server:
   ```bash
   ./bin/serve
   ```
   Or specify a custom port:
   ```bash
   ./bin/serve 9999
   ```
3. Open your browser and navigate to:
   **http://localhost:3000**

### Taking Snapshots

- **Crop & Snap**: Drag on the video stream to select an area (red box), enter a filename, and click **SNAP**.
- **Full Screen**: Click **SNAP** without selecting any area (or after clicking Clear) to save the full screen.
- **Subdirectories**: Enter filenames like `ui/buttons/start_btn` to automatically create folders and save as `output/ui/buttons/start_btn.png`.

### Gallery

- **View**: Switch to the "Gallery" tab to browse saved images.
- **Manage**: Click a file to preview it (on a checkerboard background for transparency checking).
- **Crop**: Drag on the preview to select an area -> Use **Arrow Keys** to move (1px) -> **Shift+Arrow** to resize -> Click **CROP** (bottom-right) to overwrite.
- **Delete**: Use the trash icon next to a file to delete it, or use "Delete All Images" to clear the output directory.

### Cleaning Up

To remove all captured images from the output directory:
```bash
./bin/clean-output
```

## Project Structure

- **backend/**: Node.js server (written in Civet) handling ADB/FFmpeg and API.
- **frontend/**: React/Vite application for the UI.
- **output/**: Default directory where snapshots are saved.
- **bin/**: Helper scripts (`install`, `serve`, `clean-output`).

## Notes

- The `output` directory includes a `.gitkeep` file but ignores PNG files, making it safe for git workflows where data is temporary.

## Automation API

The Automation API allows you to find images on the device screen and perform actions. All endpoints accept Base64-encoded PNG images as templates.

### Match Endpoints

#### Scan (One-shot check)
```bash
curl -X POST http://localhost:3000/api/match/scan \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [{"name": "button", "image": "data:image/png;base64,..."}],
    "threshold": 0.85
  }'
```
Response:
```json
{"results": [{"name": "button", "found": true, "score": 0.92, "x": 100, "y": 200}]}
```

#### Wait (Poll until ALL found)
```bash
curl -X POST http://localhost:3000/api/match/wait \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [{"name": "btn1", "image": "..."}],
    "threshold": 0.85,
    "timeout": 5000
  }'
```
Response:
```json
{"results": [{"name": "btn1", "found": true, "score": 0.91, "x": 50, "y": 100}], "time": 1234}
```
Timeout response: `{"results": null, "time": null}`

#### Race (Poll until ANY found)
```bash
curl -X POST http://localhost:3000/api/match/race \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [{"name": "a", "image": "..."}, {"name": "b", "image": "..."}],
    "threshold": 0.85,
    "timeout": 5000
  }'
```
Response:
```json
{"results": [...], "time": 500, "winner": "a"}
```

#### Best (One-shot, return best match)
```bash
curl -X POST http://localhost:3000/api/match/best \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [{"name": "a", "image": "..."}, {"name": "b", "image": "..."}],
    "threshold": 0.85
  }'
```
Response:
```json
{"results": [{"name": "a", "found": true, "score": 0.95, ...}, ...], "winner": "a"}
```

### Action Endpoints

#### Tap (One-shot: find and tap immediately)
```bash
curl -X POST http://localhost:3000/api/action/tap \
  -H "Content-Type: application/json" \
  -d '{
    "target": {"name": "button", "image": "data:image/png;base64,..."},
    "threshold": 0.85
  }'
```
Response (success):
```json
{"success": true, "message": "Tapped button", "x": 150, "y": 250}
```
Response (not found):
```json
{"success": false, "message": "Target not found"}
```

#### Seek (Poll until found, then tap)
```bash
curl -X POST http://localhost:3000/api/action/seek \
  -H "Content-Type: application/json" \
  -d '{
    "target": {"name": "button", "image": "data:image/png;base64,..."},
    "threshold": 0.85,
    "timeout": 5000
  }'
```
Response:
```json
{"success": true, "message": "Tapped button", "x": 150, "y": 250, "time": 1200}
```

#### Swipe
```bash
curl -X POST http://localhost:3000/api/action/swipe \
  -H "Content-Type: application/json" \
  -d '{"x1": 500, "y1": 800, "x2": 500, "y2": 400, "duration": 300}'
```
Response:
```json
{"success": true}
```

### Device Info

#### Get Screen Size
```bash
curl http://localhost:3000/api/device/size
```
Response:
```json
{"width": 1200, "height": 1920}
```
