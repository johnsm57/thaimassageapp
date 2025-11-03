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
  ActivityIndicator,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const { width } = Dimensions.get('window');

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Configure Google Sign-In
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

  // Check if user profile is complete
  const checkUserProfile = async (userId) => {
    try {
      const userDoc = await firestore()
        .collection('Useraccount')
        .doc(userId)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Add safety check for userData
        if (!userData) {
          console.log('User document exists but data is undefined');
          return { complete: false, needsLocation: false, needsProfile: true };
        }
        
        console.log('User profile data:', userData);
        
        // Check if profile is complete
        if (userData.name && userData.gender && userData.location) {
          return { complete: true, needsLocation: false, needsProfile: false };
        } else if (userData.name && userData.gender) {
          return { complete: false, needsLocation: true, needsProfile: false };
        } else {
          return { complete: false, needsLocation: false, needsProfile: true };
        }
      } else {
        // No profile exists, needs to complete profile
        console.log('User document does not exist');
        return { complete: false, needsLocation: false, needsProfile: true };
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      return { complete: false, needsLocation: false, needsProfile: true };
    }
  };

  // Firebase login function
  const loginUser = async (email, password) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('User logged in successfully:', user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
        }
      };
      
    } catch (error) {
      console.error('Error logging in:', error);
      
      let errorMessage = 'An error occurred while logging in.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please sign up first.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
  };

  // Google Sign-In function
  const signInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage('');

      console.log('Starting Google Sign-In process...');

      // Check if device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Play Services available');
      
      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();
      console.log('Google Sign-In result:', signInResult);
      
      // Handle the new response structure {type: 'success', data: {...}}
      let idToken, user;
      
      if (signInResult.type === 'success') {
        // New format: {type: 'success', data: {idToken, user}}
        idToken = signInResult.data?.idToken;
        user = signInResult.data?.user;
        console.log('Using new response format');
      } else if (signInResult.idToken) {
        // Old format: {idToken, user}
        idToken = signInResult.idToken;
        user = signInResult.user;
        console.log('Using old response format');
      }
      
      // Check if we got the required data
      if (!idToken) {
        console.error('Sign-In result structure:', JSON.stringify(signInResult));
        throw new Error('Failed to get user credentials from Google Sign-In');
      }
      
      console.log('Got ID token and user data');
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      console.log('Firebase authentication successful:', userCredential.user);
      
      // Check profile completion and navigate accordingly
      const profileStatus = await checkUserProfile(userCredential.user.uid);

      if (profileStatus.complete) {
        // Profile is complete, navigate to Home
        navigation.navigate('home');
      } else if (profileStatus.needsProfile) {
        // Needs to complete profile
        navigation.navigate('home');
      } else if (profileStatus.needsLocation) {
        // Needs to complete location
        navigation.navigate('location');
      }
      
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      let errorMessage = 'Google Sign-In failed. Please try again.';
      
      // Check if error exists and has a code property
      if (error && typeof error === 'object') {
        if (error.code) {
          switch (error.code) {
            case statusCodes.SIGN_IN_CANCELLED:
              errorMessage = 'Sign-in was cancelled by user.';
              break;
            case statusCodes.IN_PROGRESS:
              errorMessage = 'Sign-in is already in progress.';
              break;
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
              errorMessage = 'Google Play Services not available or outdated.';
              break;
            case 'auth/account-exists-with-different-credential':
              errorMessage = 'An account already exists with a different sign-in method.';
              break;
            case 'auth/invalid-credential':
              errorMessage = 'Invalid credentials. Please try again.';
              break;
            case 'auth/network-request-failed':
              errorMessage = 'Network error. Please check your internet connection.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'This account has been disabled. Please contact support.';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Google Sign-In is not enabled. Please contact support.';
              break;
            default:
              errorMessage = error.message || 'Google Sign-In failed. Please try again.';
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      // Only set error message if sign-in wasn't cancelled
      if (error?.code !== statusCodes.SIGN_IN_CANCELLED) {
        setErrorMessage(errorMessage);
      }
      
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle login with email/password
  const handleLogin = async () => {
    // Clear previous error
    setErrorMessage('');

    // Validate inputs
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(email.trim(), password);

      if (result.success) {
        // Login successful - Check profile completion
        const profileStatus = await checkUserProfile(result.user.uid);

        if (profileStatus.complete) {
          // Profile is complete, navigate to Home
          navigation.navigate('home');
        } else if (profileStatus.needsProfile) {
          // Needs to complete profile
          navigation.navigate('profile');
        } else if (profileStatus.needsLocation) {
          // Needs to complete location
          navigation.navigate('location');
        }
      } else {
        // Show error message
        setErrorMessage(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email.trim());
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      let errorMsg = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email address.';
      }
      
      Alert.alert('Error', errorMsg);
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
            disabled={loading || googleLoading}
          >
            <View style={styles.backButtonContainer}>
              {/* Arrow with background circle */}
              <View style={styles.arrowContainer}>
                <Text style={styles.backArrow}>‹</Text>
              </View>
              <Text style={styles.backText}>Back</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Welcome Back !</Text>
          <Text style={styles.subtitle}>let's get you back to effortless{'\n'}massage booking...</Text>
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
              placeholder="Enter your email"
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
              placeholder="what's your password?"
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

          {/* Forgot Password Link */}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleForgotPassword}
              disabled={loading || googleLoading}
            >
              <Text style={styles.forgotPasswordText}>forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, (loading || googleLoading) && styles.loginButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login to my account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerSection}>
            <Text style={styles.dividerText}>or log in with</Text>
          </View>

          {/* Google Button */}
          <TouchableOpacity 
            style={[styles.googleButton, (loading || googleLoading) && styles.googleButtonDisabled]}
            activeOpacity={0.7}
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}
          >
            <View style={styles.googleButtonContent}>
              {googleLoading ? (
                <ActivityIndicator size="small" color="#5D4A5D" style={{ marginRight: 12 }} />
              ) : (
                <View style={styles.googleIcon}>
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleBlue}>G</Text>
                    <Text style={styles.googleRed}>o</Text>
                    <Text style={styles.googleYellow}>o</Text>
                    <Text style={styles.googleBlue}>g</Text>
                    <Text style={styles.googleGreen}>l</Text>
                    <Text style={styles.googleRed}>e</Text>
                  </View>
                </View>
              )}
              <Text style={styles.googleButtonText}>
                {googleLoading ? 'Logging in...' : 'Log in with google'}
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
    marginBottom: 60,
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
    paddingHorizontal: 20,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
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
    borderColor: '#EDCFC9',
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
  eyeButton: {
    position: 'absolute',
    right: 40,
    top: '50%',
    marginTop: -12,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 18,
    color: '#B8736B',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginRight: 30,
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#D96073',
    fontWeight: '500',
  },
  loginButton: {
    width: width - 70,
    maxWidth: 338,
    height: 54,
    backgroundColor: '#D96073',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 30,
    shadowColor: '#262628',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(217, 96, 115, 0.6)',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dividerSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  dividerText: {
    fontSize: 15,
    color: '#8B7B8B',
    fontWeight: '500',
  },
  googleButton: {
    width: width - 70,
    maxWidth: 338,
    height: 54,
    backgroundColor: 'rgba(237, 207, 201, 0.6)',
    borderRadius: 12,
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
  googleIcon: {
    marginRight: 12,
  },
  googleIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleBlue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleRed: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EA4335',
  },
  googleYellow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FBBC05',
  },
  googleGreen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34A853',
  },
  googleButtonText: {
    fontSize: 16,
    color: '#5D4A5D',
    fontWeight: '500',
  },
});

export default Login;