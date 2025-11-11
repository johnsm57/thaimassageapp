import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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

const ProfileScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [showGenderOptions, setShowGenderOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Gender options with translation keys
  const genderOptions = [
    { value: 'Male', label: t('profileScreen.male') },
    { value: 'Female', label: t('profileScreen.female') }
  ];

  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
    setShowGenderOptions(false);
    if (errorMessage) setErrorMessage('');
  };

  // Get translated gender label for display
  const getGenderLabel = (value) => {
    const option = genderOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Save user profile to Firestore
  const saveUserProfile = async () => {
    // Validate inputs
    if (!name.trim()) {
      setErrorMessage(t('profileScreen.enterNameError'));
      return;
    }

    if (!gender) {
      setErrorMessage(t('profileScreen.selectGenderError'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Get current user
      const currentUser = auth().currentUser;

      if (!currentUser) {
        setErrorMessage(t('profileScreen.noUserLoggedIn'));
        setLoading(false);
        return;
      }

      const userId = currentUser.uid;
      const userEmail = currentUser.email;

      // Prepare user data
      const userData = {
        uid: userId,
        email: userEmail,
        name: name.trim(),
        gender: gender, // Store the value (Male/Female) not the translation
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        profileCompleted: true,
      };

      // Save to Firestore 'Useraccount' collection
      await firestore()
        .collection('Useraccount')
        .doc(userId)
        .set(userData, { merge: true });

      console.log('User profile saved successfully!');

      // Navigate directly to location screen without alert
      navigation.navigate('location');

    } catch (error) {
      console.error('Error saving user profile:', error);
      
      let errorMsg = t('profileScreen.saveFailed');
      
      if (error.code === 'firestore/permission-denied') {
        errorMsg = t('profileScreen.permissionDenied');
      } else if (error.code === 'firestore/unavailable') {
        errorMsg = t('profileScreen.networkError');
      }
      
      setErrorMessage(errorMsg);
      Alert.alert(t('profileScreen.error'), errorMsg);
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
              <Text style={styles.backText}>{t('profileScreen.back')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('profileScreen.title')}</Text>
          <Text style={styles.subtitle}>{t('profileScreen.subtitle')}</Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, errorMessage && !name.trim() && styles.textInputError]}
              placeholder={t('profileScreen.enterName')}
              placeholderTextColor="#A68FA6"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Gender Dropdown */}
          <View style={styles.genderContainer}>
            <TouchableOpacity 
              style={[
                styles.dropdownInput,
                showGenderOptions && styles.dropdownInputExpanded,
                errorMessage && !gender && styles.textInputError
              ]}
              onPress={() => !loading && setShowGenderOptions(!showGenderOptions)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={[
                styles.dropdownText,
                gender ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder
              ]}>
                {gender ? getGenderLabel(gender) : t('profileScreen.selectGender')}
              </Text>
              <View style={styles.dropdownArrow}>
                <Text style={[
                  styles.dropdownArrowText,
                  showGenderOptions && styles.dropdownArrowUp
                ]}>
                  ⌄
                </Text>
              </View>
            </TouchableOpacity>

            {/* Gender Options */}
            {showGenderOptions && (
              <View style={styles.genderOptionsContainer}>
                {genderOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOptionItem,
                      index === genderOptions.length - 1 && styles.genderOptionItemLast
                    ]}
                    onPress={() => handleGenderSelect(option.value)}
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    <Text style={styles.genderOptionText}>{option.label}</Text>
                    <View style={styles.radioButtonContainer}>
                      <View style={[
                        styles.radioButton,
                        gender === option.value && styles.radioButtonSelected
                      ]}>
                        {gender === option.value && <View style={styles.radioButtonInner} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Complete Profile Button */}
          <TouchableOpacity 
            style={[
              styles.completeButton,
              showGenderOptions ? styles.completeButtonExpanded : styles.completeButtonCollapsed,
              loading && styles.completeButtonDisabled
            ]}
            activeOpacity={0.8}
            onPress={saveUserProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>{t('profileScreen.completeButton')}</Text>
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
  inputContainer: {
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  textInput: {
    width: width - 60,
    maxWidth: 348,
    height: 56,
    backgroundColor: '#EDCFC9',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2D1B47',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#D96073',
    shadowColor: '#262628',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 4,
  },
  textInputError: {
    borderColor: '#D96073',
    borderWidth: 2,
  },
  genderContainer: {
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
  genderOptionsContainer: {
    width: 348,
    height: 119,
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
  genderOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    height: 59.5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 123, 139, 0.2)',
  },
  genderOptionItemLast: {
    borderBottomWidth: 0,
  },
  genderOptionText: {
    fontSize: 18,
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
    marginTop: 170,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ProfileScreen;