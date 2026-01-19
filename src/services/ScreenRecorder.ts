import {NativeModules, NativeEventEmitter, Platform} from 'react-native';
import {Recording, RecordingSettings} from '../types/recording';

const {ScreenRecorderModule} = NativeModules;
const eventEmitter = ScreenRecorderModule ? new NativeEventEmitter(ScreenRecorderModule) : null;

/**
 * ScreenRecorder service - bridges to native Android MediaProjection API
 * 
 * Android uses MediaProjection + MediaRecorder for screen capture.
 * This service abstracts the native module for easy React Native usage.
 */
export class ScreenRecorder {
  private static isRecording = false;
  private static isPaused = false;

  /**
   * Request screen recording permission from user
   * This triggers the system permission dialog
   */
  static async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('Screen recording is only supported on Android');
      return false;
    }

    try {
      return await ScreenRecorderModule.requestPermission();
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Start screen recording with given settings
   */
  static async start(settings: RecordingSettings): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Screen recording permission denied');
    }

    const nativeSettings = {
      quality: settings.videoQuality,
      frameRate: settings.frameRate,
      audioEnabled: settings.audioEnabled,
      audioSource: settings.audioSource,
      showTouches: settings.showTouches,
    };

    await ScreenRecorderModule.startRecording(nativeSettings);
    this.isRecording = true;
    this.isPaused = false;
  }

  /**
   * Stop recording and return the recording metadata
   */
  static async stop(): Promise<Recording | null> {
    if (!this.isRecording) {
      return null;
    }

    const result = await ScreenRecorderModule.stopRecording();
    this.isRecording = false;
    this.isPaused = false;

    if (result) {
      return {
        id: result.id,
        filename: result.filename,
        path: result.path,
        duration: result.duration,
        size: result.size,
        createdAt: new Date(result.createdAt),
        thumbnail: result.thumbnail,
      };
    }

    return null;
  }

  /**
   * Pause the current recording (Android 7.0+)
   */
  static pause(): void {
    if (this.isRecording && !this.isPaused) {
      ScreenRecorderModule.pauseRecording();
      this.isPaused = true;
    }
  }

  /**
   * Resume a paused recording
   */
  static resume(): void {
    if (this.isRecording && this.isPaused) {
      ScreenRecorderModule.resumeRecording();
      this.isPaused = false;
    }
  }

  /**
   * Get list of all saved recordings
   */
  static async getRecordings(): Promise<Recording[]> {
    const results = await ScreenRecorderModule.getRecordings();
    return results.map((r: any) => ({
      id: r.id,
      filename: r.filename,
      path: r.path,
      duration: r.duration,
      size: r.size,
      createdAt: new Date(r.createdAt),
      thumbnail: r.thumbnail,
    }));
  }

  /**
   * Delete a recording by ID
   */
  static async deleteRecording(id: string): Promise<void> {
    await ScreenRecorderModule.deleteRecording(id);
  }

  /**
   * Subscribe to recording events
   */
  static onRecordingEvent(callback: (event: {type: string; data?: any}) => void): () => void {
    if (!eventEmitter) {
      return () => {};
    }

    const subscription = eventEmitter.addListener('RecordingEvent', callback);
    return () => subscription.remove();
  }

  /**
   * Check if currently recording
   */
  static getIsRecording(): boolean {
    return this.isRecording;
  }
}
