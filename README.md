# SideQuest - Screen Recording App

A React Native screen recording app for Android with support for high-quality video capture, audio recording, and easy sharing.

## Features

- 📹 **Screen Recording** - Capture your screen in up to 4K quality
- 🎤 **Audio Recording** - Record microphone audio with your screen
- ⏯️ **Pause/Resume** - Pause and resume recording (Android 7.0+)
- 📁 **Recording Management** - View, share, and delete recordings
- ⚙️ **Customizable Settings** - Quality, frame rate, countdown timer, and more

## Requirements

- Node.js 18+
- JDK 17
- Android SDK (API 24+)
- React Native CLI

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run on Android

```bash
# Start Metro bundler
npm start

# In another terminal, build and run
npm run android
```

### Build Release APK

```bash
npm run build:android
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
src/
├── App.tsx                 # Main app with navigation setup
├── components/             # Reusable UI components
├── context/
│   └── RecordingContext.tsx  # Global state management for recording
├── screens/
│   ├── HomeScreen.tsx      # Main recording controls
│   ├── RecordingsScreen.tsx # List of saved recordings
│   └── SettingsScreen.tsx  # App configuration
├── services/
│   └── ScreenRecorder.ts   # Bridge to native Android module
└── types/
    ├── navigation.ts       # Navigation type definitions
    └── recording.ts        # Recording-related types

android/app/src/main/java/com/sidequest/
├── MainActivity.kt
├── MainApplication.kt
└── screenrecorder/
    ├── ScreenRecorderModule.kt   # React Native bridge
    ├── ScreenRecorderPackage.kt  # Package registration
    └── ScreenRecorderService.kt  # Foreground service for recording
```

## How It Works

### Screen Recording on Android

The app uses Android's **MediaProjection API** to capture the screen:

1. User grants screen recording permission via system dialog
2. A foreground service (`ScreenRecorderService`) starts with a notification
3. `MediaRecorder` encodes video (H.264) and audio (AAC) to MP4
4. Files are saved to app-specific storage

### React Native Bridge

The `ScreenRecorderModule` (Kotlin) bridges native Android APIs to JavaScript:

- Handles permission requests
- Manages recording lifecycle (start/stop/pause/resume)
- Returns recording metadata to React Native

## Play Store Preparation

Before publishing:

1. **Create signing key**: `keytool -genkey -v -keystore release-key.jks -alias release -keyalg RSA -keysize 2048 -validity 10000`
2. **Configure signing** in `android/app/build.gradle`
3. **Update app icons** in `android/app/src/main/res/mipmap-*`
4. **Write privacy policy** (required for screen recording apps)
5. **Build release**: `cd android && ./gradlew bundleRelease`

## License

MIT
