import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import options from './src/component/options';
import SplashScreen from './src/component/splashscreen';
import Signup from './src/authentication/register/Signup';
import Login from './src/authentication/login/Login';
import Otp from './src/authentication/register/Otp';
import ProfileScreen from './src/authentication/register/ProfileScreen';
import LocationScreen from './src/authentication/register/LocationScreen';
import Homescreen from './src/Home/Homescreen';
import Setting from './src/setting/setting';
import chat from './src/chat/Chat';
import MessagesScreen from './src/chat/MessagesScreen';
import NotificationsScreen from './src/notification/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('splash');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      // Check if user is authenticated with Firebase
      const currentUser = auth().currentUser;
      
      if (currentUser) {
        console.log('✅ User is logged in:', currentUser.uid);
        console.log('📧 Email:', currentUser.email);
        
        // Check if user profile exists and is complete
        const userDoc = await firestore()
          .collection('Useraccount')
          .doc(currentUser.uid)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log('📄 User data found:', userData);
          
          // Check if profile has all essential fields
          const hasName = userData?.name && userData.name.trim() !== '';
          const hasGender = userData?.gender && userData.gender.trim() !== '';
          const hasLocation = userData?.location && userData.location.trim() !== '';
          
          console.log('Profile check:', { hasName, hasGender, hasLocation });
          
          if (hasName && hasGender && hasLocation) {
            // ✅ Profile is complete, go directly to Home
            console.log('✅ Profile complete, navigating to Home');
            await AsyncStorage.setItem('userToken', currentUser.uid);
            await AsyncStorage.setItem('isRegistered', 'true');
            await AsyncStorage.setItem('userEmail', currentUser.email || '');
            setInitialRoute('Home');
          } else if (hasName && hasGender) {
            // ⚠️ Has basic profile but needs location
            console.log('⚠️ Profile incomplete, needs location');
            await AsyncStorage.setItem('userToken', currentUser.uid);
            await AsyncStorage.setItem('userEmail', currentUser.email || '');
            setInitialRoute('location');
          } else {
            // ⚠️ Profile is incomplete, needs to complete profile
            console.log('⚠️ Profile incomplete, needs profile completion');
            await AsyncStorage.setItem('userToken', currentUser.uid);
            await AsyncStorage.setItem('userEmail', currentUser.email || '');
            setInitialRoute('profile');
          }
        } else {
          // ⚠️ User exists in Firebase Auth but no Firestore document
          console.log('⚠️ No Firestore document, creating and redirecting to profile');
          
          // Create initial Firestore document
          await firestore()
            .collection('Useraccount')
            .doc(currentUser.uid)
            .set({
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              createdAt: firestore.FieldValue.serverTimestamp(),
              updatedAt: firestore.FieldValue.serverTimestamp(),
              profileCompleted: false,
            });
          
          await AsyncStorage.setItem('userToken', currentUser.uid);
          await AsyncStorage.setItem('userEmail', currentUser.email || '');
          setInitialRoute('profile');
        }
      } else {
        // ❌ No user logged in
        console.log('❌ No user logged in, showing splash');
        await AsyncStorage.multiRemove(['userToken', 'isRegistered', 'userEmail']);
        setInitialRoute('splash');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      console.error('Error details:', error.message);
      
      // On error, clear storage and show splash screen
      try {
        await AsyncStorage.multiRemove(['userToken', 'isRegistered', 'userEmail']);
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      
      setInitialRoute('splash');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C97B84" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="splash" component={SplashScreen} />
        <Stack.Screen name="options" component={options} />
        <Stack.Screen name="signup" component={Signup} />
        <Stack.Screen name="login" component={Login} />
        <Stack.Screen name="otp" component={Otp} />
        <Stack.Screen name="profile" component={ProfileScreen} />
        <Stack.Screen name="location" component={LocationScreen} />
        <Stack.Screen name="Home" component={Homescreen} />
        <Stack.Screen name="setting" component={Setting} />
        <Stack.Screen name="chat" component={chat} />
        <Stack.Screen name="massage" component={MessagesScreen} />
        <Stack.Screen name="notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDE2E0',
  },
});