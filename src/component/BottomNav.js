import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

const BottomNav = ({ navigation, active = 'home', bottomOffset = 18, fixedBottom }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // If fixedBottom is provided, use it (quick explicit control).
  // Otherwise compute from safe area inset + bottomOffset.
  const bottomPosition = typeof fixedBottom === 'number' ? fixedBottom : (insets?.bottom || 0) + (bottomOffset || 0);

  return (
    // container covers whole screen but passes touches through outside nav
    <View pointerEvents="box-none" style={styles.container}>
      <View style={[styles.bottomNav, { bottom: bottomPosition }]}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => navigation?.navigate?.('Home')}
        >
          <View style={active === 'home' ? styles.navButtonActive : null}>
            <Icon name="home" size={20} color={active === 'home' ? '#C97B84' : '#E5BDC0'} />
            {active === 'home' && <Text style={styles.navTextActive}>{t('bottomNav.home')}</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => navigation?.navigate?.('massage')}
        >
          <View style={active === 'messages' ? styles.navButtonActive : null}>
            <Ionicons name="chatbubble-outline" size={20} color={active === 'messages' ? '#C97B84' : '#E5BDC0'} />
            {active === 'messages' && <Text style={styles.navTextActive}>{t('bottomNav.chat')}</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => navigation?.navigate?.('setting')}
        >
          <View style={active === 'setting' ? styles.profileActive : null}>
            <Icon name="account-outline" size={20} color={active === 'setting' ? '#C97B84' : '#E5BDC0'} />
            {active === 'setting' && <Text style={styles.profileLabel}>{t('bottomNav.setting')}</Text>}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // occupy screen without affecting layout (touches pass through)
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 999,
  },
  bottomNav: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#262628',
    borderRadius: 24,
    width: 273,
    height: 64,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    paddingHorizontal: 10,
    zIndex: 999,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEAAB2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 17,
    gap: 6,
    height: 54,
  },
  navTextActive: {
    fontSize: 13,
    color: '#C97B84',
    fontWeight: '600',
    marginLeft: 8,
  },
  profileActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEAAB2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 17,
    gap: 6,
    height: 54,
  },
  profileLabel: {
    marginLeft: 6,
    fontSize: 12,
    color: '#C97B84',
    fontWeight: '600',
  },
});

export default BottomNav;