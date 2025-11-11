import en from './en';
import th from './th';

export const translations = {
  en,
  th,
};

export const getTranslation = (lang, key) => {
  const keys = key.split('.');
  let value = translations[lang];
  
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return value;
};

// Convert English numbers (0-9) to Thai numbers (๐-๙)
export const convertToThaiNumbers = (text) => {
  if (!text) return text;
  
  const thaiNumbers = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  const textStr = String(text);
  
  return textStr.replace(/[0-9]/g, (digit) => thaiNumbers[parseInt(digit)]);
};

// Format number based on language
export const formatNumber = (number, lang) => {
  if (!number) return number;
  
  const numStr = String(number);
  
  if (lang === 'th') {
    return convertToThaiNumbers(numStr);
  }
  
  return numStr;
};

// Format text for display (handles numbers in text)
export const formatDisplayText = (text, lang) => {
  if (!text) return text;
  
  if (lang === 'th') {
    return convertToThaiNumbers(text);
  }
  
  return text;
};