import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" component={SplashScreen}/>
        <Stack.Screen name="options" component={options} />
        <Stack.Screen name="signup" component={Signup} />
        <Stack.Screen name="login" component={Login} />
        <Stack.Screen name="otp" component={Otp} />
        <Stack.Screen name="profile" component={ProfileScreen} />
        <Stack.Screen name="location" component={LocationScreen} />
        <Stack.Screen name="Home" component={Homescreen} />
        <Stack.Screen name="setting" component={Setting} />
        <Stack.Screen name="chat" component={chat} />
        <Stack.Screen name="massage" component={MessagesScreen}/>
        <Stack.Screen name="notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}