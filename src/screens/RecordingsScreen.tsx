import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRecording} from '../context/RecordingContext';
import {Recording} from '../types/recording';

const RecordingsScreen: React.FC = () => {
  const {recordings, refreshRecordings, deleteRecording} = useRecording();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    refreshRecordings();
  }, [refreshRecordings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshRecordings();
    setRefreshing(false);
  }, [refreshRecordings]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = async (recording: Recording) => {
    try {
      await Share.share({
        url: `file://${recording.path}`,
        title: recording.filename,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share recording');
    }
  };

  const handleDelete = (recording: Recording) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${recording.filename}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecording(recording.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recording');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({item}: {item: Recording}) => (
    <View style={styles.recordingItem}>
      <View style={styles.thumbnail}>
        {item.thumbnail ? (
          <Image source={{uri: item.thumbnail}} style={styles.thumbnailImage} />
        ) : (
          <Icon name="videocam" size={32} color="#666" />
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>

      <View style={styles.recordingInfo}>
        <Text style={styles.filename} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={styles.metadata}>
          {formatDate(item.createdAt)} • {formatFileSize(item.size)}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
          <Icon name="share" size={22} color="#4da6ff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
          <Icon name="delete" size={22} color="#e94560" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="videocam-off" size={64} color="#444" />
      <Text style={styles.emptyTitle}>No recordings yet</Text>
      <Text style={styles.emptySubtitle}>
        Your screen recordings will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={recordings}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={recordings.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4da6ff"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  recordingItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 80,
    height: 56,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  filename: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  metadata: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RecordingsScreen;
