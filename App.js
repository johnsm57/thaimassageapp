import '@react-native-firebase/app';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './Navigation';
import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <Navigation />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}