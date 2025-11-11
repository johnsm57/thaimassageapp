import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

const Otp = ({ navigation }) => {
  const { t } = useLanguage();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleOtpChange = (value, index) => {
    // Only allow numeric input
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = () => {
    // Check if all OTP digits are filled
    const isComplete = otp.every(digit => digit !== '');
    
    if (isComplete) {
      // Navigate to profile screen
      navigation.navigate('profile');
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
          >
            <View style={styles.backButtonContainer}>
              {/* Arrow with background circle */}
              <View style={styles.arrowContainer}>
                <Text style={styles.backArrow}>‹</Text>
              </View>
              <Text style={styles.backText}>{t('otp.back')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('otp.title')}</Text>
          <Text style={styles.subtitle}>{t('otp.subtitle')}</Text>
        </View>

        {/* OTP Input Section */}
        <View style={styles.otpSection}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpInputContainer}>
                <TextInput
                  ref={inputRefs[index]}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : {},
                    index === 0 && digit ? styles.otpInputActive : {},
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                />
                {/* Underline for empty inputs */}
                {!digit && <View style={styles.otpUnderline} />}
              </View>
            ))}
          </View>
        </View>

        {/* Verify Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.verifyButton}
            activeOpacity={0.8}
            onPress={handleVerify}
          >
            <Text style={styles.verifyButtonText}>{t('otp.verifyButton')}</Text>
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
  otpSection: {
    alignItems: 'center',
    marginBottom: 120,
    paddingHorizontal: 30,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
  },
  otpInputContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(237, 207, 201, 0.6)',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B47',
    borderWidth: 2,
    borderColor: 'rgba(237, 207, 201, 0.8)',
  },
  otpInputFilled: {
    backgroundColor: 'rgba(237, 207, 201, 0.8)',
    borderColor: '#D96073',
  },
  otpInputActive: {
    borderColor: '#D96073',
    borderWidth: 2,
  },
  otpUnderline: {
    position: 'absolute',
    bottom: 15,
    width: 20,
    height: 2,
    backgroundColor: '#8B7B8B',
    borderRadius: 1,
  },
  buttonSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  verifyButton: {
    width: width - 60,
    maxWidth: 338,
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
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default Otp;