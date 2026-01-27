"use client"

import { useState, useRef, useEffect } from "react"
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
  Image,
  ActivityIndicator,
  Alert,
} from "react-native"
import LinearGradient from "react-native-linear-gradient"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { useLanguage } from "../context/LanguageContext"
import BottomNav from "../component/BottomNav"
import AppTourGuide from "./AppTourGuide"
import { setupBookingListeners, navigateToChat } from "../utils/bookingSocket"
import { API_BASE_URL } from "../config/apiConfig"
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Responsive scaling functions
const scale = (size) => (SCREEN_WIDTH / 375) * size
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor
const scaleFont = (size) => {
  const scaledSize = (SCREEN_WIDTH / 375) * size
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize))
}

// Card dimensions that adapt to screen
const getCardWidth = () => {
  const cardWidth = SCREEN_WIDTH * 0.88
  return Math.min(cardWidth, 400)
}

const getCardHeight = () => {
  const cardWidth = getCardWidth()
  const idealHeight = cardWidth * 1.65
  const maxHeight = SCREEN_HEIGHT * 0.68
  return Math.min(idealHeight, maxHeight)
}

const CARD_WIDTH = getCardWidth()
const CARD_HEIGHT = getCardHeight()
const SWIPE_THRESHOLD = scale(100)
const CARD_RAISE = verticalScale(40)

const Homescreen = ({ navigation }) => {
  const { currentLanguage, t, formatText, translateDynamic } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationType, setNotificationType] = useState("booking")
  const [userName, setUserName] = useState("User")
  const [translatedUserName, setTranslatedUserName] = useState("User")
  const [translatedStudios, setTranslatedStudios] = useState([])
  const [notificationButtonLayout, setNotificationButtonLayout] = useState(null)
  const [cardLayout, setCardLayout] = useState(null)
  const [studios, setStudios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [firebaseUID, setFirebaseUID] = useState(null)
  const [bookingInProgress, setBookingInProgress] = useState(false)
  const [showTour, setShowTour] = useState(false)

  const handleTourComplete = async () => {
    try {
      console.log('Tour completed');
      await AsyncStorage.setItem('tourCompleted', 'true');
    } catch (error) {
      console.error('Error in handleTourComplete:', error);
    }
  };

  const position = useRef(new Animated.ValueXY()).current
  const cardOpacity = useRef(new Animated.Value(1)).current
  const notificationButtonRef = useRef(null)
  const cardRef = useRef(null)

  // PanResponder for card swiping
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left
          swipeLeft();
        } else {
          // Return to center
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Add opacity animations for swipe indicators
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

  // Refs to store current studios data to avoid closure issues
  const studiosRef = useRef(studios)
  const translatedStudiosRef = useRef(translatedStudios)
  const currentIndexRef = useRef(currentIndex)

  // Swipe functions
  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((prev) => prev + 1);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const swipeRight = async () => {
    console.log('========================================');
    console.log('🚀 SWIPE RIGHT TRIGGERED');
    console.log('📍 Current Index:', currentIndex);
    console.log('📍 Current Index Ref:', currentIndexRef.current);
    console.log('📚 Total Studios (state):', studios.length);
    console.log('📚 Total Studios (ref):', studiosRef.current.length);
    
    if (bookingInProgress) {
      console.log('⏸️ Already booking, returning...');
      return;
    }
    
    setBookingInProgress(true);
    
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start();

    // CRITICAL LINE - USE REF NOT STATE
    const currentStudio = studiosRef.current[currentIndexRef.current];
    
    console.log('📋 Current Studio from REF:', currentStudio);
    
    if (currentStudio) {
      console.log('📤 Sending booking for:', currentStudio.name);
      
      const result = await sendBookingRequest(currentStudio);
      
      console.log('📥 RESULT:', result);
      
      if (result.success) {
        console.log('✅ SUCCESS!');
        Alert.alert('Success!', 'Booking request sent successfully!');
        setShowNotification(true);
        setNotificationType("booking");
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        console.log('❌ FAILED:', result.error);
        Alert.alert(
          "Booking Failed",
          typeof result.error === 'string' ? result.error : result.error?.message || "Please try again"
        );
      }
    } else {
      console.log('❌ NO STUDIO at index:', currentIndexRef.current);
    }
    
    setCurrentIndex((prev) => prev + 1);
    position.setValue({ x: 0, y: 0 });
    setBookingInProgress(false);
    console.log('========================================');
  };

  // Update refs when state changes
  useEffect(() => {
    studiosRef.current = studios
  }, [studios])

  useEffect(() => {
    translatedStudiosRef.current = translatedStudios
  }, [translatedStudios])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  // Measure functions
  const measureNotificationButton = () => {
    if (notificationButtonRef.current) {
      notificationButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setNotificationButtonLayout({ top: pageY, left: pageX, width, height });
      });
    }
  };

  const measureCard = () => {
    if (cardRef.current) {
      cardRef.current.measure((x, y, width, height, pageX, pageY) => {
        setCardLayout({ top: pageY, left: pageX, width, height });
      });
    }
  };

  // Check if tour should be shown on mount
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const tourCompleted = await AsyncStorage.getItem('tourCompleted');
        if (!tourCompleted) {
          // Show tour only if not completed before
          setShowTour(true);
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      }
    };
    
    checkTourStatus();
  }, []);

  // Setup booking socket listeners
  useEffect(() => {
    if (!firebaseUID) return

    const socket = setupBookingListeners(firebaseUID, {
      onBookingAccepted: async ({ bookingId, booking, conversationId }) => {
        console.log("✅ Booking accepted:", bookingId, conversationId)
        console.log("📋 Booking data:", booking)
        
        // Extract salon owner ID from booking data
        // The booking object might have salonOwnerId in different places
        const salonOwnerId = booking?.salonOwnerId || 
                            booking?.reciever?.salonOwnerID || 
                            booking?.salonOwnerID || 
                            null;
        
        console.log("👤 Extracted salonOwnerId:", salonOwnerId)
        
        Alert.alert(
          t("home.bookingAccepted") || "Booking Accepted!",
          t("home.bookingAcceptedMessage") || "Your booking request has been accepted. Would you like to open chat?",
          [
            {
              text: t("home.openChat") || "Open Chat",
              onPress: async () => {
                // Navigate to chat
                try {
                  console.log("🚀 Opening chat with:", { conversationId, salonOwnerId })
                  await navigateToChat(
                    navigation,
                    conversationId,
                    salonOwnerId,
                    booking?.salonOwnerName || "Salon Owner"
                  )
                  console.log("✅ Navigation to chat completed")
                } catch (error) {
                  console.error("❌ Error navigating to chat:", error)
                  Alert.alert(
                    t("alerts.error") || "Error",
                    error.message || "Failed to open chat. Please try again later."
                  )
                }
              },
            },
            {
              text: t("home.ok") || "OK",
              style: "cancel",
            },
          ]
        )
      },
      onBookingRejected: ({ bookingId, booking }) => {
        console.log("❌ Booking rejected:", bookingId)
        Alert.alert(
          t("home.bookingRejected") || "Booking Rejected",
          t("home.bookingRejectedMessage") || "Your booking request has been rejected."
        )
      },
      onChatRoomCreated: ({ conversationId, bookingId, salonOwnerId, salonOwnerName }) => {
        console.log("💬 Chat room created:", conversationId)
        // Show notification and offer to open chat
        Alert.alert(
          t("home.chatRoomCreated") || "Chat Room Created",
          t("home.chatRoomCreatedMessage") || "A chat room has been created for your booking. Would you like to open it?",
          [
            {
              text: t("home.openChat") || "Open Chat",
              onPress: async () => {
                try {
                  await navigateToChat(
                    navigation,
                    conversationId,
                    salonOwnerId,
                    salonOwnerName || "Salon Owner"
                  )
                } catch (error) {
                  console.error("Error navigating to chat:", error)
                  Alert.alert(
                    t("alerts.error") || "Error",
                    "Failed to open chat. Please try again later."
                  )
                }
              },
            },
            {
              text: t("home.later") || "Later",
              style: "cancel",
            },
          ]
        )
      },
      onBookingStatusUpdate: ({ bookingId, status, booking }) => {
        console.log("📬 Booking status updated:", bookingId, status)
        // Update local state if needed
      },
    })

    return () => {
      // Cleanup listeners when component unmounts or firebaseUID changes
      if (socket && typeof socket.off === 'function') {
        try {
          socket.off("booking_status_update");
          socket.off("chat_room_created");
          socket.off("booking_notification");
        } catch (error) {
          console.warn('Error cleaning up socket listeners:', error);
        }
      }
    }
  }, [firebaseUID, navigation, t])

  // Define tour steps
  const tourSteps = [
    {
      title: "Welcome! ",
      description: "Let us show you how to find the perfect massage studio.",
      icon: "logo",
      tooltipPosition: {
        top: verticalScale(150),
        left: moderateScale(20),
        right: moderateScale(20),
      },
    },
    {
      title: "Swipe Cards",
      description: "Swipe right to book or swipe left to skip and see the next studio.",
      icon: "gesture-swipe",
      targetPosition: cardLayout,
      showSwipeDemo: true,
      tooltipPosition: {
        top: verticalScale(100),
        left: moderateScale(20),
        right: moderateScale(20),
      },
      arrowDirection: "bottom",
    },
    {
      title: "Notifications",
      description: "Check your booking confirmations here.",
      icon: "bell",
      targetPosition: notificationButtonLayout,
      tooltipPosition: {
        top: notificationButtonLayout ? notificationButtonLayout.top + moderateScale(70) : verticalScale(150),
        left: moderateScale(20),
        right: moderateScale(20),
      },
      arrowDirection: "top",
    },
    {
      title: "Chat",
      description: "Message parlors directly to ask questions.",
      icon: "chat",
      tooltipPosition: {
        bottom: moderateScale(160),
        left: moderateScale(20),
        right: moderateScale(20),
      },
    },
    {
      title: "Profile",
      description: "Access your bookings and account settings.",
      icon: "account",
      tooltipPosition: {
        bottom: moderateScale(160),
        left: moderateScale(20),
        right: moderateScale(20),
      },
    },
  ]

  useEffect(() => {
    initializeScreen()
  }, [])

  // Initialize card animations when currentIndex changes
  useEffect(() => {
    // Reset position for new current card
    position.setValue({ x: 0, y: 0 })

    // Fade in new card smoothly
    cardOpacity.setValue(0)
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [currentIndex])

  const initializeScreen = async () => {
    try {
      await fetchUserName()
      await fetchRecommendations()
      
      // Only proceed with measurement if we have studios loaded
      if (studios.length > 0) {
        setTimeout(() => {
          measureNotificationButton()
          measureCard()
        }, 1000) // Wait for layout
      }
    } catch (error) {
      console.error("❌ Error in initializeScreen:", error);
      setError(error.message || "Failed to initialize screen");
      setLoading(false);
    }
  }

  // Fetch Firebase UID and user name
  const fetchUserName = async () => {
    try {
      const currentUser = auth().currentUser
      if (currentUser) {
        setFirebaseUID(currentUser.uid)
        const userDoc = await firestore().collection("Useraccount").doc(currentUser.uid).get()

        if (userDoc.exists) {
          const userData = userDoc.data()
          setUserName(userData?.name || "User")
        }
      }
    } catch (error) {
      // Error fetching user name
    }
  }

  // Convert score to rating: supports 0-1 (matchScore) and 0-100 (score)
  const convertScoreToRating = (score) => {
    if (!score && score !== 0) return 0
    // If score looks like 0..1 (float), scale to 0..5
    if (score <= 1) return score * 5
    // If score looks like 0..100
    if (score <= 100) return ((score || 0) / 100) * 5
    return Math.min(((score || 0) / 100) * 5, 5)
  }

  // Format location object to string
  const formatLocation = (location) => {
    if (!location) return "Location unavailable"

    if (typeof location === "string") return location

    // Handle structured location object
    const parts = []
    if (location.streetAddress) parts.push(location.streetAddress)
    if (location.city) parts.push(location.city)
    if (location.province) parts.push(location.province)

    return parts.join(", ") || "Location unavailable"
  }

  // Fetch recommendations from backend (maps API response to UI model)
  // Now fetches both salon profiles and private massagers
  const fetchRecommendations = async () => {
    const startTime = Date.now()
    try {
      console.log("🔄 Fetching recommendations...")
      setLoading(true)
      setError(null)

      const currentUser = auth().currentUser
      if (!currentUser) {
        throw new Error("User not authenticated")
      }

      const uid = currentUser.uid
      // For now static coords; you can replace with geolocation later
      const latitude = 24.8607
      const longitude = 67.0011

      console.log("🌐 API_BASE_URL:", API_BASE_URL)
      console.log("🌐 Fetching salon recommendations from:", `${API_BASE_URL}/api/v1/recommendations/${uid}?limit=20&latitude=${latitude}&longitude=${longitude}`)
      console.log("🌐 Fetching private massagers from:", `${API_BASE_URL}/api/private-massagers?limit=20`)

      // Fetch both salon recommendations and private massagers in parallel
      const [salonResponse, privateMassagerResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/recommendations/${uid}?limit=20&latitude=${latitude}&longitude=${longitude}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }).catch(err => {
          console.error("❌ Error fetching salon recommendations:", err.message)
          console.error("❌ Full error:", err)
          return null
        }),
        fetch(`${API_BASE_URL}/api/private-massagers?limit=20`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }).catch(err => {
          console.error("❌ Error fetching private massagers:", err.message)
          console.error("❌ Full error:", err)
          return null
        }),
      ])
      
      console.log("📡 Salon response status:", salonResponse?.status || "null/undefined")
      console.log("📡 Private massager response status:", privateMassagerResponse?.status || "null/undefined")

      const fetchTime = Date.now() - startTime
      console.log(`⏱️ Fetch took ${fetchTime}ms`)

      // Process salon recommendations
      let salonRecommendations = []
      if (salonResponse) {
        if (salonResponse.ok) {
          const salonData = await salonResponse.json()
          console.log("📥 Received salon recommendations:", salonData)
          salonRecommendations = salonData.recommendations || salonData.data || []
        } else {
          const errorText = await salonResponse.text().catch(() => "Could not read error")
          console.warn("⚠️ Salon recommendations API error:", salonResponse.status, errorText)
        }
      } else {
        console.warn("⚠️ Salon recommendations fetch failed or returned null")
      }

      // Process private massagers
      let privateMassagers = []
      if (privateMassagerResponse) {
        if (privateMassagerResponse.ok) {
          const massagerData = await privateMassagerResponse.json()
          console.log("📥 Received private massagers:", massagerData)
          privateMassagers = massagerData.data || []
          console.log(`✅ Found ${privateMassagers.length} private massagers`)
        } else {
          const errorText = await privateMassagerResponse.text().catch(() => "Could not read error")
          console.warn("⚠️ Private massagers API error:", privateMassagerResponse.status, errorText)
        }
      } else {
        console.warn("⚠️ Private massagers fetch failed or returned null")
      }

      const data = { success: true, salonRecommendations, privateMassagers }
      console.log("📥 Combined data:", data)
      // Debug log 1: Log raw services from API
      console.log('📋 Raw services from API:', salonRecommendations[0]?.services || salonRecommendations[0]?.typesOfMassages || salonRecommendations[0]?.typesOfMassage || 'No services found');

      // Transform salon recommendations to unified format
      const transformedSalons = (salonRecommendations || []).map((rec, index) => {
        const salon = rec.salon || rec;
        const salonId = salon._id || salon.salonId || salon.id || rec._id || index;
        
        return {
          id: String(salonId),
          name: salon.name || "Salon",
          imageUrl: salon.imageUrl || salon.profilePicture || null,
          location: formatLocation(salon.location) || "Location not specified",
          price: salon.price || 0,
          rating: salon.rating || 0,
          services: salon.services || salon.typesOfMassages || salon.typesOfMassage || [],
          description: salon.description || "",
          isSubscribed: salon.isSubscribed || false,
          providerType: "salon",
          ownerId: salon.ownerId || null,
          _id: String(salonId)
        };
      });

      // Transform private massagers to unified format
      const transformedPrivateMassagers = (privateMassagers || []).map((pm, index) => {
        const pmId = pm._id || pm.id || `pm-${index}`;
        
        return {
          id: String(pmId),
          name: pm.name || "Private Massager",
          imageUrl: pm.imageUrl || pm.profilePicture || null,
          location: formatLocation(pm.location) || "Location not specified",
          price: pm.price || 0,
          rating: pm.rating || 0,
          services: pm.services || pm.typesOfMassages || pm.typesOfMassage || [],
          gender: pm.gender || null,
          height: pm.height || null,
          weight: pm.weight || null,
          occupation: pm.occupation || "Massage Therapist",
          aboutMe: pm.aboutMe || "",
          isSubscribed: pm.isSubscribed || false,
          providerType: "privateMassager",
          ownerId: pm.ownerId || null,
          _id: String(pmId)
        };
      });

      // Combine both types of providers
      const combined = [...transformedSalons, ...transformedPrivateMassagers];
      
      // Log the first few items for debugging
      console.log("🔄 Combined studios:", combined.slice(0, 3));
      
      // Update state
      setStudios(combined);
      setLoading(false);
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Fetched ${combined.length} studios in ${totalTime}ms`);
      
    } catch (error) {
      console.error("❌ Error in fetchRecommendations:", error);
      setError(error.message || "Failed to load recommendations");
      setLoading(false);
    }
  };

  const renderBackgroundCards = () => {
    return null;
  };

  const renderCard = (studio, index) => {
    // Determine if this is a private massager
    const isPrivateMassager = studio?.providerType === "privateMassager";
    
    // Only render the current card
    if (index !== currentIndex) {
      return null;
    }

    // Get the actual studio data
    const actualStudio = studio || studios[index] || (translatedStudios.length > 0 && translatedStudios.length === studios.length ? translatedStudios[index] : null);

    // Safety check
    if (!actualStudio) {
      return null;
    }

    // Prepare display tags based on provider type
    let displayTags = [];
    
    if (isPrivateMassager) {
      if (actualStudio.gender) displayTags.push(actualStudio.gender);
      if (actualStudio.occupation) displayTags.push(actualStudio.occupation);
      if (actualStudio.height) displayTags.push(`${actualStudio.height}cm`);
      
      while (displayTags.length < 3) {
        displayTags.push("Massage Therapist");
      }
    } else {
      const servicesArray = actualStudio.services || actualStudio.typesOfMassages || actualStudio.typesOfMassage || [];
      displayTags = servicesArray
        .filter(service => service && typeof service === 'string' && service.trim() !== '')
        .slice(0, 3);
      
      if (displayTags.length === 0) {
        displayTags = ["Massage", "Therapy", "Relaxation"];
      }
    }

    const combinedTransforms = [...position.getTranslateTransform(), { translateY: -CARD_RAISE }];
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-15deg', '0deg', '15deg'],
      extrapolate: 'clamp'
    });

    return (
      <Animated.View
        key={`${actualStudio.id}-${index}`}
        ref={index === currentIndex ? cardRef : null}
        style={[
          styles.cardContainer,
          {
            transform: [...combinedTransforms, { rotate }],
            opacity: cardOpacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <LinearGradient colors={["#FFFFFF", "#EDCFC9"]} style={styles.card}>
          <Animated.View style={[styles.likeIndicator, { opacity: likeOpacity }]}>
            <View style={styles.likeBadge}>
              <Icon name="check" size={moderateScale(28)} color="#4CAF50" />
              <Text style={styles.likeText}>LIKE</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.nopeIndicator, { opacity: nopeOpacity }]}>
            <View style={styles.nopeBadge} />
          </Animated.View>

          <View style={styles.imageContainer}>
            {actualStudio.imageUrl ? (
              <Image source={{ uri: actualStudio.imageUrl }} style={styles.studioImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.placeholderContent} />
              </View>
            )}
            
            {!isPrivateMassager && (
              <View style={styles.ratingBadge}>
                <Icon name="star" size={moderateScale(16)} color="#FDB022" />
                <Text style={styles.ratingText}>{formatText((actualStudio.rating || 0).toFixed(1))}</Text>
              </View>
            )}
            
            {actualStudio.isSubscribed && (
              <View style={styles.subscribedBadge}>
                <Icon name="check-decagram" size={moderateScale(16)} color="#FFFFFF" />
                <Text style={styles.subscribedText}>Premium</Text>
              </View>
            )}
            
            {isPrivateMassager && (
              <View style={styles.typeBadge}>
                <Icon name="account" size={moderateScale(14)} color="#FFFFFF" />
                <Text style={styles.typeBadgeText}>Private</Text>
              </View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.studioName} numberOfLines={1}>
              {actualStudio.name}
            </Text>
            
            <View style={styles.infoRow}>
              {!isPrivateMassager && (
                <View style={styles.priceContainer}>
                  <Icon name="currency-usd" size={moderateScale(16)} color="#C97B84" />
                  <Text style={styles.infoText}>
                    {t("home.from")} ${formatText((actualStudio.price || 0).toString())}
                  </Text>
                </View>
              )}
              
              {isPrivateMassager ? (
                <View style={styles.locationContainer}>
                  {actualStudio.height && actualStudio.weight && (
                    <>
                      <MaterialIcons name="straighten" size={moderateScale(16)} color="#C97B84" />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {actualStudio.height}cm • {actualStudio.weight}kg
                      </Text>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.locationContainer}>
                  <MaterialIcons name="location-on" size={moderateScale(16)} color="#C97B84" />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {actualStudio.location}
                  </Text>
                </View>
              )}
            </View>
            
            {isPrivateMassager && actualStudio.aboutMe && (
              <View style={styles.aboutMeContainer}>
                <Text style={styles.aboutMeText} numberOfLines={2}>
                  {actualStudio.aboutMe}
                </Text>
              </View>
            )}
            
            <View style={styles.tagsContainer}>
              <View style={styles.tagsRow}>
                {displayTags.slice(0, 2).map((tag, idx) => (
                  <View key={`tag-${idx}`} style={styles.tag}>
                    <Text style={styles.tagText} numberOfLines={1}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
              {displayTags[2] && (
                <View style={styles.tagsRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText} numberOfLines={1}>
                      {displayTags[2]}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Use translated studios only if they're fully ready and match the studios length
  // This prevents empty cards when translation is in progress
  const studiosToRender =
    translatedStudios.length > 0 &&
    translatedStudios.length === studios.length
      ? translatedStudios
      : studios;

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" backgroundColor="#EDE2E0" />
        <ActivityIndicator size="large" color="#D96073" />

      </View>
    )
  }

  // Error state - show message but keep header and bottom nav visible
  const showEmptyState = error && studios.length === 0 && !loading

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE2E0" />

      <AppTourGuide
        visible={showTour}
        onComplete={handleTourComplete}
        steps={[
          {
            title: t('tour.welcome'),
            description: t('tour.welcomeDesc'),
            target: 'welcome',
            overlay: true,
          },
          // Add more steps as needed
        ]}
      />

      <View style={styles.header}>
        <View style={styles.userBadge}>
          <Image source={require("../assets/png.png")} style={styles.userLogo} resizeMode="contain" />
          <Text style={styles.userName} numberOfLines={1}>
            Hi
          </Text>
        </View>
        <TouchableOpacity
  ref={notificationButtonRef}
  style={styles.notificationButton}
  onPress={() => navigation.navigate("notifications")}
>
  <Text style={{ fontSize: moderateScale(22), color: "#D96073" }}>🔔</Text>
</TouchableOpacity>
      </View>

      {showNotification && notificationType === "booking" && (
        <Animated.View style={styles.notification}>
          <Icon
            name="check-circle"
            size={moderateScale(20)}
            color="#D96073"
            style={styles.notificationIcon}
          />
          <Text style={styles.notificationText}>
            {t("home.bookingRequestSent") || "Booking request sent!"}
          </Text>
        </Animated.View>
      )}

      {showEmptyState ? (
        <View style={styles.emptyStateContainer}>
          <Icon name="alert-circle-outline" size={moderateScale(64)} color="#C97B84" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRecommendations}>
            <Text style={styles.retryButtonText}>{t("home.retry") || "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {renderBackgroundCards()}
          {studiosToRender.length > 0 && currentIndex < studiosToRender.length ? (
            studiosToRender.map((s, i) => renderCard(s, i))
          ) : (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>No more cards to display</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons
      {studiosToRender.length > 0 && currentIndex < studiosToRender.length && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton, bookingInProgress && styles.buttonDisabled]}
            onPress={swipeLeft}
            activeOpacity={0.7}
            disabled={bookingInProgress}
          >

       
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.bookButton, bookingInProgress && styles.buttonDisabled]}
            onPress={swipeRight}
            activeOpacity={0.7}
            disabled={bookingInProgress}
          >
            {bookingInProgress ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>

              </>
            )}
          </TouchableOpacity>
        </View>
      )} */}

      <BottomNav navigation={navigation} active="home" bottomOffset={moderateScale(12)} />
    </View>
  );
};

/**
 * Send booking request for a studio or private massager.
 * - Uses auth().currentUser for userId.
 * - Handles both salon and private massager provider types.
 */
const sendBookingRequest = async (studio) => {
  try {
    console.log("🔍 Starting booking request for provider:", JSON.stringify(studio, null, 2))
    console.log("🔍 Provider type:", studio.providerType)
    console.log("🔍 Provider ownerId:", studio.ownerId)
    
    if (!studio) {
      console.error("❌ No provider information provided")
      return { success: false, error: "No provider information provided" }
    }

    const currentUser = auth().currentUser
    if (!currentUser) {
      console.error("❌ No authenticated user")
      return { success: false, error: "You must be logged in to make a booking" }
    }
    const firebaseUID = currentUser.uid
    console.log("👤 User UID:", firebaseUID)

    // Determine provider type
    const isPrivateMassager = studio.providerType === "privateMassager"
    const providerId = studio.id || studio._id || (isPrivateMassager ? studio.privateMassagerId : studio.salonId)
    
    if (!providerId) {
      console.error("❌ No provider ID found:", studio)
      return { success: false, error: `${isPrivateMassager ? "Private massager" : "Salon"} ID is missing. Please try another provider.` }
    }
    console.log(`🏢 ${isPrivateMassager ? "Private Massager" : "Salon"} ID:`, providerId)

    // Fetch user profile data from Firestore
    let userName = ""
    let userEmail = ""

    try {
      const userDoc = await firestore().collection("Useraccount").doc(firebaseUID).get()

      if (userDoc.exists) {
        const userData = userDoc.data()
        userName = userData?.name || currentUser.displayName || "User"
        userEmail = userData?.email || currentUser.email || ""
      } else {
        // Fallback to auth user data
        userName = currentUser.displayName || "User"
        userEmail = currentUser.email || ""
      }
    } catch (error) {
      // Fallback to auth user data
      userName = currentUser.displayName || "User"
      userEmail = currentUser.email || ""
    }

    if (!userEmail) {
      console.error("❌ No user email found")
      return { success: false, error: "User email is required. Please update your profile." }
    }
    console.log("📧 User email:", userEmail)

    // Determine ownerId: prefer studio.ownerId, else fetch from backend
    let ownerId = studio.ownerId || null
    console.log("🔍 Initial ownerId from provider:", ownerId)

    if (!ownerId && !isPrivateMassager) {
      // For salons, try to fetch ownerId from backend if not available
      console.log("🔍 Fetching salon owner ID from backend...")
      try {
        const salonResponse = await fetch(`${API_BASE_URL}/api/v1/salons/${providerId}/with-owner`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (salonResponse.ok) {
          const salonJson = await salonResponse.json()
          const salon = salonJson.data || salonJson
          if (salon?.ownerId) {
            ownerId = typeof salon.ownerId === "object"
              ? (salon.ownerId._id || salon.ownerId.toString())
              : String(salon.ownerId)
            console.log("✅ Found owner ID from backend:", ownerId)
          }
        }
      } catch (err) {
        console.error("❌ Error fetching salon owner ID:", err)
      }
    } else if (!ownerId && isPrivateMassager) {
      // For private massagers, try to fetch ownerId from backend
      console.log("🔍 Fetching private massager owner ID from backend...")
      try {
        const massagerResponse = await fetch(`${API_BASE_URL}/api/private-massagers/${providerId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (massagerResponse.ok) {
          const massagerJson = await massagerResponse.json()
          const massager = massagerJson.data || massagerJson
          if (massager?.ownerId) {
            ownerId = typeof massager.ownerId === "object"
              ? (massager.ownerId._id || massager.ownerId.toString())
              : String(massager.ownerId)
            console.log("✅ Found owner ID from backend:", ownerId)
          }
        }
      } catch (err) {
        console.error("❌ Error fetching private massager owner ID:", err)
      }
    }

    // Convert ownerId to string if it's not already
    if (ownerId) {
      ownerId = typeof ownerId === "object"
        ? (ownerId._id || ownerId.toString() || String(ownerId))
        : String(ownerId)
      console.log("✅ Using owner ID:", ownerId)
    }

    if (!ownerId) {
      console.error("❌ Could not find ownerId")
      return {
        success: false,
        error: {
          error: `${isPrivateMassager ? "Private massager" : "Salon"} owner information is missing.`,
          message: "Unable to send booking request. Please try another provider or contact support."
        }
      }
    }

    // Prepare booking data according to backend API requirements
    // Default to 1 hour from now for requestedDateTime
    const requestedDateTime = new Date()
    requestedDateTime.setHours(requestedDateTime.getHours() + 1)

    // Build booking data based on provider type
    const bookingData = {
      firebaseUID: firebaseUID,
      name: userName,
      email: userEmail,
      requestedDateTime: requestedDateTime.toISOString(),
      durationMinutes: 60, // Default 60 minutes
      age: 0, // Can be updated later if user provides this info
      weightKg: 0, // Can be updated later if user provides this info
    }

    // Add provider-specific fields
    if (isPrivateMassager) {
      bookingData.privateMassagerId = providerId
      bookingData.salonOwnerId = ownerId // Backend expects salonOwnerId field even for private massagers
    } else {
      bookingData.salonId = providerId
      bookingData.salonOwnerId = ownerId
    }

    console.log("📤 Sending booking data:", bookingData)
    console.log("🌐 API URL:", `${API_BASE_URL}/api/v1/bookings/request`)

    const bookingResponse = await fetch(`${API_BASE_URL}/api/v1/bookings/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    })

    console.log("📥 Booking response status:", bookingResponse.status);

    if (bookingResponse.ok) {
      const result = await bookingResponse.json()
      console.log("✅ Booking successful:", result)
      return { success: true, data: result }
    } else {
      let errorText = null
      let errorJson = null
      try {
        errorText = await bookingResponse.text()
        console.error("❌ Booking error response:", errorText)
        try {
          errorJson = JSON.parse(errorText)
        } catch {
          // If parsing fails, errorJson stays null and we use errorText
        }
      } catch (err) {
        console.error("❌ Error reading response:", err)
      }

      return { 
        success: false, 
        error: errorJson || errorText || `Server error: ${bookingResponse.status}` 
      }
    }
  } catch (error) {
    console.error("❌ Booking request exception:", error)
    return { 
      success: false, 
      error: error.message || "Network error. Please check your connection and try again." 
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDE2E0",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: scaleFont(16),
    color: "#3D2C2C",
    fontWeight: "600",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
    paddingBottom: verticalScale(100), // Space for bottom nav
  },
  errorText: {
    marginTop: verticalScale(16),
    marginBottom: moderateScale(24),
    fontSize: scaleFont(16),
    color: "#C97B84",
    textAlign: "center",
    paddingHorizontal: moderateScale(32),
  },
  retryButton: {
    backgroundColor: "#D96073",
    paddingHorizontal: moderateScale(32),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(24),
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: scaleFont(16),
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
    paddingTop: verticalScale(50),
    paddingBottom: moderateScale(16),
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDCFC9",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    maxWidth: SCREEN_WIDTH * 0.6,
    gap: moderateScale(8),
  },
  userLogo: {
    width: moderateScale(28),
    height: moderateScale(28),
  },
  userName: {
    fontSize: scaleFont(15),
    fontWeight: "600",
    color: "#3D2C2C",
    flexShrink: 1,
  },
  notificationButton: {
    width: moderateScale(46),
    height: moderateScale(46),
    backgroundColor: "#EDCFC9",
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8BEC3",
    marginHorizontal: moderateScale(40),
    marginTop: moderateScale(8),
    marginBottom: moderateScale(8),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(20),
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationIcon: {
    marginRight: moderateScale(10),
  },
  notificationText: {
    fontSize: scaleFont(14),
    color: "#D96073",
    fontWeight: "600",
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: verticalScale(20),
  },
  backgroundCardsContainer: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: "center",
  },
  backgroundCard: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  backgroundCardInner: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(48),
    borderWidth: 1.5,
    borderColor: "#E5D7D3",
  },
  firstCard: {
    transform: [{ translateX: moderateScale(6) }],
    zIndex: 3,
  },
  secondCard: {
    transform: [{ translateX: moderateScale(12) }],
    zIndex: 2,
  },
  thirdCard: {
    transform: [{ translateX: moderateScale(18) }],
    zIndex: 1,
  },
  cardContainer: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: "center",
    zIndex: 10,
    shadowColor: "#9E6B62",
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: 0.5,
    shadowRadius: moderateScale(12),
    elevation: 12,
  },
  card: {
    flex: 1,
    borderRadius: moderateScale(48),
    overflow: "hidden",
  },
  likeIndicator: {
    position: "absolute",
    top: moderateScale(40),
    right: moderateScale(30),
    zIndex: 100,
    transform: [{ rotate: "15deg" }],
  },
  nopeIndicator: {
    position: "absolute",
    top: moderateScale(40),
    left: moderateScale(30),
    zIndex: 100,
    transform: [{ rotate: "-15deg" }],
  },
  likeBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.9)",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  nopeBadge: {


    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  likeText: {
    fontSize: scaleFont(12),
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: moderateScale(2),
  },
  nopeText: {
    fontSize: scaleFont(12),
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: moderateScale(2),
  },
  imageContainer: {
    height: "67%",
    backgroundColor: "#E8DDD8",
    borderRadius: moderateScale(38),
    margin: moderateScale(10),
    overflow: "hidden",
    position: "relative",
  },
  studioImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#D4C4BC",
  },
  placeholderContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: scaleFont(15),
    color: "#9B8B8B",
    marginTop: moderateScale(8),
  },
  ratingBadge: {
    position: "absolute",
    top: moderateScale(12),
    right: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(50),
    gap: moderateScale(4),
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  ratingText: {
    fontSize: scaleFont(12),
    fontWeight: "700",
    color: "#3D2C2C",
  },
  subscribedBadge: {
    position: "absolute",
    top: moderateScale(12),
    left: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D96073",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(50),
    gap: moderateScale(4),
  },
  subscribedText: {
    fontSize: scaleFont(11),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  typeBadge: {
    position: "absolute",
    top: moderateScale(12),
    left: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7B68EE",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(50),
    gap: moderateScale(4),
  },
  typeBadgeText: {
    fontSize: scaleFont(11),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  detailsContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(4),
    paddingBottom: moderateScale(12),
  },
  studioName: {
    fontSize: scaleFont(19),
    fontWeight: "700",
    color: "#3D2C2C",
    marginBottom: moderateScale(10),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(10),
    gap: moderateScale(16),
  },

  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: moderateScale(4),
  },
  infoText: {
    fontSize: scaleFont(12),
    color: "#C97B84",
    fontWeight: "500",
    flexShrink: 1,
  },
  aboutMeContainer: {
    marginBottom: moderateScale(8),
    paddingVertical: moderateScale(6),
  },
  aboutMeText: {
    fontSize: scaleFont(11),
    color: "#6B5B5B",
    fontStyle: "italic",
    lineHeight: scaleFont(16),
  },
  tagsContainer: {
    gap: moderateScale(6),
  },
  tagsRow: {
    flexDirection: "row",
    gap: moderateScale(6),
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#F6C5BB80",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  tagText: {
    fontSize: scaleFont(11),
    color: "#C97B84",
    fontWeight: "500",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(100),
    paddingTop: moderateScale(20),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(32),
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(30),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: moderateScale(140),
    gap: moderateScale(8),
  },
  skipButton: {
    backgroundColor: "#F69DAB",
  },
  bookButton: {
    backgroundColor: "#D96073",
  },
  skipButtonText: {
    fontSize: scaleFont(16),
    color: "#FFFFFF",
    fontWeight: "700",
  },
  bookButtonText: {
    fontSize: scaleFont(16),
    color: "#FFFFFF",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})

export default Homescreen