# Copilot Instructions for SideQuest

> A React Native screen recording app for Android

## Architecture Overview

**Hybrid React Native + Native Android** architecture:

- **React Native (TypeScript)**: UI, navigation, state management
- **Native Kotlin**: MediaProjection API for screen capture, foreground service

### Data Flow

```
User Action → React Context → ScreenRecorder Service → Native Module → Android MediaProjection
                    ↓
              State Update → UI Re-render
```

### Key Directories

- `src/screens/` - Screen components (Home, Recordings, Settings)
- `src/context/RecordingContext.tsx` - Global state for recording session
- `src/services/ScreenRecorder.ts` - Bridge to native module
- `android/.../screenrecorder/` - Native Android recording implementation

## Development Workflow

```bash
npm install                  # Install dependencies
npm start                    # Start Metro bundler
npm run android              # Build and run on device/emulator
npm run build:android        # Build release APK
```

## Code Conventions

### TypeScript/React Native

- Use functional components with hooks
- Type definitions in `src/types/`
- Path aliases: `@components/*`, `@screens/*`, `@services/*`
- State management via React Context (see `RecordingContext.tsx`)

### Native Android (Kotlin)

- Package: `com.sidequest.screenrecorder`
- Native modules must implement `ReactContextBaseJavaModule`
- Register packages in `MainApplication.kt`
- Foreground service required for recording (see `ScreenRecorderService.kt`)

## Critical Patterns

### Adding Native Features

1. Create Kotlin module in `android/.../screenrecorder/`
2. Register in `ScreenRecorderPackage.kt`
3. Create TypeScript bridge in `src/services/`
4. Add permissions to `AndroidManifest.xml`

### Screen Recording Flow

1. Request permission via `ScreenRecorderModule.requestPermission()`
2. Start foreground service with `startForegroundService()`
3. Create MediaProjection + MediaRecorder
4. Files saved to `getExternalFilesDir()/recordings/`

## Play Store Requirements

- Privacy policy required (screen recording permission)
- Target API 34+, min API 24
- Sign APK with release keystore before upload
