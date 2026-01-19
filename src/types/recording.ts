export interface Recording {
  id: string;
  filename: string;
  path: string;
  duration: number; // in seconds
  size: number; // in bytes
  createdAt: Date;
  thumbnail?: string;
}

export interface RecordingSettings {
  videoQuality: 'low' | 'medium' | 'high' | 'ultra';
  frameRate: 15 | 24 | 30 | 60;
  audioEnabled: boolean;
  audioSource: 'mic' | 'internal' | 'both';
  showTouches: boolean;
  showCountdown: boolean;
  countdownSeconds: 3 | 5 | 10;
  storageLocation: 'internal' | 'external';
}

export type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'processing';

export interface RecordingSession {
  state: RecordingState;
  startTime?: Date;
  duration: number;
  isPaused: boolean;
}
