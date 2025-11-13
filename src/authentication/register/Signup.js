import React, { useState, useEffect } from 'react';
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
  PixelRatio,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useLanguage } from '../../context/LanguageContext';
import Svg, { Path } from 'react-native-svg';

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
const INPUT_WIDTH = Math.min(SCREEN_WIDTH - moderateScale(60), moderateScale(348));
const BUTTON_WIDTH = Math.min(SCREEN_WIDTH - moderateScale(70), moderateScale(338));

// Google Logo SVG Component
const GoogleLogo = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <Path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <Path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <Path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </Svg>
);

const Signup = ({ navigation }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Configure Google Sign-In with better error handling
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        await GoogleSignin.configure({
          webClientId: '460156669437-aruvatddasgqkng7v7se6c7nrfit3f5q.apps.googleusercontent.com',
          offlineAccess: true,
          hostedDomain: '',
          forceCodeForRefreshToken: true,
        });
        console.log('Google Sign-In configured successfully');
      } catch (error) {
        console.error('Google Sign-In configuration error:', error);
      }
    };

    configureGoogleSignIn();
  }, []);

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Save user data to Firestore - UPDATED to preserve existing name
  const saveUserToFirestore = async (userId, userData, isExistingUser = false) => {
    try {
      console.log('Saving user data to Firestore:', { userId, userData, isExistingUser });
      
      if (isExistingUser) {
        // Existing user - fetch current data and preserve name
        const userDoc = await firestore()
          .collection('Useraccount')
          .doc(userId)
          .get();
        
        const existingData = userDoc.exists ? userDoc.data() : {};
        
        await firestore()
          .collection('Useraccount')
          .doc(userId)
          .set({
            // Preserve existing name, otherwise use Google name (will be overwritten in profile screen)
            name: existingData.name || userData.name || '',
            email: userData.email || existingData.email || '',
            photoURL: userData.photoURL || existingData.photoURL || '',
            // Preserve existing gender and location
            gender: existingData.gender || '',
            location: existingData.location || '',
            updatedAt: firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        
        console.log('Existing user data updated (name preserved)');
      } else {
        // New user - create with empty name (will be filled in profile screen)
        await firestore()
          .collection('Useraccount')
          .doc(userId)
          .set({
            name: '', // Leave empty for new users - will be filled in profile screen
            email: userData.email || '',
            gender: userData.gender || '',
            location: userData.location || '',
            photoURL: userData.photoURL || '',
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        
        console.log('New user data saved successfully to Firestore');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if user profile is complete
  const checkUserProfile = async (userId) => {
    try {
      const userDoc = await firestore()
        .collection('Useraccount')
        .doc(userId)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        
        if (!userData) {
          console.log('User document exists but data is undefined');
          return { complete: false, needsLocation: false, needsProfile: true };
        }
        
        console.log('User profile data:', userData);
        
        // Check if all required fields are present
        if (userData.name && userData.gender && userData.location) {
          return { complete: true, needsLocation: false, needsProfile: false };
        } else if (userData.name && userData.gender) {
          return { complete: false, needsLocation: true, needsProfile: false };
        } else {
          return { complete: false, needsLocation: false, needsProfile: true };
        }
      } else {
        console.log('User document does not exist');
        return { complete: false, needsLocation: false, needsProfile: true };
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      return { complete: false, needsLocation: false, needsProfile: true };
    }
  };

  // Get translated error message for signup
  const getSignupErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return t('signup.emailAlreadyInUse');
      case 'auth/invalid-email':
        return t('signup.invalidEmail');
      case 'auth/operation-not-allowed':
        return t('signup.operationNotAllowed');
      case 'auth/weak-password':
        return t('signup.weakPassword');
      case 'auth/network-request-failed':
        return t('signup.networkError');
      case 'auth/too-many-requests':
        return t('signup.tooManyRequests');
      default:
        return t('signup.unexpectedError');
    }
  };

  // Firebase create user account function
  const createUserAccount = async (email, password) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('User account created successfully:', user.uid);
      
      // Save user to Firestore
      await saveUserToFirestore(user.uid, {
        name: '',
        email: user.email,
        gender: '',
        location: '',
        photoURL: '',
      });
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        message: 'Account created successfully!'
      };
      
    } catch (error) {
      console.error('Error creating user account:', error);
      
      return {
        success: false,
        error: getSignupErrorMessage(error.code),
        code: error?.code || 'unknown'
      };
    }
  };

  // Get translated error message for Google Sign-In
  const getGoogleErrorMessage = (errorCode) => {
    switch (errorCode) {
      case statusCodes.SIGN_IN_CANCELLED:
        return t('signup.signInCancelled');
      case statusCodes.IN_PROGRESS:
        return t('signup.signInInProgress');
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return t('signup.playServicesUnavailable');
      case 'auth/account-exists-with-different-credential':
        return t('signup.accountExists');
      case 'auth/invalid-credential':
        return t('signup.invalidCredential');
      case 'auth/network-request-failed':
        return t('signup.networkError');
      case 'auth/user-disabled':
        return t('signup.userDisabled');
      case 'auth/operation-not-allowed':
        return t('signup.operationNotAllowedGoogle');
      case 'auth/configuration-not-found':
        return t('signup.configurationNotFound');
      default:
        return t('signup.googleSignInFailed');
    }
  };

  // Google Sign-In function with Firestore save and proper navigation
  const signInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage('');

      console.log('Starting Google Sign-In process...');

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Play Services available');
      
      const signInResult = await GoogleSignin.signIn();
      console.log('Google Sign-In result:', signInResult);
      
      let idToken, user;
      
      if (signInResult.type === 'success') {
        idToken = signInResult.data?.idToken;
        user = signInResult.data?.user;
        console.log('Using new response format');
      } else if (signInResult.idToken) {
        idToken = signInResult.idToken;
        user = signInResult.user;
        console.log('Using old response format');
      }
      
      if (!idToken) {
        console.error('Sign-In result structure:', JSON.stringify(signInResult));
        throw new Error('Failed to get user credentials from Google Sign-In');
      }
      
      console.log('Got ID token and user data');
      console.log('Google user info:', user);
      
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      console.log('Firebase authentication successful:', userCredential.user);
      
      // Check if user document exists in Firestore BEFORE saving
      const userDocBefore = await firestore()
        .collection('Useraccount')
        .doc(userCredential.user.uid)
        .get();
      
      const isExistingUser = userDocBefore.exists;
      
      console.log('Is existing user:', isExistingUser);
      
      // Save or update user data - pass isExistingUser flag
      const saveResult = await saveUserToFirestore(
        userCredential.user.uid,
        {
          name: user?.name || user?.givenName || userCredential.user.displayName || '',
          email: user?.email || userCredential.user.email || '',
          gender: '',
          location: '',
          photoURL: user?.photo || userCredential.user.photoURL || '',
        },
        isExistingUser
      );
      
      if (!saveResult.success) {
        console.error('Failed to save user to Firestore, but authentication was successful');
      }
      
      // Navigate based on whether user is new or existing
      if (!isExistingUser) {
        // New user - navigate to profile screen
        console.log('New user detected - navigating to profile');
        navigation.navigate('profile');
      } else {
        // Existing user - check profile completeness
        console.log('Existing user detected - checking profile completeness');
        const profileStatus = await checkUserProfile(userCredential.user.uid);
        
        if (profileStatus.complete) {
          // Profile complete - go to Home
          console.log('Profile complete - navigating to Home');
          navigation.navigate('Home');
        } else if (profileStatus.needsProfile) {
          // Missing name/gender - go to profile
          console.log('Profile incomplete - navigating to profile');
          navigation.navigate('profile');
        } else if (profileStatus.needsLocation) {
          // Missing location - go to location
          console.log('Location missing - navigating to location');
          navigation.navigate('location');
        }
      }
      
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      let errorMessage = getGoogleErrorMessage(error?.code);
      
      if (error && typeof error === 'object' && error.message && !error.code) {
        errorMessage = error.message;
      }
      
      if (error?.code !== statusCodes.SIGN_IN_CANCELLED) {
        setErrorMessage(errorMessage);
      }
      
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle create account with email/password
  const handleCreateAccount = async () => {
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage(t('signup.enterEmailError'));
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage(t('signup.validEmailError'));
      return;
    }

    if (!password.trim()) {
      setErrorMessage(t('signup.enterPasswordError'));
      return;
    }

    if (password.length < 8) {
      setErrorMessage(t('signup.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const result = await createUserAccount(email.trim(), password);

      if (result.success) {
        navigation.navigate('otp');
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      console.error('Create account error:', error);
      setErrorMessage(t('signup.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    await signInWithGoogle();
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
          >
            <View style={styles.backButtonContainer}>
              <View style={styles.arrowContainer}>
                <Text style={styles.backArrow}>‹</Text>
              </View>
              <Text style={styles.backText}>{t('signup.back')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('signup.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('signup.subtitle')}</Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, errorMessage && styles.textInputError]}
              placeholder={t('signup.enterEmail')}
              placeholderTextColor="#A68FA6"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading && !googleLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, errorMessage && styles.textInputError]}
              placeholder={t('signup.createPassword')}
              placeholderTextColor="#A68FA6"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading && !googleLoading}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading || googleLoading}
            >
              <View style={styles.eyeIcon}>
                <Text style={styles.eyeText}>👁</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Create Account Button */}
          <TouchableOpacity 
            style={[styles.createButton, (loading || googleLoading) && styles.createButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleCreateAccount}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>{t('signup.createButton')}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerSection}>
            <Text style={styles.dividerText}>{t('signup.orSignUpWith')}</Text>
          </View>

          {/* Google Button */}
          <TouchableOpacity 
            style={[styles.googleButton, (loading || googleLoading) && styles.googleButtonDisabled]}
            activeOpacity={0.7}
            disabled={loading || googleLoading}
            onPress={handleGoogleSignUp}
          >
            <View style={styles.googleButtonContent}>
              {googleLoading ? (
                <ActivityIndicator size="small" color="#5D4A5D" style={{ marginRight: moderateScale(12) }} />
              ) : (
                <View style={styles.googleIconWrapper}>
                  <GoogleLogo size={moderateScale(20)} />
                </View>
              )}
              <Text style={styles.googleButtonText}>
                {googleLoading ? t('signup.signingIn') : t('signup.signUpWithGoogle')}
              </Text>
            </View>
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
    marginBottom: verticalScale(60),
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
    paddingHorizontal: moderateScale(20),
  },
  inputContainer: {
    position: 'relative',
    marginBottom: moderateScale(20),
    width: '100%',
    alignItems: 'center',
  },
  textInput: {
    width: INPUT_WIDTH,
    height: moderateScale(56),
    backgroundColor: '#EDCFC9',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    fontSize: scaleFont(16),
    color: '#2D1B47',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#EDCFC9',
    shadowColor: '#262628',
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(1),
    elevation: 4,
  },
  textInputError: {
    borderColor: '#D96073',
    borderWidth: 2,
  },
  eyeButton: {
    position: 'absolute',
    right: (SCREEN_WIDTH - INPUT_WIDTH) / 2 + moderateScale(20),
    top: '50%',
    marginTop: moderateScale(-12),
  },
  eyeIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: scaleFont(18),
    color: '#B8736B',
  },
  createButton: {
    width: BUTTON_WIDTH,
    height: moderateScale(54),
    backgroundColor: '#D96073',
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(32),
    marginBottom: moderateScale(30),
    shadowColor: '#262628',
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(12),
    elevation: 8,
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(217, 96, 115, 0.6)',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
  dividerSection: {
    alignItems: 'center',
    marginBottom: moderateScale(25),
  },
  dividerText: {
    fontSize: scaleFont(15),
    color: '#8B7B8B',
    fontWeight: '500',
  },
  googleButton: {
    width: BUTTON_WIDTH,
    height: moderateScale(54),
    backgroundColor: 'rgba(237, 207, 201, 0.6)',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(237, 207, 201, 0.8)',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIconWrapper: {
    marginRight: moderateScale(12),
  },
  googleButtonText: {
    fontSize: scaleFont(16),
    color: '#5D4A5D',
    fontWeight: '500',
  },
});

export default Signup;