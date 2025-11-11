// Translation API helper
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

export const translateText = async (text, targetLang) => {
  if (!text || targetLang === 'en') {
    return text; // No translation needed for English
  }

  try {
    const sourceLang = 'en';
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    }
    
    return text; // Return original if translation fails
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
};

// Cache translations to avoid repeated API calls
const translationCache = {};

export const translateTextCached = async (text, targetLang) => {
  if (!text || targetLang === 'en') {
    return text;
  }

  const cacheKey = `${text}_${targetLang}`;
  
  // Check cache first
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // Translate and cache
  const translated = await translateText(text, targetLang);
  translationCache[cacheKey] = translated;
  
  return translated;
};

// Clear cache when needed
export const clearTranslationCache = () => {
  Object.keys(translationCache).forEach(key => {
    delete translationCache[key];
  });
};