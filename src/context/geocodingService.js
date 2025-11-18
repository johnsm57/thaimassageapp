import axios from 'axios';

/**
 * Reverse Geocoding using OpenStreetMap Nominatim (Free, No API Key Required)
 * Converts latitude/longitude to city name in ENGLISH
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    console.log(`🔍 Reverse geocoding: ${latitude}, ${longitude}`);
    
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          format: 'json',
          lat: latitude,
          lon: longitude,
          zoom: 10,
          addressdetails: 1,
          'accept-language': 'en', // Force English results
        },
        headers: {
          'User-Agent': 'ThaiMassageApp/1.0',
          'Accept-Language': 'en-US,en;q=0.9', // Force English in headers too
        },
        timeout: 10000,
      }
    );

    if (response.data && response.data.address) {
      const address = response.data.address;
      
      // Extract city name in English
      const city = address.city || 
                   address.town || 
                   address.village || 
                   address.municipality || 
                   address.county || 
                   address.state ||
                   'Unknown Location';
      
      const country = address.country || 'Unknown';
      const state = address.state || '';

      console.log(`✅ Geocoding success: ${city}, ${country}`);

      return {
        city: city,
        country: country,
        state: state,
        fullAddress: response.data.display_name,
        latitude,
        longitude,
      };
    }

    console.log('⚠️ No address data in response');
    return null;
  } catch (error) {
    console.error('❌ Geocoding error:', error.message);
    return null;
  }
};