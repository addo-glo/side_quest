import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import RecordingsScreen from './screens/RecordingsScreen';
import SettingsScreen from './screens/SettingsScreen';
import {RecordingProvider} from './context/RecordingContext';
import {RootStackParamList} from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <RecordingProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#1a1a2e',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              contentStyle: {
                backgroundColor: '#16213e',
              },
            }}>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'SideQuest Recorder'}}
            />
            <Stack.Screen
              name="Recordings"
              component={RecordingsScreen}
              options={{title: 'My Recordings'}}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{title: 'Settings'}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </RecordingProvider>
    </SafeAreaProvider>
  );
};

export default App;
