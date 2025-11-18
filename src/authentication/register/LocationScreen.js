import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  PixelRatio,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Geolocation from 'react-native-geolocation-service';
import { reverseGeocode } from '../../context/geocodingService'; 
import { useLanguage } from '../../context/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const scaleFont = (size) => {
  const scaledSize = (SCREEN_WIDTH / 375) * size;
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

const BUTTON_WIDTH = Math.min(SCREEN_WIDTH - moderateScale(70), moderateScale(338));

const LocationScreen = ({ navigation }) => {
  const { t, currentLanguage } = useLanguage();
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  useEffect(() => {
    checkInitialPermission();
  }, []);

  const checkInitialPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (!granted) {
          setPermissionBlocked(true);
          setErrorMessage('Location permission is required. Please enable it in Settings.');
        }
      } catch (error) {
        console.error('Error checking permission:', error);
      }
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      try {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        console.log('iOS Location auth:', auth);
        
        if (auth === 'granted') {
          setPermissionBlocked(false);
          return true;
        } else if (auth === 'denied' || auth === 'restricted') {
          setPermissionBlocked(true);
          Alert.alert(
            'Location Permission Required',
            'Please enable location permissions in Settings to use this feature.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => Linking.openSettings()
              }
            ]
          );
          return false;
        }
        return false;
      } catch (error) {
        console.error('iOS permission error:', error);
        return false;
      }
    }

    // Android
    try {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (alreadyGranted) {
        setPermissionBlocked(false);
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to find matches near you.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      console.log('Android permission result:', granted);

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Location permission granted');
        setPermissionBlocked(false);
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN || granted === 'never_ask_again') {
        console.log('❌ Permission permanently denied');
        setPermissionBlocked(true);
        
        Alert.alert(
          '⚠️ Location Permission Blocked',
          'Location permission has been permanently denied. Please enable it manually in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return false;
      } else {
        console.log('❌ Permission denied');
        setPermissionBlocked(true);
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature.'
        );
        return false;
      }
    } catch (err) {
      console.error('Android permission error:', err);
      Alert.alert('Error', 'Failed to request location permission: ' + err.message);
      return false;
    }
  };

  const getUserLocation = async () => {
    console.log('=== Starting location fetch ===');
    setFetchingLocation(true);
    setErrorMessage('');

    try {
      const hasPermission = await requestLocationPermission();
      console.log('Has permission:', hasPermission);

      if (!hasPermission) {
        setFetchingLocation(false);
        setErrorMessage('Location permission denied. Please enable it in Settings.');
        setPermissionBlocked(true);
        return;
      }

      console.log('Calling getCurrentPosition...');

      Geolocation.getCurrentPosition(
        async (position) => {
          console.log('✅ SUCCESS - Position received:', position);
          const { latitude, longitude, accuracy } = position.coords;

          // Get location name from coordinates
          console.log('🔍 Fetching location name...');
          const geocodeResult = await reverseGeocode(latitude, longitude);
          
          if (geocodeResult) {
            console.log('✅ Location name:', geocodeResult.city);
            setLocationName(geocodeResult.city);
            
            setLocation({
              latitude,
              longitude,
              accuracy,
              city: geocodeResult.city,
              country: geocodeResult.country,
              fullAddress: geocodeResult.fullAddress,
            });
          } else {
            console.log('⚠️ Could not get location name');
            setLocationName('Location Found');
            setLocation({
              latitude,
              longitude,
              accuracy,
            });
          }

          console.log('Location set with name');
          setFetchingLocation(false);
          setErrorMessage('');
          setPermissionBlocked(false);
        },
        (error) => {
          console.error('❌ ERROR - Geolocation error:', error);
          setFetchingLocation(false);

          let errorMsg = '';
          let errorTitle = 'Location Error';

          switch (error.code) {
            case 1:
              errorMsg = 'Location permission was denied. Please enable location access in Settings.';
              errorTitle = '⚠️ Permission Denied';
              setPermissionBlocked(true);
              Alert.alert(
                errorTitle,
                errorMsg,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open Settings', onPress: () => Linking.openSettings() }
                ]
              );
              break;
            case 2:
              errorMsg = 'Could not determine your location. Please make sure GPS is enabled.';
              errorTitle = 'Location Unavailable';
              Alert.alert(
                errorTitle,
                errorMsg + '\n\nMake sure:\n• GPS is enabled\n• You are not in airplane mode\n• Location services are on',
                [
                  { text: 'OK', style: 'cancel' },
                  { text: 'Open Settings', onPress: () => Linking.openSettings() }
                ]
              );
              break;
            case 3:
              errorMsg = 'Location request timed out. Please try again.';
              errorTitle = 'Timeout';
              Alert.alert(errorTitle, errorMsg);
              break;
            default:
              errorMsg = `Failed to get location: ${error.message || 'Unknown error'}`;
              Alert.alert(errorTitle, errorMsg);
          }

          setErrorMessage(errorMsg);
        },
        {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
          distanceFilter: 0,
          forceRequestLocation: true,
          forceLocationManager: false,
          showLocationDialog: true,
        }
      );

    } catch (error) {
      console.error('CATCH - Error in getUserLocation:', error);
      setFetchingLocation(false);
      setErrorMessage('Unexpected error: ' + error.message);
      Alert.alert('Error', 'An unexpected error occurred: ' + error.message);
    }
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const saveUserLocation = async () => {
    if (!location) {
      setErrorMessage('Please get your location first');
      Alert.alert('Error', 'Please get your location first by clicking "Get My Location" button.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        setErrorMessage('No user logged in');
        setLoading(false);
        Alert.alert('Error', 'No user logged in');
        return;
      }

      const userId = currentUser.uid;

      // Save to Useraccount collection with both coordinates and city name
      await firestore()
        .collection('Useraccount')
        .doc(userId)
        .set(
          {
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              city: location.city || '',
              country: location.country || '',
              fullAddress: location.fullAddress || '',
            },
            updatedAt: firestore.FieldValue.serverTimestamp(),
            locationCompleted: true,
          },
          { merge: true }
        );

      console.log('✅ User location saved to Useraccount collection successfully!');
      navigation.navigate('Home');

    } catch (error) {
      console.error('❌ Error saving user location:', error);
      
      let errorMsg = 'Failed to save location. Please try again.';
      
      if (error.code === 'firestore/permission-denied') {
        errorMsg = 'Permission denied. Please check your account.';
      } else if (error.code === 'firestore/unavailable') {
        errorMsg = 'Network error. Please check your connection.';
      }
      
      setErrorMessage(errorMsg);
      Alert.alert('Error', errorMsg);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE2E0" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            disabled={loading || fetchingLocation}
          >
            <View style={styles.backButtonContainer}>
              <View style={styles.arrowContainer}>
                <Text style={styles.backArrow}>‹</Text>
              </View>
              <Text style={styles.backText}>Back</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            To get you the best matches please share your current location...
          </Text>
        </View>

        {/* Permission Blocked Warning */}
        {permissionBlocked && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Location permission is blocked. Please enable it in Settings to continue.
            </Text>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={openAppSettings}
              activeOpacity={0.8}
            >
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Message */}
        {errorMessage && !permissionBlocked ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Success Message with Location Name */}
        {location && !errorMessage ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>✓ Location detected!</Text>
            {locationName && (
              <Text style={styles.locationNameText}>📍 {locationName}</Text>
            )}
          </View>
        ) : null}

        {/* Location Action Section */}
        <View style={styles.formSection}>
          {/* Get Location Button */}
          <TouchableOpacity 
            style={[
              styles.locationButton,
              location && styles.locationButtonSuccess,
              fetchingLocation && styles.locationButtonDisabled
            ]}
            activeOpacity={0.8}
            onPress={getUserLocation}
            disabled={fetchingLocation || loading}
          >
            {fetchingLocation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.locationButtonText}>  Getting Location...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationButtonText}>
                  {location ? 'Update My Location' : 'Get My Location'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Complete Profile Button */}
          <TouchableOpacity 
            style={[
              styles.completeButton,
              (loading || !location) && styles.completeButtonDisabled
            ]}
            activeOpacity={0.8}
            onPress={saveUserLocation}
            disabled={loading || !location || fetchingLocation}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>Complete my profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE2E0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(40),
  },
  header: {
    marginTop: verticalScale(80),
    marginBottom: verticalScale(40),
  },
  backButton: {
    marginLeft: moderateScale(20),
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    backgroundColor: 'rgba(237, 207, 201, 0.8)',
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  backArrow: {
    fontSize: scaleFont(24),
    color: '#5D4A5D',
    fontWeight: 'bold',
  },
  backText: {
    fontSize: scaleFont(16),
    color: '#5D4A5D',
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: moderateScale(30),
    marginBottom: verticalScale(30),
  },
  title: {
    fontSize: scaleFont(32),
    fontWeight: 'bold',
    color: '#2D1B47',
    marginBottom: moderateScale(12),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: scaleFont(16),
    color: '#7A6B7A',
    lineHeight: scaleFont(22),
    fontWeight: '400',
  },
  warningContainer: {
    marginHorizontal: moderateScale(30),
    marginBottom: moderateScale(20),
    padding: moderateScale(20),
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: scaleFont(32),
    marginBottom: moderateScale(10),
  },
  warningText: {
    color: '#E65100',
    fontSize: scaleFont(14),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: moderateScale(15),
    lineHeight: scaleFont(20),
  },
  settingsButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(14),
    fontWeight: '700',
  },
  errorContainer: {
    marginHorizontal: moderateScale(30),
    marginBottom: moderateScale(20),
    padding: moderateScale(15),
    backgroundColor: 'rgba(217, 96, 115, 0.1)',
    borderRadius: moderateScale(8),
    borderLeftWidth: 4,
    borderLeftColor: '#D96073',
  },
  errorText: {
    color: '#D96073',
    fontSize: scaleFont(14),
    fontWeight: '500',
    textAlign: 'center',
  },
  successContainer: {
    marginHorizontal: moderateScale(30),
    marginBottom: moderateScale(20),
    padding: moderateScale(15),
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: moderateScale(8),
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    color: '#4CAF50',
    fontSize: scaleFont(16),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: moderateScale(5),
  },
  locationNameText: {
    color: '#2D1B47',
    fontSize: scaleFont(18),
    fontWeight: '700',
    textAlign: 'center',
    marginTop: moderateScale(8),
  },
  formSection: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(32),
    marginTop: moderateScale(20),
  },
  locationButton: {
    width: BUTTON_WIDTH,
    height: moderateScale(54),
    backgroundColor: '#8B7B8B',
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: moderateScale(20),
    shadowColor: '#262628',
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(12),
    elevation: 8,
  },
  locationButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  locationButtonDisabled: {
    backgroundColor: 'rgba(139, 123, 139, 0.6)',
  },
  locationIcon: {
    fontSize: scaleFont(20),
    marginRight: moderateScale(8),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  completeButton: {
    width: BUTTON_WIDTH,
    height: moderateScale(54),
    backgroundColor: '#D96073',
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(30),
    shadowColor: '#262628',
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(12),
    elevation: 8,
  },
  completeButtonDisabled: {
    backgroundColor: 'rgba(217, 96, 115, 0.4)',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
});

export default LocationScreen;