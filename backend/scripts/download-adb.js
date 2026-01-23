import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
// Constants
const ADB_DIR = path.resolve(__dirname, '../local-adb');
const PLATFORM_TOOLS_DIR = path.join(ADB_DIR, 'platform-tools');

// Detect Platform
const platform = process.platform;
let downloadUrl = '';
let binaryName = 'adb';

if (platform === 'linux') {
    downloadUrl = 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip';
} else if (platform === 'darwin') {
    downloadUrl = 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip';
} else if (platform === 'win32') {
    downloadUrl = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
    binaryName = 'adb.exe';
} else {
    console.error('Unsupported platform:', platform);
    process.exit(1);
}

const ADB_BIN = path.join(PLATFORM_TOOLS_DIR, binaryName);

// Check if ADB already exists
if (fs.existsSync(ADB_BIN)) {
    console.log('Local ADB binary already exists.');
    try {
        // Ensure executable
        fs.chmodSync(ADB_BIN, '755');
    } catch (e) {
        // Ignore if chmod fails (e.g. windows filesystem mounted)
    }
    process.exit(0);
}

console.log('Downloading Android Platform Tools...');

if (!fs.existsSync(ADB_DIR)) {
    fs.mkdirSync(ADB_DIR, { recursive: true });
}

async function downloadAndExtract() {
    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Extracting...');
        const zip = new AdmZip(buffer);
        zip.extractAllTo(ADB_DIR, true); // overwrite = true

        console.log('Setting permissions...');
        fs.chmodSync(ADB_BIN, '755');

        console.log('ADB installed successfully.');
    } catch (error) {
        console.error('Error installing ADB:', error);
        process.exit(1);
    }
}

downloadAndExtract();
