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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useLanguage } from '../../context/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const scaleFont = (size) => {
  const scaledSize = (SCREEN_WIDTH / 375) * size;
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

// Responsive dimensions
const DROPDOWN_WIDTH = Math.min(SCREEN_WIDTH - moderateScale(60), moderateScale(348));
const BUTTON_WIDTH = Math.min(SCREEN_WIDTH - moderateScale(70), moderateScale(338));
const MAX_DROPDOWN_HEIGHT = Math.min(verticalScale(250), SCREEN_HEIGHT * 0.35);

const LocationScreen = ({ navigation }) => {
  const { t, currentLanguage } = useLanguage();
  const [location, setLocation] = useState('');
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Bangkok locations with translation keys
  const bangkokLocations = [
    { value: 'Sukhumvit', key: 'sukhumvit' },
    { value: 'Silom', key: 'silom' },
    { value: 'Siam', key: 'siam' },
    { value: 'Chatuchak', key: 'chatuchak' },
    { value: 'Thonglor', key: 'thonglor' },
    { value: 'Ekkamai', key: 'ekkamai' },
    { value: 'Phrom Phong', key: 'phromPhong' },
    { value: 'Asok', key: 'asok' },
    { value: 'Sathorn', key: 'sathorn' },
    { value: 'Lumpini', key: 'lumpini' },
    { value: 'Ratchathewi', key: 'ratchathewi' },
    { value: 'Phaya Thai', key: 'phayaThai' },
    { value: 'Dusit', key: 'dusit' },
    { value: 'Bangsue', key: 'bangsue' },
    { value: 'Huai Khwang', key: 'huaiKhwang' },
    { value: 'Wang Thonglang', key: 'wangThonglang' },
    { value: 'Lat Phrao', key: 'latPhrao' },
    { value: 'Khlong Toei', key: 'khlongToei' },
    { value: 'Watthana', key: 'watthana' },
    { value: 'Bang Rak', key: 'bangRak' },
  ];

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setShowLocationOptions(false);
    if (errorMessage) setErrorMessage('');
  };

  // Get translated location label
  const getLocationLabel = (value) => {
    const locationObj = bangkokLocations.find(loc => loc.value === value);
    if (locationObj) {
      return t(`locationScreen.locations.${locationObj.key}`);
    }
    return value;
  };

  // Save location to Firestore
 const saveUserLocation = async () => {
  // Validate location selection
  if (!location) {
    setErrorMessage('Please select a location');
    return;
  }

  setLoading(true);
  setErrorMessage('');

  try {
    // Get current user
    const currentUser = auth().currentUser;

    if (!currentUser) {
      setErrorMessage('No user logged in');
      setLoading(false);
      Alert.alert('Error', 'No user logged in');
      return;
    }

    const userId = currentUser.uid;

    // Update user document in Firestore with location
    await firestore()
      .collection('Useraccount')
      .doc(userId)
      .set(
        {
          location: location, // Store the English value for consistency
          updatedAt: firestore.FieldValue.serverTimestamp(),
          locationCompleted: true,
        },
        { merge: true }
      );

    console.log('User location saved successfully!');

    // Navigate to Home instead of login
    navigation.navigate('Home');

  } catch (error) {
    console.error('Error saving user location:', error);
    
    let errorMsg = 'Failed to save location. Please try again.';
    
    if (error.code === 'firestore/permission-denied') {
      errorMsg = 'Permission denied. Please check your account.';
    } else if (error.code === 'firestore/unavailable') {
      errorMsg = 'Network error. Please check your connection.';
    } else if (error.code === 'firestore/not-found') {
      errorMsg = 'Profile not found. Please contact support.';
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
            disabled={loading}
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
          <Text style={styles.subtitle}>To get you the best matches please enter your location...</Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Location Selection Section */}
        <View style={styles.formSection}>
          {/* Location Dropdown */}
          <View style={styles.locationContainer}>
            <TouchableOpacity 
              style={[
                styles.dropdownInput,
                showLocationOptions && styles.dropdownInputExpanded,
                errorMessage && !location && styles.dropdownInputError
              ]}
              onPress={() => !loading && setShowLocationOptions(!showLocationOptions)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={[
                styles.dropdownText,
                location ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder
              ]}>
                {location ? getLocationLabel(location) : 'Select your location'}
              </Text>
              <View style={styles.dropdownArrow}>
                <Text style={[
                  styles.dropdownArrowText,
                  showLocationOptions && styles.dropdownArrowUp
                ]}>
                  ⌄
                </Text>
              </View>
            </TouchableOpacity>

            {/* Location Options */}
            {showLocationOptions && (
              <View style={styles.locationOptionsContainer}>
                <ScrollView 
                  style={styles.locationScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {bangkokLocations.map((option, index) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.locationOptionItem,
                        index === bangkokLocations.length - 1 && styles.locationOptionItemLast
                      ]}
                      onPress={() => handleLocationSelect(option.value)}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <Text style={styles.locationOptionText}>
                        {t(`locationScreen.locations.${option.key}`)}
                      </Text>
                      <View style={styles.radioButtonContainer}>
                        <View style={[
                          styles.radioButton,
                          location === option.value && styles.radioButtonSelected
                        ]}>
                          {location === option.value && <View style={styles.radioButtonInner} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Complete Profile Button */}
          <TouchableOpacity 
            style={[
              styles.completeButton,
              showLocationOptions ? styles.completeButtonExpanded : styles.completeButtonCollapsed,
              loading && styles.completeButtonDisabled
            ]}
            activeOpacity={0.8}
            onPress={saveUserLocation}
            disabled={loading}
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
    marginBottom: verticalScale(80),
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
  formSection: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(32),
  },
  locationContainer: {
    width: DROPDOWN_WIDTH,
    marginBottom: moderateScale(30),
    position: 'relative',
  },
  dropdownInput: {
    width: DROPDOWN_WIDTH,
    height: moderateScale(56),
    backgroundColor: '#EDCFC9',
    borderTopLeftRadius: moderateScale(12),
    borderTopRightRadius: moderateScale(12),
    borderBottomLeftRadius: moderateScale(12),
    borderBottomRightRadius: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderWidth: 1,
    borderColor: '#D96073',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(1),
    elevation: 4,
  },
  dropdownInputExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownInputError: {
    borderColor: '#D96073',
    borderWidth: 2,
  },
  dropdownText: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    flex: 1,
  },
  dropdownTextPlaceholder: {
    color: '#A68FA6',
  },
  dropdownTextSelected: {
    color: '#2D1B47',
  },
  dropdownArrow: {
    marginLeft: moderateScale(10),
  },
  dropdownArrowText: {
    fontSize: scaleFont(20),
    color: '#D96073',
    fontWeight: 'bold',
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  locationOptionsContainer: {
    width: DROPDOWN_WIDTH,
    maxHeight: MAX_DROPDOWN_HEIGHT,
    backgroundColor: '#EDCFC9',
    borderBottomLeftRadius: moderateScale(12),
    borderBottomRightRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#EDCFC9',
    borderTopWidth: 0,
    position: 'absolute',
    top: moderateScale(56),
    zIndex: 10,
  },
  locationScrollView: {
    maxHeight: MAX_DROPDOWN_HEIGHT,
  },
  locationOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(20),
    minHeight: moderateScale(50),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 123, 139, 0.2)',
  },
  locationOptionItemLast: {
    borderBottomWidth: 0,
  },
  locationOptionText: {
    fontSize: scaleFont(16),
    color: '#2D1B47',
    fontWeight: '500',
    flex: 1,
    marginRight: moderateScale(10),
  },
  radioButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#D96073',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  radioButtonSelected: {
    backgroundColor: '#D96073',
  },
  radioButtonInner: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#FFFFFF',
  },
  completeButton: {
    width: BUTTON_WIDTH,
    height: moderateScale(54),
    backgroundColor: '#D96073',
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(217, 96, 115, 0.6)',
  },
  completeButtonCollapsed: {
    marginTop: moderateScale(50),
  },
  completeButtonExpanded: {
    marginTop: MAX_DROPDOWN_HEIGHT + moderateScale(50),
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
});

export default LocationScreen;