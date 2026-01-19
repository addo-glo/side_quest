import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRecording} from '../context/RecordingContext';
import {RecordingSettings} from '../types/recording';

type QualityOption = RecordingSettings['videoQuality'];
type FrameRateOption = RecordingSettings['frameRate'];
type AudioSourceOption = RecordingSettings['audioSource'];
type CountdownOption = RecordingSettings['countdownSeconds'];

const SettingsScreen: React.FC = () => {
  const {settings, updateSettings} = useRecording();

  const qualityOptions: {value: QualityOption; label: string; description: string}[] = [
    {value: 'low', label: 'Low', description: '480p'},
    {value: 'medium', label: 'Medium', description: '720p'},
    {value: 'high', label: 'High', description: '1080p'},
    {value: 'ultra', label: 'Ultra', description: '1440p+'},
  ];

  const frameRateOptions: {value: FrameRateOption; label: string}[] = [
    {value: 15, label: '15 fps'},
    {value: 24, label: '24 fps'},
    {value: 30, label: '30 fps'},
    {value: 60, label: '60 fps'},
  ];

  const audioSourceOptions: {value: AudioSourceOption; label: string; icon: string}[] = [
    {value: 'mic', label: 'Microphone', icon: 'mic'},
    {value: 'internal', label: 'Internal Audio', icon: 'volume-up'},
    {value: 'both', label: 'Both', icon: 'surround-sound'},
  ];

  const countdownOptions: CountdownOption[] = [3, 5, 10];

  const OptionButton = <T extends string | number>({
    selected,
    onPress,
    label,
    sublabel,
  }: {
    selected: boolean;
    onPress: () => void;
    label: string;
    sublabel?: string;
  }) => (
    <TouchableOpacity
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
      onPress={onPress}>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
        {label}
      </Text>
      {sublabel && (
        <Text style={[styles.optionSublabel, selected && styles.optionSublabelSelected]}>
          {sublabel}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Video Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Quality</Text>
          <View style={styles.optionsRow}>
            {qualityOptions.map(option => (
              <OptionButton
                key={option.value}
                selected={settings.videoQuality === option.value}
                onPress={() => updateSettings({videoQuality: option.value})}
                label={option.label}
                sublabel={option.description}
              />
            ))}
          </View>
        </View>

        {/* Frame Rate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frame Rate</Text>
          <View style={styles.optionsRow}>
            {frameRateOptions.map(option => (
              <OptionButton
                key={option.value}
                selected={settings.frameRate === option.value}
                onPress={() => updateSettings({frameRate: option.value})}
                label={option.label}
              />
            ))}
          </View>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Icon name="mic" size={24} color="#fff" />
              <Text style={styles.toggleLabel}>Record Audio</Text>
            </View>
            <Switch
              value={settings.audioEnabled}
              onValueChange={value => updateSettings({audioEnabled: value})}
              trackColor={{false: '#444', true: '#4da6ff'}}
              thumbColor="#fff"
            />
          </View>

          {settings.audioEnabled && (
            <View style={styles.audioSourceContainer}>
              {audioSourceOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.audioSourceOption,
                    settings.audioSource === option.value && styles.audioSourceSelected,
                  ]}
                  onPress={() => updateSettings({audioSource: option.value})}>
                  <Icon
                    name={option.icon}
                    size={20}
                    color={settings.audioSource === option.value ? '#4da6ff' : '#888'}
                  />
                  <Text
                    style={[
                      styles.audioSourceLabel,
                      settings.audioSource === option.value && styles.audioSourceLabelSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recording Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording Options</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Icon name="touch-app" size={24} color="#fff" />
              <Text style={styles.toggleLabel}>Show Touches</Text>
            </View>
            <Switch
              value={settings.showTouches}
              onValueChange={value => updateSettings({showTouches: value})}
              trackColor={{false: '#444', true: '#4da6ff'}}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Icon name="timer" size={24} color="#fff" />
              <Text style={styles.toggleLabel}>Countdown Before Recording</Text>
            </View>
            <Switch
              value={settings.showCountdown}
              onValueChange={value => updateSettings({showCountdown: value})}
              trackColor={{false: '#444', true: '#4da6ff'}}
              thumbColor="#fff"
            />
          </View>

          {settings.showCountdown && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Countdown seconds:</Text>
              <View style={styles.countdownOptions}>
                {countdownOptions.map(seconds => (
                  <TouchableOpacity
                    key={seconds}
                    style={[
                      styles.countdownOption,
                      settings.countdownSeconds === seconds && styles.countdownOptionSelected,
                    ]}
                    onPress={() => updateSettings({countdownSeconds: seconds})}>
                    <Text
                      style={[
                        styles.countdownOptionText,
                        settings.countdownSeconds === seconds && styles.countdownOptionTextSelected,
                      ]}>
                      {seconds}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Developer</Text>
            <Text style={styles.aboutValue}>SideQuest Team</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4da6ff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: '#4da6ff',
    backgroundColor: 'rgba(77, 166, 255, 0.1)',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  optionLabelSelected: {
    color: '#fff',
  },
  optionSublabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  optionSublabelSelected: {
    color: '#4da6ff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#fff',
  },
  audioSourceContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  audioSourceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1a1a2e',
    paddingVertical: 10,
    borderRadius: 8,
  },
  audioSourceSelected: {
    backgroundColor: 'rgba(77, 166, 255, 0.15)',
  },
  audioSourceLabel: {
    fontSize: 12,
    color: '#888',
  },
  audioSourceLabelSelected: {
    color: '#4da6ff',
  },
  countdownContainer: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 8,
  },
  countdownLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  countdownOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  countdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#0f3460',
  },
  countdownOptionSelected: {
    backgroundColor: '#4da6ff',
  },
  countdownOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  countdownOptionTextSelected: {
    color: '#fff',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#fff',
  },
  aboutValue: {
    fontSize: 16,
    color: '#888',
  },
});

export default SettingsScreen;
