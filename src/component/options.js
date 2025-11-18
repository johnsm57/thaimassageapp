import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
  PixelRatio,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const scaleFont = (size) => {
  const scaledSize = (SCREEN_WIDTH / 375) * size;
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

const options = ({navigation}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(100)).current;
  const slideAnim2 = useRef(new Animated.Value(100)).current;
  const scaleAnim1 = useRef(new Animated.Value(0.8)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.8)).current;
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const bounceAnim1 = useRef(new Animated.Value(0)).current;
  const bounceAnim2 = useRef(new Animated.Value(0)).current;
  const glowAnim1 = useRef(new Animated.Value(0)).current;
  const glowAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Complex card animations
    Animated.sequence([
      // Initial fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Staggered card entrance with multiple effects
      Animated.stagger(400, [
        // First card animation sequence
        Animated.parallel([
          Animated.spring(slideAnim1, {
            toValue: 0,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim1, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(rotateAnim1, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim1, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Second card animation sequence
        Animated.parallel([
          Animated.spring(slideAnim2, {
            toValue: 0,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim2, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(rotateAnim2, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim2, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    ]).start(() => {
      // Start continuous animations after entrance
      startContinuousAnimations();
    });
  }, []);

  const startContinuousAnimations = () => {
    // Continuous bounce effect
    const bounce1 = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim1, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim1, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    const bounce2 = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim2, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim2, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow effect
    const glow1 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim1, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    const glow2 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim2, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim2, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    bounce1.start();
    bounce2.start();
    glow1.start();
    glow2.start();
  };

  const card1RotateInterpolate = rotateAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  const card2RotateInterpolate = rotateAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-5deg'],
  });

  const bounce1Interpolate = bounceAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, moderateScale(-8)],
  });

  const bounce2Interpolate = bounceAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, moderateScale(-6)],
  });

  const glow1Interpolate = glowAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const glow2Interpolate = glowAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#C8B5DB" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Luci</Text>
        <Text style={styles.subtitle}>Book your favorite massage</Text>
      </View>

      {/* Animated Notification Cards with Enhanced Effects */}
      <Animated.View 
        style={[
          styles.cardsContainer,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Zen Thai Studio Card */}
        <Animated.View
          style={[
            styles.notificationCard,
            styles.cardShadowContainer,
            {
              transform: [
                { translateY: Animated.add(slideAnim1, bounce1Interpolate) },
                { scale: scaleAnim1 },
                { rotate: card1RotateInterpolate }
              ],
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.cardGlowEffect,
              { opacity: glow1Interpolate }
            ]} 
          />
          <View style={styles.cardBackground} />
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <View style={styles.zenIcon}>
                <Text style={styles.omSymbol}>ॐ</Text>
                <View style={styles.iconGlow} />
              </View>
            </View>
            <View style={styles.textContent}>
              <Text style={styles.serviceName}>Zen Thai Studio</Text>
              <Text style={styles.serviceMessage} numberOfLines={1}>thank you for book.....</Text>
            </View>
            <Text style={styles.timestamp}>now</Text>
          </View>
        </Animated.View>

        {/* Caccoon Healing Card */}
        <Animated.View
          style={[
            styles.notificationCard,
            styles.cardShadowContainer,
            {
              transform: [
                { translateY: Animated.add(slideAnim2, bounce2Interpolate) },
                { scale: scaleAnim2 },
                { rotate: card2RotateInterpolate }
              ],
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.cardGlowEffect,
              { opacity: glow2Interpolate }
            ]} 
          />
          <View style={styles.cardBackground} />
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <View style={styles.caccoonIcon}>
                <Text style={styles.flowerSymbol}>🌸</Text>
                <View style={styles.iconGlow} />
              </View>
            </View>
            <View style={styles.textContent}>
              <Text style={styles.serviceName}>Caccoon</Text>
              <Text style={styles.strikethrough}>Healing</Text>
              <Text style={styles.serviceMessage} numberOfLines={1}>thank you for book.....</Text>
            </View>
            <Text style={styles.timestamp}>6:30 A.M</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Dark bars on sides */}
      <View style={styles.darkBarsContainer}>
        <View style={styles.leftDarkBar} />
        <View style={styles.rightDarkBar} />
      </View>

      {/* Bottom shade */}
      <View style={styles.bottomShadeContainer}>
        <View style={styles.bottomShade} />
      </View>

      {/* Bottom Buttons with exact specifications */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.createAccountButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('signup')}
        >
          <Text style={styles.createAccountText}>Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('login')}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Home Indicator */}
      <View style={styles.homeIndicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE2E0',
  },
  header: {
    alignItems: 'center',
    marginTop: verticalScale(80),
    marginBottom: verticalScale(80),
    paddingHorizontal: moderateScale(30),
  },
  title: {
    fontSize: scaleFont(48),
    fontWeight: 'bold',
    color: '#2D1B47',
    marginBottom: moderateScale(10),
    letterSpacing: 1,
    textShadowColor: 'rgba(45, 27, 71, 0.3)',
    textShadowOffset: { width: 0, height: moderateScale(2) },
    textShadowRadius: moderateScale(4),
  },
  subtitle: {
    fontSize: scaleFont(18),
    color: '#7A6B7A',
    fontWeight: '500',
  },
  cardsContainer: {
    paddingHorizontal: moderateScale(25),
    marginBottom: verticalScale(100),
    gap: moderateScale(15),
  },
  cardShadowContainer: {
    shadowColor: '#2D1B47',
    shadowOffset: {
      width: 0,
      height: moderateScale(8),
    },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(15),
    elevation: 10,
  },
  notificationCard: {
    borderRadius: moderateScale(24),
    overflow: 'visible',
    position: 'relative',
  },
  cardGlowEffect: {
    position: 'absolute',
    top: moderateScale(-5),
    left: moderateScale(-5),
    right: moderateScale(-5),
    bottom: moderateScale(-5),
    backgroundColor: 'rgba(237, 207, 201, 0.6)',
    borderRadius: moderateScale(26),
    zIndex: -2,
    shadowColor: '#EDCFC9',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: moderateScale(20),
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#EDCFC9',
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    borderColor: '#EDCFC9',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(18),
    zIndex: 1,
  },
  iconContainer: {
    marginRight: moderateScale(12),
    position: 'relative',
  },
  zenIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    backgroundColor: '#4A7C59',
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A7C59',
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(8),
    elevation: 6,
  },
  caccoonIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    backgroundColor: '#8B7B8B',
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B7B8B',
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(8),
    elevation: 6,
  },
  iconGlow: {
    position: 'absolute',
    top: moderateScale(-4),
    left: moderateScale(-4),
    right: moderateScale(-4),
    bottom: moderateScale(-4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: moderateScale(28),
    zIndex: -1,
  },
  omSymbol: {
    fontSize: scaleFont(24),
    color: '#E8A87C',
    fontWeight: 'bold',
  },
  flowerSymbol: {
    fontSize: scaleFont(20),
  },
  textContent: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  serviceName: {
    fontSize: scaleFont(17),
    fontWeight: '700',
    color: '#2D1B47',
    marginBottom: moderateScale(2),
  },
  strikethrough: {
    fontSize: scaleFont(17),
    fontWeight: '700',
    color: '#2D1B47',
    textDecorationLine: 'line-through',
    marginBottom: moderateScale(2),
  },
  serviceMessage: {
    fontSize: scaleFont(13),
    color: '#7A6B7A',
    fontWeight: '400',
  },
  timestamp: {
    fontSize: scaleFont(13),
    color: '#7A6B7A',
    fontWeight: '600',
  },
  darkBarsContainer: {
    position: 'absolute',
    bottom: verticalScale(120),
    left: 0,
    right: 0,
    height: moderateScale(50),
  },
  leftDarkBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: moderateScale(10),
    height: '100%',
    backgroundColor: '#2D1B47',
    borderTopRightRadius: moderateScale(5),
    borderBottomRightRadius: moderateScale(5),
  },
  rightDarkBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: moderateScale(10),
    height: '100%',
    backgroundColor: '#2D1B47',
    borderTopLeftRadius: moderateScale(5),
    borderBottomLeftRadius: moderateScale(5),
  },
  bottomShadeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(300),
  },
  bottomShade: {
    flex: 1,
    backgroundColor: 'rgba(210, 190, 240, 1)',
    borderTopLeftRadius: moderateScale(100),
    borderTopRightRadius: moderateScale(100),
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: verticalScale(50),
    alignItems: 'center',
    width: '100%',
    gap: moderateScale(15),
  },
  createAccountButton: {
    width: moderateScale(216),
    height: moderateScale(52),
    backgroundColor: '#D96073',
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#BA7F88',
    shadowOffset: {
      width: 0,
      height: moderateScale(8),
    },
    shadowOpacity: 0.35,
    shadowRadius: moderateScale(15),
    elevation: 10,
  },
  createAccountText: {
    color: '#FFFFFF',
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
  loginButton: {
    width: moderateScale(216),
    height: moderateScale(52),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: moderateScale(6),
    },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(10),
    elevation: 6,
  },
  loginText: {
    color: '#7A6B7A',
    fontSize: scaleFont(18),
    fontWeight: '600',
  },
  
});

export default options;