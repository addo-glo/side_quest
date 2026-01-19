import React, {createContext, useContext, useState, useCallback, ReactNode} from 'react';
import {RecordingSettings, RecordingSession, RecordingState, Recording} from '../types/recording';
import {ScreenRecorder} from '../services/ScreenRecorder';

interface RecordingContextType {
  session: RecordingSession;
  settings: RecordingSettings;
  recordings: Recording[];
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Recording | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  updateSettings: (settings: Partial<RecordingSettings>) => void;
  refreshRecordings: () => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
}

const defaultSettings: RecordingSettings = {
  videoQuality: 'high',
  frameRate: 30,
  audioEnabled: true,
  audioSource: 'mic',
  showTouches: false,
  showCountdown: true,
  countdownSeconds: 3,
  storageLocation: 'internal',
};

const defaultSession: RecordingSession = {
  state: 'idle',
  duration: 0,
  isPaused: false,
};

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

interface RecordingProviderProps {
  children: ReactNode;
}

export const RecordingProvider: React.FC<RecordingProviderProps> = ({children}) => {
  const [session, setSession] = useState<RecordingSession>(defaultSession);
  const [settings, setSettings] = useState<RecordingSettings>(defaultSettings);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const startRecording = useCallback(async () => {
    try {
      if (settings.showCountdown) {
        setSession(prev => ({...prev, state: 'countdown'}));
        await new Promise(resolve => setTimeout(resolve, settings.countdownSeconds * 1000));
      }

      setSession({
        state: 'recording',
        startTime: new Date(),
        duration: 0,
        isPaused: false,
      });

      await ScreenRecorder.start(settings);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setSession(defaultSession);
      throw error;
    }
  }, [settings]);

  const stopRecording = useCallback(async (): Promise<Recording | null> => {
    try {
      setSession(prev => ({...prev, state: 'processing'}));
      const recording = await ScreenRecorder.stop();
      setSession(defaultSession);
      
      if (recording) {
        setRecordings(prev => [recording, ...prev]);
      }
      
      return recording;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setSession(defaultSession);
      throw error;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    ScreenRecorder.pause();
    setSession(prev => ({...prev, state: 'paused', isPaused: true}));
  }, []);

  const resumeRecording = useCallback(() => {
    ScreenRecorder.resume();
    setSession(prev => ({...prev, state: 'recording', isPaused: false}));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<RecordingSettings>) => {
    setSettings(prev => ({...prev, ...newSettings}));
  }, []);

  const refreshRecordings = useCallback(async () => {
    const list = await ScreenRecorder.getRecordings();
    setRecordings(list);
  }, []);

  const deleteRecording = useCallback(async (id: string) => {
    await ScreenRecorder.deleteRecording(id);
    setRecordings(prev => prev.filter(r => r.id !== id));
  }, []);

  return (
    <RecordingContext.Provider
      value={{
        session,
        settings,
        recordings,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        updateSettings,
        refreshRecordings,
        deleteRecording,
      }}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = (): RecordingContextType => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
};
