import React, { useState, useRef } from 'react';
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
import Ionicons from 'react-native-vector-icons/Ionicons';

// import the separated BottomNav component (now floating)
import BottomNav from '../component/BottomNav';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

// How much to raise the card stack (positive number = move up)
const CARD_RAISE = 60;

// Spacer height to ensure content doesn't overlap with the floating bottom nav.
// You can tweak this value (or remove it) later when you change bottom nav offset.
const BOTTOM_NAV_SPACER = 0;

/**
 * Homescreeen
 *
 * NOTES / FUTURE WORK (comments for the next developer):
 * 1. Data integration:
 *    - Replace the local `studios` array with a data hook (e.g. useStudios) that fetches from your API.
 *    - Example: const { studios, loading, refresh } = useStudios();
 *
 * 2. StudioCard component:
 *    - We have a prepared StudioCard component (src/components/StudioCard).
 *    - When integrating the API, render StudioCard inside the Animated container for consistent styling.
 *
 * 3. Booking on swipe-left:
 *    - When implementing booking API, add a sendBookingRequest(studio) function that:
 *      - Accepts studio object
 *      - Sends POST to your booking endpoint with auth headers
 *      - Handles network errors, retries, and shows notifications
 *    - Call sendBookingRequest() after the swipe-left animation completes.
 *
 * 4. BottomNav:
 *    - BottomNav is a floating component that accepts `bottomOffset` (safe-area aware)
 *      and `fixedBottom` (absolute pixel).
 *    - To nudge the nav up a little, change only the BottomNav invocation:
 *      <BottomNav navigation={navigation} active="home" bottomOffset={40} />
 *      or for quick testing:
 *      <BottomNav navigation={navigation} active="home" fixedBottom={48} />
 *
 * 5. Safe area:
 *    - Ensure the app root is wrapped with SafeAreaProvider so BottomNav's safe-area calculations work.
 *      (index.js / App.js)
 *
 * 6. Do not change layout paddings:
 *    - This screen intentionally avoids changing global paddings. Only visual spacer is added
 *      (BOTTOM_NAV_SPACER) so the floating nav does not overlap interactive content.
 *
 * This file currently makes no functional changes — only a small visual spacer and helpful comments
 * are added to make future integration straightforward.
 */

const Homescreeen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;

  // Dummy data for now — replace with API-driven hook (useStudios) later
  const studios = [
    { id: 1, name: 'Zen Thai Studio', price: 99, rating: 4.5, location: 'Watthana, Bangkok', services: ['Aromatherapy', 'Oil massage', 'Foot massage'] },
    { id: 2, name: 'Serenity Spa', price: 120, rating: 4.8, location: 'Sukhumvit, Bangkok', services: ['Thai massage', 'Deep tissue', 'Hot stone'] },
    { id: 3, name: 'Harmony Wellness', price: 85, rating: 4.3, location: 'Silom, Bangkok', services: ['Swedish massage', 'Reflexology', 'Sports massage'] },
  ];

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
    Animated.timing(position, { toValue: { x: width + 100, y: 0 }, duration: 250, useNativeDriver: false }).start(() => {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
      nextCard();
    });
  };
  const swipeLeft = () => {
    Animated.timing(position, { toValue: { x: -width - 100, y: 0 }, duration: 250, useNativeDriver: false }).start(() => nextCard());
  };
  const resetPosition = () => Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
  const nextCard = () => { setCurrentIndex((p) => (p + 1) % studios.length); position.setValue({ x: 0, y: 0 }); };

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

    // Add a static raise translateY to the moving card so the whole stack moves up
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
                <Text style={styles.placeholderText}>Studio Image</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Icon name="star" size={16} color="#FDB022" />
              <Text style={styles.ratingText}>{studio.rating}</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.studioName}>{studio.name}</Text>
            <View style={styles.infoRow}>
              <View style={styles.priceContainer}>
                <Icon name="currency-usd" size={16} color="#C97B84" />
                <Text style={styles.infoText}>from ${studio.price}</Text>
              </View>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#C97B84" />
                <Text style={styles.infoText}>{studio.location}</Text>
              </View>
            </View>
            <View style={styles.tagsContainer}>
              <View style={styles.tagsRow}>
                <View style={styles.tag}><Text style={styles.tagText}>{studio.services[0]}</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>{studio.services[1]}</Text></View>
              </View>
              <View style={styles.tagsRow}>
                <View style={styles.tag}><Text style={styles.tagText}>{studio.services[2]}</Text></View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE2E0" />
      <View style={styles.header}>
        <View style={styles.userBadge}><Text style={styles.userName}>👋🏼 Luci</Text></View>
        <TouchableOpacity style={styles.notificationButton}><Icon name="bell-outline" size={22} color="#D96073" /></TouchableOpacity>
      </View>

      {showNotification && (
        <View style={styles.notification}>
          <Icon name="check" size={18} color="#D96073" style={styles.checkIcon} />
          <Text style={styles.notificationText}>Booking request sent</Text>
        </View>
      )}

      <View style={styles.cardsContainer}>
        {renderBackgroundCards()}
        {studios.map((s, i) => renderCard(s, i))}
      </View>

      {/* spacer so content (cards) don't visually collide with the floating BottomNav.
          This is intentionally small and safe — change BOTTOM_NAV_SPACER value above if needed.
          NOTE: This does NOT change any global paddings or safe-area handling. */}
      <View style={{ height: BOTTOM_NAV_SPACER }} />

      {/* Floating bottom nav — no layout changes elsewhere */}
      <BottomNav navigation={navigation} active="home" bottomOffset={12} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE2E0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 16 },
  userBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDCFC9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  userName: { fontSize: 16, fontWeight: '600', color: '#3D2C2C' },
  notificationButton: { width: 48, height: 48, backgroundColor: '#EDCFC9', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  notification: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8C4CC', marginHorizontal: 70, marginTop: 12, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, alignSelf: 'center' },
  checkIcon: { marginRight: 8 },
  notificationText: { fontSize: 15, color: '#D96073', fontWeight: '700' },

  cardsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  backgroundCardsContainer: { position: 'absolute', width: 348, height: 573, alignSelf: 'center' },
  backgroundCard: { position: 'absolute', width: '100%', height: '100%' },
  backgroundCardInner: { width: '100%', height: '100%', borderRadius: 56, borderWidth: 1.5, borderColor: '#E5D7D3' },
  firstCard: { transform: [{ translateX: 8 }], zIndex: 3 },
  secondCard: { transform: [{ translateX: 16 }], zIndex: 2 },
  thirdCard: { transform: [{ translateX: 24 }], zIndex: 1 },

  cardContainer: { position: 'absolute', width: 348, height: 573, alignSelf: 'center', zIndex: 10, shadowColor: '#9E6B62', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 12 },
  card: { flex: 1, borderRadius: 56, overflow: 'hidden' },
  imageContainer: { height: '67%', backgroundColor: '#E8DDD8', borderRadius: 44, margin: 12, overflow: 'hidden', position: 'relative' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#D4C4BC' },
  placeholderContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 16, color: '#9B8B8B' },
  ratingBadge: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, gap: 4, borderWidth: 1, borderColor: '#FFFFFF' },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#3D2C2C' },

  detailsContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 16 },
  studioName: { fontSize: 22, fontWeight: '700', color: '#3D2C2C', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 20 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
  infoText: { fontSize: 13, color: '#C97B84', fontWeight: '500' },
  tagsContainer: { gap: 8 },
  tagsRow: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: '#F0E4E0', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 },
  tagText: { fontSize: 12, color: '#C97B84', fontWeight: '500' },
});

export default Homescreeen;