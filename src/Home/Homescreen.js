
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  StatusBar,
  PixelRatio,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import BottomNav from '../component/BottomNav';
import AppTourGuide from'./AppTourGuide';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const scaleFont = (size) => {
  const scaledSize = (SCREEN_WIDTH / 375) * size;
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

// Card dimensions that adapt to screen
const getCardWidth = () => {
  const cardWidth = SCREEN_WIDTH * 0.88;
  return Math.min(cardWidth, 400);
};

const getCardHeight = () => {
  const cardWidth = getCardWidth();
  const idealHeight = cardWidth * 1.65;
  const maxHeight = SCREEN_HEIGHT * 0.68;
  return Math.min(idealHeight, maxHeight);
};

const CARD_WIDTH = getCardWidth();
const CARD_HEIGHT = getCardHeight();
const SWIPE_THRESHOLD = scale(100);
const CARD_RAISE = verticalScale(40);

const Homescreen = ({ navigation }) => {
  const { currentLanguage, t, formatText, translateDynamic } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('booking'); // 'booking' or 'skip'
  const [userName, setUserName] = useState('User');
  const [translatedUserName, setTranslatedUserName] = useState('User');
  const [translatedStudios, setTranslatedStudios] = useState([]);
  const [notificationButtonLayout, setNotificationButtonLayout] = useState(null);
  const [cardLayout, setCardLayout] = useState(null);
  const position = useRef(new Animated.ValueXY()).current;
  const notificationButtonRef = useRef(null);
  const cardRef = useRef(null);

  // Define tour steps with swipe demo
  // Define tour steps - SIMPLIFIED
const tourSteps = [
  {
    title: 'Welcome!',
    description: 'Let us show you how to find the perfect massage studio.',
    icon: 'hand-wave',
    tooltipPosition: {
      top: verticalScale(150),
      left: moderateScale(20),
      right: moderateScale(20),
    },
  },
  {
    title: 'Swipe Cards',
    description: 'Swipe right to book or swipe left to skip and see the next studio.',
    icon: 'gesture-swipe',
    targetPosition: cardLayout,
    showSwipeDemo: true,
    tooltipPosition: {
      top: verticalScale(100),
      left: moderateScale(20),
      right: moderateScale(20),
    },
    arrowDirection: 'bottom',
  },
  {
    title: 'Notifications',
    description: 'Check your booking confirmations here.',
    icon: 'bell',
    targetPosition: notificationButtonLayout,
    tooltipPosition: {
      top: notificationButtonLayout ? notificationButtonLayout.top + moderateScale(70) : verticalScale(150),
      left: moderateScale(20),
      right: moderateScale(20),
    },
    arrowDirection: 'top',
  },
  {
    title: 'Chat',
    description: 'Message parlors directly to ask questions.',
    icon: 'chat',
    tooltipPosition: {
      bottom: moderateScale(160),
      left: moderateScale(20),
      right: moderateScale(20),
    },
  },
  {
    title: 'Profile',
    description: 'Access your bookings and account settings.',
    icon: 'account',
    tooltipPosition: {
      bottom: moderateScale(160),
      left: moderateScale(20),
      right: moderateScale(20),
    },
  },
];
  useEffect(() => {
    fetchUserName();
    setTimeout(() => {
      measureNotificationButton();
      measureCard();
    }, 500);
  }, []);

  useEffect(() => {
    const translateName = async () => {
      if (userName && userName !== 'User') {
        if (currentLanguage === 'th') {
          const translated = await translateDynamic(userName);
          setTranslatedUserName(translated);
        } else {
          setTranslatedUserName(userName);
        }
      } else {
        setTranslatedUserName(userName);
      }
    };
    translateName();
  }, [userName, currentLanguage]);

  const studios = [
    { 
      id: 1, 
      name: 'Zen Thai Studio', 
      price: 99, 
      rating: 4.5, 
      location: 'Watthana, Bangkok', 
      services: ['Aromatherapy', 'Oil massage', 'Foot massage'] 
    },
    { 
      id: 2, 
      name: 'Serenity Spa', 
      price: 120, 
      rating: 4.8, 
      location: 'Sukhumvit, Bangkok', 
      services: ['Thai massage', 'Deep tissue', 'Hot stone'] 
    },
    { 
      id: 3, 
      name: 'Harmony Wellness', 
      price: 85, 
      rating: 4.3, 
      location: 'Silom, Bangkok', 
      services: ['Swedish massage', 'Reflexology', 'Sports massage'] 
    },
  ];

  useEffect(() => {
    const translateStudios = async () => {
      if (currentLanguage === 'th') {
        const translated = await Promise.all(
          studios.map(async (studio) => ({
            ...studio,
            name: await translateDynamic(studio.name),
            location: await translateDynamic(studio.location),
            services: await Promise.all(
              studio.services.map(service => translateDynamic(service))
            ),
          }))
        );
        setTranslatedStudios(translated);
      } else {
        setTranslatedStudios(studios);
      }
    };
    translateStudios();
  }, [currentLanguage]);

  const fetchUserName = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userDoc = await firestore()
          .collection('Useraccount')
          .doc(currentUser.uid)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          setUserName(userData?.name || 'User');
        }
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const measureNotificationButton = () => {
    if (notificationButtonRef.current) {
      notificationButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setNotificationButtonLayout({
          top: pageY,
          left: pageX,
          width: width,
          height: height,
          borderRadius: moderateScale(12),
        });
      });
    }
  };

  const measureCard = () => {
    if (cardRef.current) {
      cardRef.current.measure((x, y, width, height, pageX, pageY) => {
        setCardLayout({
          top: pageY,
          left: pageX,
          width: width,
          height: height,
          borderRadius: moderateScale(48),
        });
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) swipeRight();
        else if (gesture.dx < -SWIPE_THRESHOLD) swipeLeft();
        else resetPosition();
      },
    })
  ).current;

  const swipeRight = () => {
    Animated.timing(position, { 
      toValue: { x: SCREEN_WIDTH + 100, y: 0 }, 
      duration: 250, 
      useNativeDriver: false 
    }).start(() => {
      setNotificationType('booking');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
      nextCard();
    });
  };
  
  const swipeLeft = () => {
    Animated.timing(position, { 
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 }, 
      duration: 250, 
      useNativeDriver: false 
    }).start(() => {
     
      nextCard();
    });
  };
  
  const resetPosition = () => {
    Animated.spring(position, { 
      toValue: { x: 0, y: 0 }, 
      useNativeDriver: false 
    }).start();
  };
  
  const nextCard = () => { 
    const studiosToUse = translatedStudios.length > 0 ? translatedStudios : studios;
    setCurrentIndex((p) => (p + 1) % studiosToUse.length); 
    position.setValue({ x: 0, y: 0 }); 
  };

  const handleTourComplete = () => {
    console.log('Tour completed!');
  };

  const renderBackgroundCards = () => (
    <View style={[styles.backgroundCardsContainer, { transform: [{ translateY: -CARD_RAISE }] }]}>
      <View style={[styles.backgroundCard, styles.thirdCard]}>
        <LinearGradient colors={['#FFFFFF', '#EDCFC9']} style={styles.backgroundCardInner} />
      </View>
      <View style={[styles.backgroundCard, styles.secondCard]}>
        <LinearGradient colors={['#FFFFFF', '#EDCFC9']} style={styles.backgroundCardInner} />
      </View>
      <View style={[styles.backgroundCard, styles.firstCard]}>
        <LinearGradient colors={['#FFFFFF', '#EDCFC9']} style={styles.backgroundCardInner} />
      </View>
    </View>
  );

  const renderCard = (studio, index) => {
    if (index < currentIndex) return null;
    if (index !== currentIndex) return null;

    const combinedTransforms = [
      ...position.getTranslateTransform(),
      { translateY: -CARD_RAISE },
    ];

    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
      extrapolate: 'clamp',
    });

    const likeOpacity = position.x.interpolate({
      inputRange: [0, SWIPE_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    const nopeOpacity = position.x.interpolate({
      inputRange: [-SWIPE_THRESHOLD, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={studio.id}
        ref={index === 0 ? cardRef : null}
        style={[
          styles.cardContainer, 
          { 
            transform: [...combinedTransforms, { rotate }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <LinearGradient colors={['#FFFFFF', '#EDCFC9']} style={styles.card}>
          {/* Swipe indicators on card */}
          <Animated.View style={[styles.swipeIndicator, styles.likeIndicator, { opacity: likeOpacity }]}>
            <Icon name="check-circle" size={moderateScale(60)} color="#51CF66" />
            <Text style={[styles.swipeIndicatorText, { color: '#51CF66' }]}>BOOK</Text>
          </Animated.View>

          <Animated.View style={[styles.swipeIndicator, styles.nopeIndicator, { opacity: nopeOpacity }]}>
            <Icon name="close-circle" size={moderateScale(60)} color="#FF6B6B" />
            <Text style={[styles.swipeIndicatorText, { color: '#FF6B6B' }]}>SKIP</Text>
          </Animated.View>

          <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>{t('home.studioImage')}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Icon name="star" size={moderateScale(16)} color="#FDB022" />
              <Text style={styles.ratingText}>{formatText(studio.rating.toString())}</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.studioName} numberOfLines={1}>{studio.name}</Text>
            <View style={styles.infoRow}>
              <View style={styles.priceContainer}>
                <Icon name="currency-usd" size={moderateScale(16)} color="#C97B84" />
                <Text style={styles.infoText}>
                  {t('home.from')} ${formatText(studio.price.toString())}
                </Text>
              </View>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={moderateScale(16)} color="#C97B84" />
                <Text style={styles.infoText} numberOfLines={1}>{studio.location}</Text>
              </View>
            </View>
            <View style={styles.tagsContainer}>
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>{studio.services[0]}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>{studio.services[1]}</Text>
                </View>
              </View>
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>{studio.services[2]}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const studiosToRender = translatedStudios.length > 0 ? translatedStudios : studios;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE2E0" />
      
      {/* App Tour Guide */}
      <AppTourGuide tourSteps={tourSteps} onComplete={handleTourComplete} />

      <View style={styles.header}>
        <View style={styles.userBadge}>
          <Text style={styles.userName} numberOfLines={1}>
            {t('home.greeting')} {translatedUserName}
          </Text>
        </View>
        <TouchableOpacity 
          ref={notificationButtonRef}
          style={styles.notificationButton}
          onPress={() => navigation.navigate('notifications')}
        >
          <Icon name="bell-outline" size={moderateScale(22)} color="#D96073" />
        </TouchableOpacity>
      </View>

      {/* Enhanced notification feedback */}
      {showNotification && (
        <Animated.View style={styles.notification}>
          <Icon 
            name={notificationType === 'booking' ? "check-circle" : "close-circle"} 
            size={moderateScale(20)} 
            color={notificationType === 'booking' ? "#D96073" : "#FF6B6B"} 
            style={styles.notificationIcon} 
          />
          <Text style={styles.notificationText}>
            {notificationType === 'booking' 
              ? t('home.bookingRequestSent') || 'Booking request sent!' 
              : t('home.studioSkipped') || 'Studio skipped'}
          </Text>
        </Animated.View>
      )}

      <View style={styles.cardsContainer}>
        {renderBackgroundCards()}
        {studiosToRender.map((s, i) => renderCard(s, i))}
      </View>

      <BottomNav navigation={navigation} active="home" bottomOffset={moderateScale(12)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDE2E0' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: moderateScale(20), 
    paddingTop: verticalScale(50), 
    paddingBottom: moderateScale(16) 
  },
  userBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EDCFC9', 
    paddingHorizontal: moderateScale(16), 
    paddingVertical: moderateScale(10), 
    borderRadius: moderateScale(10),
    maxWidth: SCREEN_WIDTH * 0.6,
  },
  userName: { 
    fontSize: scaleFont(15), 
    fontWeight: '600', 
    color: '#3D2C2C' 
  },
  notificationButton: { 
    width: moderateScale(46), 
    height: moderateScale(46), 
    backgroundColor: '#EDCFC9', 
    borderRadius: moderateScale(12), 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  notification: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E8BEC3', 
    marginHorizontal: moderateScale(40), 
    marginTop: moderateScale(8), 
    marginBottom: moderateScale(8), 
    paddingVertical: moderateScale(12), 
    paddingHorizontal: moderateScale(20), 
    borderRadius: moderateScale(20), 
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationIcon: { 
    marginRight: moderateScale(10) 
  },
  notificationText: { 
    fontSize: scaleFont(14), 
    color: '#D96073', 
    fontWeight: '600' 
  },

  cardsContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingBottom: verticalScale(80),
  },

  backgroundCardsContainer: { 
    position: 'absolute', 
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center' 
  },
  backgroundCard: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%' 
  },
  backgroundCardInner: { 
    width: '100%', 
    height: '100%', 
    borderRadius: moderateScale(48), 
    borderWidth: 1.5, 
    borderColor: '#E5D7D3' 
  },
  firstCard: { 
    transform: [{ translateX: moderateScale(6) }], 
    zIndex: 3 
  },
  secondCard: { 
    transform: [{ translateX: moderateScale(12) }], 
    zIndex: 2 
  },
  thirdCard: { 
    transform: [{ translateX: moderateScale(18) }], 
    zIndex: 1 
  },

  cardContainer: { 
    position: 'absolute', 
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center', 
    zIndex: 10, 
    shadowColor: '#9E6B62', 
    shadowOffset: { width: 0, height: moderateScale(4) }, 
    shadowOpacity: 0.5, 
    shadowRadius: moderateScale(12), 
    elevation: 12 
  },
  card: { 
    flex: 1, 
    borderRadius: moderateScale(48), 
    overflow: 'hidden' 
  },
  swipeIndicator: {
    position: 'absolute',
    top: moderateScale(80),
    zIndex: 100,
    alignItems: 'center',
  },
  likeIndicator: {
    right: moderateScale(30),
  },
  nopeIndicator: {
    left: moderateScale(30),
  },
  swipeIndicatorText: {
    fontSize: scaleFont(24),
    fontWeight: '800',
    marginTop: moderateScale(8),
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  imageContainer: { 
    height: '67%', 
    backgroundColor: '#E8DDD8', 
    borderRadius: moderateScale(38), 
    margin: moderateScale(10), 
    overflow: 'hidden', 
    position: 'relative' 
  },
  imagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: '#D4C4BC' 
  },
  placeholderContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { 
    fontSize: scaleFont(15), 
    color: '#9B8B8B' 
  },
  ratingBadge: { 
    position: 'absolute', 
    top: moderateScale(12), 
    right: moderateScale(12), 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'transparent', 
    paddingHorizontal: moderateScale(10), 
    paddingVertical: moderateScale(5), 
    borderRadius: moderateScale(50), 
    gap: moderateScale(4), 
    borderWidth: 1, 
    borderColor: '#FFFFFF' 
  },
  ratingText: { 
    fontSize: scaleFont(12), 
    fontWeight: '700', 
    color: '#3D2C2C' 
  },

  detailsContainer: { 
    flex: 1, 
    paddingHorizontal: moderateScale(20), 
    paddingTop: moderateScale(4), 
    paddingBottom: moderateScale(12) 
  },
  studioName: { 
    fontSize: scaleFont(19), 
    fontWeight: '700', 
    color: '#3D2C2C', 
    marginBottom: moderateScale(10) 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: moderateScale(10), 
    gap: moderateScale(16) 
  },
  priceContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: moderateScale(4) 
  },
  locationContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    gap: moderateScale(4) 
  },
  infoText: { 
    fontSize: scaleFont(12), 
    color: '#C97B84', 
    fontWeight: '500',
    flexShrink: 1,
  },
  tagsContainer: { 
    gap: moderateScale(6) 
  },
  tagsRow: { 
    flexDirection: 'row', 
    gap: moderateScale(6), 
    flexWrap: 'wrap' 
  },
  tag: { 
    backgroundColor: '#F6C5BB80', 
    paddingHorizontal: moderateScale(12), 
    paddingVertical: moderateScale(6), 
    borderRadius: moderateScale(12) 
  },
  tagText: { 
    fontSize: scaleFont(11), 
    color: '#C97B84', 
    fontWeight: '500' 
  },
});

export default Homescreen;
