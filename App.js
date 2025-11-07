
import React from 'react';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import Navigation from './Navigation';
import Chat from './src/chat/Chat';
import MassageScreen from './src/chat/MessagesScreen';
import NotificationsScreen from './src/notification/NotificationsScreen';
export default function App() {
  return (
  
      <SafeAreaProvider>
        <Navigation />
      </SafeAreaProvider>

  );
}