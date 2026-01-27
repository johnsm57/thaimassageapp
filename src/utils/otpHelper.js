import firestore from '@react-native-firebase/firestore';

// Production backend URL
const BACKEND_URL = 'https://api-4evlextkmq-uc.a.run.app';

/**
 * Generate a 4-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Save OTP to Firestore and send email via backend
 */
export const saveOTPAndSendEmail = async (email) => {
  try {
    console.log('🔐 Starting OTP generation for:', email);
    
    // Generate OTP
    const otp = generateOTP();
    console.log('📱 Generated OTP:', otp); // For development - REMOVE IN PRODUCTION
    
    // Save to Firestore first
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime. getMinutes() + 10); // 10 minutes expiry

    console.log('💾 Saving OTP to Firestore...');
    await firestore()
      .collection('OTPVerification')
      .doc(email)
      .set({
        otp: otp,
        email: email,
        createdAt: firestore.FieldValue.serverTimestamp(),
        expiresAt: firestore. Timestamp.fromDate(expirationTime),
        verified: false,
        attempts: 0,
      });

    console.log('✅ OTP saved to Firestore');

    // Send email via backend
    console.log('📧 Sending email via backend...');
    const response = await fetch(`${BACKEND_URL}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON. stringify({
        email: email,
        otp: otp,
      }),
    });

    const data = await response.json();
    console.log('📨 Backend response:', data);

    if (!response.ok || !data.success) {
      console.error('❌ Email sending failed:', data.error);
      
      // Delete OTP from Firestore if email failed
      await firestore()
        .collection('OTPVerification')
        .doc(email)
        .delete();
      
      return { 
        success: false, 
        error: data.error || 'Failed to send verification email.  Please try again.' 
      };
    }

    console.log('✅ Email sent successfully');
    return { 
      success: true, 
      message: 'OTP sent successfully to your email' 
    };
    
  } catch (error) {
    console.error('❌ Error in saveOTPAndSendEmail:', error);
    
    // Try to clean up
    try {
      await firestore()
        .collection('OTPVerification')
        .doc(email)
        .delete();
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    // Check for network errors
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      return { 
        success: false, 
        error: 'Network error. Please check your internet connection and make sure backend is running.' 
      };
    }
    
    return { 
      success: false, 
      error: 'Failed to generate verification code. Please try again.' 
    };
  }
};

/**
 * Verify OTP from Firestore
 */
export const verifyOTPFromFirestore = async (email, enteredOTP) => {
  try {
    console.log('🔍 Verifying OTP for:', email);
    
    const otpDoc = await firestore()
      .collection('OTPVerification')
      .doc(email)
      .get();

    if (!otpDoc.exists) {
      console.log('❌ OTP document not found');
      return { 
        success: false, 
        error: 'OTP not found. Please request a new one.' 
      };
    }

    const otpData = otpDoc.data();
    const currentTime = new Date();
    const expirationTime = otpData.expiresAt. toDate();

    console.log('📋 OTP Data:', {
      stored: otpData.otp,
      entered: enteredOTP,
      expired: currentTime > expirationTime,
      attempts: otpData.attempts,
    });

    // Check if OTP has expired
    if (currentTime > expirationTime) {
      console.log('⏰ OTP has expired');
      await firestore()
        .collection('OTPVerification')
        .doc(email)
        .delete();
      
      return { 
        success:  false, 
        error: 'OTP has expired. Please request a new one.' 
      };
    }

    // Check if already verified
    if (otpData.verified) {
      console.log('✅ OTP already verified');
      return { 
        success:  false, 
        error: 'OTP has already been used.' 
      };
    }

    // Check maximum attempts (prevent brute force)
    if (otpData.attempts >= 5) {
      console.log('🚫 Too many attempts');
      await firestore()
        .collection('OTPVerification')
        .doc(email)
        .delete();
      
      return { 
        success: false, 
        error: 'Too many failed attempts. Please request a new OTP.' 
      };
    }

    // Verify OTP
    if (otpData.otp === enteredOTP) {
      console.log('✅ OTP verified successfully');
      
      // Mark OTP as verified
      await firestore()
        .collection('OTPVerification')
        .doc(email)
        .update({
          verified: true,
          verifiedAt: firestore.FieldValue.serverTimestamp(),
        });

      return { success: true };
    } else {
      console.log('❌ Invalid OTP');
      
      // Increment failed attempts
      await firestore()
        .collection('OTPVerification')
        .doc(email)
        .update({
          attempts: firestore.FieldValue.increment(1),
        });

      const remainingAttempts = 5 - (otpData.attempts + 1);
      return { 
        success: false, 
        error: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' :  ''} remaining.` 
      };
    }
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return { 
      success: false, 
      error: 'Verification failed. Please try again.' 
    };
  }
};

/**
 * Delete OTP after successful verification
 */
export const deleteOTP = async (email) => {
  try {
    await firestore()
      .collection('OTPVerification')
      .doc(email)
      .delete();
    
    console.log('🗑️ OTP deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting OTP:', error);
    return { success: false };
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (email) => {
  try {
    console. log('🔄 Resending OTP to:', email);
    
    // Delete old OTP
    await deleteOTP(email);
    
    // Generate and send new OTP
    const result = await saveOTPAndSendEmail(email);
    
    return result;
  } catch (error) {
    console.error('❌ Error resending OTP:', error);
    return { 
      success: false, 
      error: 'Failed to resend OTP. Please try again.' 
    };
  }
};