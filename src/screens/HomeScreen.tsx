import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRecording} from '../context/RecordingContext';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const {session, settings, startRecording, stopRecording, pauseRecording, resumeRecording} = useRecording();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Countdown effect
  useEffect(() => {
    if (session.state === 'countdown') {
      setCountdown(settings.countdownSeconds);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev && prev > 1) return prev - 1;
          return null;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session.state, settings.countdownSeconds]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session.state === 'recording' && !session.isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session.state, session.isPaused]);

  // Reset timer when recording stops
  useEffect(() => {
    if (session.state === 'idle') {
      setElapsedTime(0);
    }
  }, [session.state]);

  // Pulse animation for recording indicator
  useEffect(() => {
    if (session.state === 'recording' && !session.isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [session.state, session.isPaused, pulseAnim]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordPress = useCallback(async () => {
    if (session.state === 'idle') {
      try {
        await startRecording();
      } catch (error) {
        Alert.alert('Error', 'Failed to start recording. Please grant screen recording permission.');
      }
    } else if (session.state === 'recording' || session.state === 'paused') {
      try {
        const recording = await stopRecording();
        if (recording) {
          Alert.alert('Success', `Recording saved: ${recording.filename}`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to save recording.');
      }
    }
  }, [session.state, startRecording, stopRecording]);

  const handlePausePress = useCallback(() => {
    if (session.state === 'recording') {
      pauseRecording();
    } else if (session.state === 'paused') {
      resumeRecording();
    }
  }, [session.state, pauseRecording, resumeRecording]);

  const isRecordingActive = session.state === 'recording' || session.state === 'paused';
  const isProcessing = session.state === 'processing';
  const isCountingDown = session.state === 'countdown';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Countdown overlay */}
      {isCountingDown && countdown && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Timer display */}
      <View style={styles.timerContainer}>
        {isRecordingActive && (
          <Animated.View style={[styles.recordingIndicator, {transform: [{scale: pulseAnim}]}]}>
            <View style={[styles.recordingDot, session.isPaused && styles.pausedDot]} />
          </Animated.View>
        )}
        <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        <Text style={styles.statusText}>
          {session.state === 'idle' && 'Ready to record'}
          {session.state === 'recording' && 'Recording...'}
          {session.state === 'paused' && 'Paused'}
          {session.state === 'processing' && 'Saving...'}
        </Text>
      </View>

      {/* Main controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.recordButton, isRecordingActive && styles.stopButton]}
          onPress={handleRecordPress}
          disabled={isProcessing || isCountingDown}>
          <Icon
            name={isRecordingActive ? 'stop' : 'fiber-manual-record'}
            size={48}
            color="#fff"
          />
        </TouchableOpacity>

        {isRecordingActive && (
          <TouchableOpacity style={styles.pauseButton} onPress={handlePausePress}>
            <Icon name={session.isPaused ? 'play-arrow' : 'pause'} size={32} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick settings indicator */}
      <View style={styles.settingsIndicator}>
        <Text style={styles.settingsText}>
          {settings.videoQuality.toUpperCase()} • {settings.frameRate}fps
          {settings.audioEnabled && ' • 🎤'}
        </Text>
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Recordings')}
          disabled={isRecordingActive}>
          <Icon name="video-library" size={28} color={isRecordingActive ? '#666' : '#fff'} />
          <Text style={[styles.navText, isRecordingActive && styles.disabledText]}>Recordings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Settings')}
          disabled={isRecordingActive}>
          <Icon name="settings" size={28} color={isRecordingActive ? '#666' : '#fff'} />
          <Text style={[styles.navText, isRecordingActive && styles.disabledText]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#e94560',
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    marginBottom: 16,
  },
  recordingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e94560',
  },
  pausedDot: {
    backgroundColor: '#ffc107',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '200',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 24,
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#e94560',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  stopButton: {
    backgroundColor: '#ff6b6b',
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  settingsIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingsText: {
    fontSize: 14,
    color: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
  },
  navButton: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  disabledText: {
    color: '#666',
  },
});

export default HomeScreen;
