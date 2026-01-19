# snap-adb

A lightweight web-based tool to stream an Android device's screen via ADB and capture high-quality, cropped screenshots (icons) to a local directory.

## Features

- **Low-Latency Streaming**: Uses `adb screenrecord` piped to `ffmpeg` for a persistent, low-overhead MJPEG stream (~10fps).
- **Web Interface**: Simple React-based UI to view the stream and control capture.
- **Cropping**: Intuitive mouse-based selection to crop specific areas (e.g., icons).
- **High-Quality Snapshots**: Uses `adb exec-out screencap -p` to capture lossless PNGs directly from the device.
- **Subdirectory Support**: Supports saving files into subdirectories (e.g., `category/icon_name`) with automatic folder creation.
- **Single Port**: Frontend and Backend run on a single port (3001) for easy access.

## Prerequisites

- **Node.js** (v18+ recommended)
- **ADB (Android Debug Bridge)** (Must be installed and in your PATH, or `android-tools`)
- **FFmpeg** (Must be installed and in your PATH)
- **Android Device**: Connected via USB with USB Debugging enabled.

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
   ./bin/serve 8080
   ```
3. Open your browser and navigate to:
   **http://localhost:3001**

### Taking Snapshots

- **Crop & Snap**: Drag on the video stream to select an area (red box), enter a filename, and click **SNAP**.
- **Full Screen**: Click **SNAP** without selecting any area (or after clicking Clear) to save the full screen.
- **Subdirectories**: Enter filenames like `ui/buttons/start_btn` to automatically create folders and save as `output/ui/buttons/start_btn.png`.

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
