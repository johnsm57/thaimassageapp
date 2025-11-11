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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useLanguage } from '../context/LanguageContext';

// import the separated BottomNav component (now floating)
import BottomNav from '../component/BottomNav';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

// How much to raise the card stack (positive number = move up)
const CARD_RAISE = 60;

// Spacer height to ensure content doesn't overlap with the floating bottom nav.
const BOTTOM_NAV_SPACER = 0;

const Homescreen = ({ navigation }) => {
  const { currentLanguage, t, formatText, translateDynamic } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [userName, setUserName] = useState('User');
  const [translatedUserName, setTranslatedUserName] = useState('User');
  const [translatedStudios, setTranslatedStudios] = useState([]);
  const position = useRef(new Animated.ValueXY()).current;

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserName();
  }, []);

  // Translate user name when language changes
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

  // Dummy data for now — replace with API-driven hook (useStudios) later
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

  // Translate studios when language changes
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
      toValue: { x: width + 100, y: 0 }, 
      duration: 250, 
      useNativeDriver: false 
    }).start(() => {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
      nextCard();
    });
  };
  
  const swipeLeft = () => {
    Animated.timing(position, { 
      toValue: { x: -width - 100, y: 0 }, 
      duration: 250, 
      useNativeDriver: false 
    }).start(() => nextCard());
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

    return (
      <Animated.View
        key={studio.id}
        style={[styles.cardContainer, { transform: combinedTransforms }]}
        {...panResponder.panHandlers}
      >
        <LinearGradient colors={['#FFFFFF', '#EDCFC9']} style={styles.card}>
          <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>{t('home.studioImage')}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Icon name="star" size={16} color="#FDB022" />
              <Text style={styles.ratingText}>{formatText(studio.rating.toString())}</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.studioName}>{studio.name}</Text>
            <View style={styles.infoRow}>
              <View style={styles.priceContainer}>
                <Icon name="currency-usd" size={16} color="#C97B84" />
                <Text style={styles.infoText}>
                  {t('home.from')} ${formatText(studio.price.toString())}
                </Text>
              </View>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#C97B84" />
                <Text style={styles.infoText} numberOfLines={1}>{studio.location}</Text>
              </View>
            </View>
            <View style={styles.tagsContainer}>
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{studio.services[0]}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{studio.services[1]}</Text>
                </View>
              </View>
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{studio.services[2]}</Text>
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
      <View style={styles.header}>
        <View style={styles.userBadge}>
          <Text style={styles.userName}>
            {t('home.greeting')} {translatedUserName}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('notifications')}
        >
          <Icon name="bell-outline" size={22} color="#D96073" />
        </TouchableOpacity>
      </View>

      {showNotification && (
        <View style={styles.notification}>
          <Icon name="check" size={18} color="#D96073" style={styles.checkIcon} />
          <Text style={styles.notificationText}>{t('home.bookingRequestSent')}</Text>
        </View>
      )}

      <View style={styles.cardsContainer}>
        {renderBackgroundCards()}
        {studiosToRender.map((s, i) => renderCard(s, i))}
      </View>

      <View style={{ height: BOTTOM_NAV_SPACER }} />

      <BottomNav navigation={navigation} active="home" bottomOffset={12} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE2E0' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 50, 
    paddingBottom: 16 
  },
  userBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EDCFC9', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 10 
  },
  userName: { fontSize: 16, fontWeight: '600', color: '#3D2C2C' },
  notificationButton: { 
    width: 48, 
    height: 48, 
    backgroundColor: '#EDCFC9', 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  notification: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E8C4CC', 
    marginHorizontal: 70, 
    marginTop: 12, 
    marginBottom: 8, 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 20, 
    alignSelf: 'center' 
  },
  checkIcon: { marginRight: 8 },
  notificationText: { fontSize: 15, color: '#D96073', fontWeight: '700' },

  cardsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  backgroundCardsContainer: { 
    position: 'absolute', 
    width: 348, 
    height: 573, 
    alignSelf: 'center' 
  },
  backgroundCard: { position: 'absolute', width: '100%', height: '100%' },
  backgroundCardInner: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 56, 
    borderWidth: 1.5, 
    borderColor: '#E5D7D3' 
  },
  firstCard: { transform: [{ translateX: 8 }], zIndex: 3 },
  secondCard: { transform: [{ translateX: 16 }], zIndex: 2 },
  thirdCard: { transform: [{ translateX: 24 }], zIndex: 1 },

  cardContainer: { 
    position: 'absolute', 
    width: 348, 
    height: 573, 
    alignSelf: 'center', 
    zIndex: 10, 
    shadowColor: '#9E6B62', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 12, 
    elevation: 12 
  },
  card: { flex: 1, borderRadius: 56, overflow: 'hidden' },
  imageContainer: { 
    height: '67%', 
    backgroundColor: '#E8DDD8', 
    borderRadius: 44, 
    margin: 12, 
    overflow: 'hidden', 
    position: 'relative' 
  },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#D4C4BC' },
  placeholderContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 16, color: '#9B8B8B' },
  ratingBadge: { 
    position: 'absolute', 
    top: 14, 
    right: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'transparent', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 50, 
    gap: 4, 
    borderWidth: 1, 
    borderColor: '#FFFFFF' 
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#3D2C2C' },

  detailsContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 16 },
  studioName: { fontSize: 22, fontWeight: '700', color: '#3D2C2C', marginBottom: 12 },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14, 
    gap: 20 
  },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    gap: 4 
  },
  infoText: { fontSize: 13, color: '#C97B84', fontWeight: '500' },
  tagsContainer: { gap: 8 },
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { 
    backgroundColor: '#F0E4E0', 
    paddingHorizontal: 14, 
    paddingVertical: 7, 
    borderRadius: 14 
  },
  tagText: { fontSize: 12, color: '#C97B84', fontWeight: '500' },
});

export default Homescreen;