import React, { createContext, useState, useContext, useEffect } from 'react';
import { getTranslation, formatNumber, formatDisplayText } from '../locales';
import { translateTextCached } from '../utils/translator';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  // Load language from Firestore when app starts
  useEffect(() => {
    loadLanguageFromFirestore();
  }, []);

  const loadLanguageFromFirestore = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userDoc = await firestore()
          .collection('Useraccount')
          .doc(currentUser.uid)
          .get();

        if (userDoc.exists) {
          const data = userDoc.data();
          const languageType = data.selectedLanguageType || 'default';
          const lang = languageType === 'preferred' ? 'th' : 'en';
          setCurrentLanguage(lang);
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (lang) => {
    try {
      setCurrentLanguage(lang);
      
      const currentUser = auth().currentUser;
      if (currentUser) {
        const languageType = lang === 'th' ? 'preferred' : 'default';
        await firestore()
          .collection('Useraccount')
          .doc(currentUser.uid)
          .update({
            selectedLanguageType: languageType,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (error) {
      console.error('Error saving language:', error);
      throw error;
    }
  };

  const t = (key) => {
    return getTranslation(currentLanguage, key);
  };

  // Format numbers based on current language
  const formatNum = (number) => {
    return formatNumber(number, currentLanguage);
  };

  // Format display text (converts numbers in text)
  const formatText = (text) => {
    return formatDisplayText(text, currentLanguage);
  };

  // Translate dynamic text (names, locations, etc.)
  const translateDynamic = async (text) => {
    if (!text) return text;
    
    // Convert to Thai language code
    const targetLang = currentLanguage === 'th' ? 'th' : 'en';
    
    return await translateTextCached(text, targetLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        formatNum,
        formatText,
        translateDynamic,
        loading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};