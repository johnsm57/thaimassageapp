import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../component/BottomNav';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const HORIZONTAL_PADDING = 20;
const ROW_HEIGHT = 48;
const MAX_CONTENT_WIDTH = Math.min(width - HORIZONTAL_PADDING * 2, 348);

const ProfileRow = ({ label, value, onPress, t, formatText, isNumeric = false, fieldType = 'text' }) => {
  const [translatedValue, setTranslatedValue] = useState(value || label);
  const { currentLanguage, translateDynamic } = useLanguage();

  useEffect(() => {
    const loadTranslation = async () => {
      if (!value) {
        setTranslatedValue(label);
        return;
      }

      // Handle gender translation
      if (value === 'Male' || value === 'Female') {
        setTranslatedValue(t(`genderValues.${value}`));
      }
      // Handle numeric values (age, weight)
      else if (isNumeric) {
        setTranslatedValue(formatText(value));
      }
      // Handle dynamic text (location, name)
      else if (fieldType === 'location' || fieldType === 'name') {
        if (currentLanguage === 'th') {
          const translated = await translateDynamic(value);
          setTranslatedValue(translated);
        } else {
          setTranslatedValue(value);
        }
      }
      // Default text
      else {
        setTranslatedValue(value);
      }
    };

    loadTranslation();
  }, [value, currentLanguage, fieldType]);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.row}>
      <Text style={styles.rowText}>{translatedValue}</Text>
      <MaterialIcons name="keyboard-arrow-right" size={20} color="#C97B84" />
    </TouchableOpacity>
  );
};

// Language Option Row with Radio Button
const LanguageOptionRow = ({ label, isSelected, onPress }) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.row}>
    <Text style={styles.rowText}>{label}</Text>
    <View style={styles.radioButton}>
      {isSelected && <View style={styles.radioButtonInner} />}
    </View>
  </TouchableOpacity>
);

const Setting = ({ navigation }) => {
  const { currentLanguage, changeLanguage, t, formatNum, formatText, translateDynamic } = useLanguage();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [tempValue, setTempValue] = useState('');
  const [translatedName, setTranslatedName] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  // Translate name when language or userData changes
  useEffect(() => {
    const translateName = async () => {
      if (userData?.name) {
        if (currentLanguage === 'th') {
          const translated = await translateDynamic(userData.name);
          setTranslatedName(translated);
        } else {
          setTranslatedName(userData.name);
        }
      }
    };

    translateName();
  }, [userData?.name, currentLanguage]);

  const fetchUserData = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        console.log('Fetching user data for:', currentUser.uid);
        
        const userDoc = await firestore()
          .collection('Useraccount')
          .doc(currentUser.uid)
          .get();

        if (userDoc.exists) {
          const data = userDoc.data();
          console.log('User data loaded:', data);
          setUserData(data);
        } else {
          console.log('No user document found, creating initial data');
          const initialData = {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || t('profile.name'),
            selectedLanguageType: 'default',
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
            profileCompleted: false,
          };
          await firestore()
            .collection('Useraccount')
            .doc(currentUser.uid)
            .set(initialData);
          setUserData(initialData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert(t('alerts.error'), t('alerts.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle language type selection
  const handleLanguageTypeSelect = async (lang) => {
    try {
      await changeLanguage(lang);
      console.log(`Language changed to: ${lang}`);
    } catch (error) {
      console.error('Error updating language:', error);
      Alert.alert(t('alerts.error'), t('alerts.languageUpdateFailed'));
    }
  };

  const openModal = (type, currentValue) => {
    setModalType(type);
    setModalValue(currentValue || '');
    setTempValue(currentValue || '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType('');
    setModalValue('');
    setTempValue('');
  };

  const saveField = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert(t('alerts.error'), t('alerts.noUser'));
        return;
      }

      // For other fields, check if empty
      if (modalType !== 'gender') {
        if (!tempValue || tempValue.trim() === '') {
          Alert.alert(t('alerts.error'), t('alerts.enterValue'));
          return;
        }
      }

      if (modalType === 'gender' && !tempValue) {
        Alert.alert(t('alerts.error'), t('alerts.selectOption'));
        return;
      }

      console.log(`Updating ${modalType} to:`, tempValue);

      const updateData = {
        [modalType]: tempValue.trim ? tempValue.trim() : tempValue,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (modalType === 'location') {
        updateData.locationCompleted = true;
      }

      await firestore()
        .collection('Useraccount')
        .doc(currentUser.uid)
        .update(updateData);

      console.log('Field updated successfully');
      setUserData((prev) => ({ ...prev, ...updateData }));
      closeModal();
      
      const fieldName = t(`personalDetails.${modalType}`);
      Alert.alert(t('alerts.success'), `${fieldName} ${t('alerts.updateSuccess')}`);
    } catch (error) {
      console.error('Error updating field:', error);
      Alert.alert(t('alerts.error'), t('alerts.updateFailed'));
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      await AsyncStorage.multiRemove(['userToken', 'isRegistered', 'userEmail']);
      console.log('✅ AsyncStorage cleared');
      
      await auth().signOut();
      console.log('✅ Firebase sign out successful');
      
      setLogoutModalVisible(false);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'splash' }],
      });
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error logging out:', error);
      Alert.alert(t('alerts.error'), t('alerts.logoutFailed'));
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'location': return t('personalDetails.location');
      case 'age': return t('personalDetails.age');
      case 'weight': return t('personalDetails.weight');
      case 'gender': return t('personalDetails.gender');
      default: return '';
    }
  };

  const getModalPlaceholder = () => {
    switch (modalType) {
      case 'location': return t('modal.enterLocation');
      case 'age': return t('modal.enterAge');
      case 'weight': return t('modal.enterWeight');
      case 'gender': return t('modal.selectGender');
      default: return '';
    }
  };

  const renderModalContent = () => {
    if (modalType === 'gender') {
      return (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.option,
              tempValue === 'Male' && styles.optionSelected,
            ]}
            onPress={() => setTempValue('Male')}
          >
            <Text style={styles.optionText}>{t('gender.male')}</Text>
            <View style={styles.radioButton}>
              {tempValue === 'Male' && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              tempValue === 'Female' && styles.optionSelected,
            ]}
            onPress={() => setTempValue('Female')}
          >
            <Text style={styles.optionText}>{t('gender.female')}</Text>
            <View style={styles.radioButton}>
              {tempValue === 'Female' && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TextInput
        style={styles.input}
        value={tempValue}
        onChangeText={setTempValue}
        placeholder={getModalPlaceholder()}
        placeholderTextColor="#B5A5A5"
        keyboardType={
          modalType === 'age' || modalType === 'weight' ? 'numeric' : 'default'
        }
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C97B84" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#D4A5AC" />

      {/* Colored Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#D4A5AC', '#E8C4D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>{t('profile.header')}</Text>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCardContainer}>
          <View style={styles.profileCardBackground} />
          
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarInner}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>😊</Text>
                </View>
                <TouchableOpacity style={styles.editBadge}>
                  <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.profileName}>
              {translatedName || t('profile.name')}
            </Text>
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personalDetails.title')}</Text>
          <ProfileRow 
            label={t('personalDetails.location')}
            value={userData?.location}
            onPress={() => openModal('location', userData?.location)}
            t={t}
            formatText={formatText}
            isNumeric={false}
            fieldType="location"
          />
          <ProfileRow 
            label={t('personalDetails.age')}
            value={userData?.age}
            onPress={() => openModal('age', userData?.age)}
            t={t}
            formatText={formatText}
            isNumeric={true}
            fieldType="age"
          />
          <ProfileRow 
            label={t('personalDetails.weight')}
            value={userData?.weight}
            onPress={() => openModal('weight', userData?.weight)}
            t={t}
            formatText={formatText}
            isNumeric={true}
            fieldType="weight"
          />
          <ProfileRow 
            label={t('personalDetails.gender')}
            value={userData?.gender}
            onPress={() => openModal('gender', userData?.gender)}
            t={t}
            formatText={formatText}
            isNumeric={false}
            fieldType="gender"
          />
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
          
          {/* English (Default Language) */}
          <LanguageOptionRow
            label={t('settings.english')}
            isSelected={currentLanguage === 'en'}
            onPress={() => handleLanguageTypeSelect('en')}
          />

          {/* Thai (Preferred Language) */}
          <LanguageOptionRow
            label={t('settings.thai')}
            isSelected={currentLanguage === 'th'}
            onPress={() => handleLanguageTypeSelect('th')}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          activeOpacity={0.9} 
          onPress={() => setLogoutModalVisible(true)}
        >
          <Feather name="log-out" size={18} color="#C97B84" />
          <Text style={styles.logoutText}>{t('logout.button')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav navigation={navigation} active="setting" />

      {/* Edit Field Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>

            {renderModalContent()}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>{t('modal.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.doneButton} 
                onPress={saveField}
              >
                <Text style={styles.doneButtonText}>{t('modal.done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutIconContainer}>
              <Feather name="log-out" size={48} color="#C97B84" />
            </View>
            
            <Text style={styles.logoutModalTitle}>{t('logout.title')}</Text>
            <Text style={styles.logoutModalMessage}>
              {t('logout.message')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('modal.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.logoutConfirmButton} 
                onPress={handleLogout}
              >
                <Text style={styles.doneButtonText}>{t('logout.button')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EDE2E0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDE2E0',
  },
  
  // Header Styles
  headerContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D1B47',
    letterSpacing: 0.5,
  },

  // Container
  container: {
    paddingTop: 30,
    paddingBottom: 160,
    paddingHorizontal: HORIZONTAL_PADDING,
    alignItems: 'center',
    backgroundColor: '#EDE2E0',
  },

  // Profile Card
  profileCardContainer: {
    position: 'relative',
    width: 244,
    height: 140,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardBackground: {
    position: 'absolute',
    width: 244,
    height: 140,
    backgroundColor: '#FFF6EF',
    opacity: 0.3,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#262628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  profileCard: {
    width: 244,
    height: 140,
    backgroundColor: '#FFF6EF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#262628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  avatarWrap: {
    marginBottom: 8,
  },
  avatarInner: {
    position: 'relative',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2D1B47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  editBadge: {
    position: 'absolute',
    right: -4,
    bottom: 0,
    backgroundColor: '#C97B84',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 14,
    color: '#7A6B7A',
    fontWeight: '500',
  },

  // Sections
  section: {
    width: MAX_CONTENT_WIDTH,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#2D1B47',
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    height: ROW_HEIGHT,
    backgroundColor: '#FEC9BE',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowText: {
    fontSize: 16,
    color: '#2D1B47',
    fontWeight: '500',
  },

  // Logout Button
  logoutBtn: {
    width: MAX_CONTENT_WIDTH,
    backgroundColor: '#FFF6EF',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    marginLeft: 10,
    color: '#C97B84',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FEC9BE',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D1B47',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5DDD8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D1B47',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E6C4C0',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  option: {
    backgroundColor: '#F5DDD8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6C4C0',
  },
  optionSelected: {
    borderColor: '#C97B84',
    borderWidth: 2,
    backgroundColor: '#F5E5E1',
  },
  optionText: {
    fontSize: 16,
    color: '#2D1B47',
    fontWeight: '500',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C97B84',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C97B84',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E8D4D0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A6B7A',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#C97B84',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Logout Modal
  logoutModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FEC9BE',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoutIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5DDD8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#C97B84',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D1B47',
    marginBottom: 12,
  },
  logoutModalMessage: {
    fontSize: 16,
    color: '#7A6B7A',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: '#C97B84',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Setting;