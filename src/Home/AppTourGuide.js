import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  PixelRatio,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const scaleFont = (size) => {
  const scaledSize = (SCREEN_WIDTH / 375) * size;
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

const AppTourGuide = ({ onComplete, tourSteps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkIfFirstTime();
  }, []);

  useEffect(() => {
    if (isVisible) {
      fadeIn();
      if (tourSteps[currentStep]?.targetPosition) {
        startPulseAnimation();
      }
    }
  }, [isVisible, currentStep]);

  const checkIfFirstTime = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userDoc = await firestore()
          .collection('Useraccount')
          .doc(currentUser.uid)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          if (!userData.tourCompleted) {
            setIsVisible(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking tour status:', error);
    }
  };

  const startPulseAnimation = () => {
    pulseAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fadeIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fadeOut = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      fadeOut(() => {
        setCurrentStep(currentStep + 1);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);
      });
    } else {
      completeTour();
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await firestore()
          .collection('Useraccount')
          .doc(currentUser.uid)
          .update({
            tourCompleted: true,
            tourCompletedAt: firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (error) {
      console.error('Error updating tour status:', error);
    }

    fadeOut(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    });
  };

  if (!isVisible || !tourSteps || tourSteps.length === 0) {
    return null;
  }

  const step = tourSteps[currentStep];

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        {/* Dimmed background */}
        <Animated.View style={[styles.dimBackground, { opacity: fadeAnim }]} />

        {/* Highlight with rounded border for target elements */}
        {step.targetPosition && (
          <Animated.View
            style={[
              styles.spotlight,
              {
                top: step.targetPosition.top - moderateScale(4),
                left: step.targetPosition.left - moderateScale(4),
                width: step.targetPosition.width + moderateScale(8),
                height: step.targetPosition.height + moderateScale(8),
                borderRadius: (step.targetPosition.borderRadius || moderateScale(12)) + moderateScale(4),
                opacity: fadeAnim,
              },
            ]}
          />
        )}

        {/* Pulse indicator pointer */}
        {step.targetPosition && (
          <Animated.View
            style={[
              styles.pulseIndicator,
              {
                top: step.targetPosition.top + step.targetPosition.height / 2 - moderateScale(25),
                left: step.targetPosition.left + step.targetPosition.width / 2 - moderateScale(25),
                transform: [{ scale: pulseAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.pulseInner}>
              <Icon name="hand-pointing-up" size={moderateScale(24)} color="#FFFFFF" />
            </View>
          </Animated.View>
        )}

        {/* Tooltip - Simplified */}
        <Animated.View
          style={[
            styles.tooltip,
            {
              top: step.tooltipPosition?.top,
              bottom: step.tooltipPosition?.bottom,
              left: step.tooltipPosition?.left || moderateScale(20),
              right: step.tooltipPosition?.right || moderateScale(20),
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.tooltipContent}>
            {/* Arrow pointer */}
            {step.arrowDirection && (
              <View
                style={[
                  styles.arrow,
                  step.arrowDirection === 'top' && styles.arrowTop,
                  step.arrowDirection === 'bottom' && styles.arrowBottom,
                ]}
              />
            )}

            {/* Simple Icon + Title */}
            <View style={styles.tooltipHeader}>
              <View style={styles.iconContainer}>
                <Icon name={step.icon || 'information'} size={moderateScale(28)} color="#D96073" />
              </View>
              <Text style={styles.tooltipTitle}>{step.title}</Text>
            </View>

            {/* Description */}
            <Text style={styles.tooltipDescription}>{step.description}</Text>

            {/* Swipe demo only for card step */}
            {step.showSwipeDemo && (
              <View style={styles.swipeDemoContainer}>
                <View style={styles.swipeDemo}>
                  <View style={styles.swipeDemoItem}>
                    <Icon name="arrow-left" size={moderateScale(24)} color="#FF6B6B" />
                    <Text style={styles.swipeDemoText}>Swipe Left{'\n'}Skip</Text>
                  </View>
                  <View style={styles.swipeDemoDivider} />
                  <View style={styles.swipeDemoItem}>
                    <Icon name="arrow-right" size={moderateScale(24)} color="#51CF66" />
                    <Text style={styles.swipeDemoText}>Swipe Right{'\n'}Book</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Progress dots */}
            <View style={styles.progressContainer}>
              {tourSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                    index < currentStep && styles.progressDotCompleted,
                  ]}
                />
              ))}
            </View>

            {/* Step counter */}
            <Text style={styles.stepCounter}>
              Step {currentStep + 1} of {tourSteps.length}
            </Text>

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#D96073', '#E8758A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>
                    {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                  <Icon 
                    name={currentStep === tourSteps.length - 1 ? "check" : "arrow-right"} 
                    size={moderateScale(18)} 
                    color="#FFFFFF" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  dimBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#D96073',
    shadowColor: '#D96073',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  pulseIndicator: {
    position: 'absolute',
    width: moderateScale(50),
    height: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(25),
    backgroundColor: '#D96073',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D96073',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  tooltipContent: {
    padding: moderateScale(20),
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    zIndex: 1,
  },
  arrowTop: {
    top: moderateScale(-10),
    left: '50%',
    marginLeft: moderateScale(-10),
    borderLeftWidth: moderateScale(10),
    borderRightWidth: moderateScale(10),
    borderBottomWidth: moderateScale(10),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  arrowBottom: {
    bottom: moderateScale(-10),
    left: '50%',
    marginLeft: moderateScale(-10),
    borderLeftWidth: moderateScale(10),
    borderRightWidth: moderateScale(10),
    borderTopWidth: moderateScale(10),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#FFE5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  tooltipTitle: {
    flex: 1,
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#3D2C2C',
  },
  tooltipDescription: {
    fontSize: scaleFont(14),
    color: '#5D4A5D',
    lineHeight: scaleFont(20),
    marginBottom: moderateScale(16),
  },
  swipeDemoContainer: {
    marginBottom: moderateScale(16),
  },
  swipeDemo: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
  },
  swipeDemoItem: {
    flex: 1,
    alignItems: 'center',
    gap: moderateScale(8),
  },
  swipeDemoDivider: {
    width: 1,
    height: moderateScale(40),
    backgroundColor: '#D0D0D0',
    marginHorizontal: moderateScale(12),
  },
  swipeDemoText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: '#5D4A5D',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
    gap: moderateScale(8),
  },
  progressDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#E5D7D3',
  },
  progressDotActive: {
    width: moderateScale(20),
    backgroundColor: '#D96073',
  },
  progressDotCompleted: {
    backgroundColor: '#51CF66',
  },
  stepCounter: {
    fontSize: scaleFont(12),
    color: '#9B8B8B',
    textAlign: 'center',
    marginBottom: moderateScale(16),
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  skipButton: {
    flex: 1,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(12),
    backgroundColor: '#F0E4E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#7A6B7A',
  },
  nextButton: {
    flex: 1,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
  },
  nextButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AppTourGuide;