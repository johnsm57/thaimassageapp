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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

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
      setErrorMessage(t('locationScreen.selectLocationError'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Get current user
      const currentUser = auth().currentUser;

      if (!currentUser) {
        setErrorMessage(t('locationScreen.noUserLoggedIn'));
        setLoading(false);
        Alert.alert(t('locationScreen.error'), t('locationScreen.noUserLoggedIn'));
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

      // Navigate directly to Home without alert
      navigation.navigate('login');

    } catch (error) {
      console.error('Error saving user location:', error);
      
      let errorMsg = t('locationScreen.saveFailed');
      
      if (error.code === 'firestore/permission-denied') {
        errorMsg = t('locationScreen.permissionDenied');
      } else if (error.code === 'firestore/unavailable') {
        errorMsg = t('locationScreen.networkError');
      } else if (error.code === 'firestore/not-found') {
        errorMsg = t('locationScreen.profileNotFound');
      }
      
      setErrorMessage(errorMsg);
      Alert.alert(t('locationScreen.error'), errorMsg);
      
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
              <Text style={styles.backText}>{t('locationScreen.back')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('locationScreen.title')}</Text>
          <Text style={styles.subtitle}>{t('locationScreen.subtitle')}</Text>
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
                {location ? getLocationLabel(location) : t('locationScreen.selectLocation')}
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
              <Text style={styles.completeButtonText}>{t('locationScreen.completeButton')}</Text>
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
    paddingBottom: 40,
  },
  header: {
    marginTop: 80,
    marginBottom: 40,
  },
  backButton: {
    marginLeft: 20,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(237, 207, 201, 0.8)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backArrow: {
    fontSize: 24,
    color: '#5D4A5D',
    fontWeight: 'bold',
  },
  backText: {
    fontSize: 16,
    color: '#5D4A5D',
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: 30,
    marginBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D1B47',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7A6B7A',
    lineHeight: 22,
    fontWeight: '400',
  },
  errorContainer: {
    marginHorizontal: 30,
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(217, 96, 115, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D96073',
  },
  errorText: {
    color: '#D96073',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  formSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  locationContainer: {
    width: 348,
    marginBottom: 30,
    position: 'relative',
  },
  dropdownInput: {
    width: 348,
    height: 56,
    backgroundColor: '#EDCFC9',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#D96073',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownTextPlaceholder: {
    color: '#A68FA6',
  },
  dropdownTextSelected: {
    color: '#2D1B47',
  },
  dropdownArrow: {
    marginLeft: 10,
  },
  dropdownArrowText: {
    fontSize: 20,
    color: '#D96073',
    fontWeight: 'bold',
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  locationOptionsContainer: {
    width: 348,
    maxHeight: 250,
    backgroundColor: '#EDCFC9',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: '#EDCFC9',
    borderTopWidth: 0,
    position: 'absolute',
    top: 56,
    zIndex: 10,
  },
  locationScrollView: {
    maxHeight: 250,
  },
  locationOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 123, 139, 0.2)',
  },
  locationOptionItemLast: {
    borderBottomWidth: 0,
  },
  locationOptionText: {
    fontSize: 16,
    color: '#2D1B47',
    fontWeight: '500',
  },
  radioButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  completeButton: {
    width: 338,
    height: 54,
    backgroundColor: '#D96073',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#262628',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  completeButtonDisabled: {
    backgroundColor: 'rgba(217, 96, 115, 0.6)',
  },
  completeButtonCollapsed: {
    marginTop: 50,
  },
  completeButtonExpanded: {
    marginTop: 300,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default LocationScreen;