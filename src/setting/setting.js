import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const ProfileRow = ({ label, onPress }) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.row}>
    <Text style={styles.rowText}>{label}</Text>
    <MaterialIcons name="keyboard-arrow-right" size={22} color="#C97B84" />
  </TouchableOpacity>
);

const Setting = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE2E0" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Title */}
        <View style={styles.headerWrap}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.cardOuter}>
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarInner}>
                {/* Replace with real image using <Image source={...} /> */}
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  size={72}
                  color="#3D2C2C"
                />
                {/* small edit icon */}
                <View style={styles.editBadge}>
                  <MaterialCommunityIcons
                    name="pencil"
                    size={12}
                    color="#fff"
                  />
                </View>
              </View>
            </View>
            <Text style={styles.profileName}>Samuel</Text>
          </View>
        </View>

        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details -</Text>

          <ProfileRow label="Location" onPress={() => {}} />
          <ProfileRow label="Age" onPress={() => {}} />
          <ProfileRow label="Weight" onPress={() => {}} />
          <ProfileRow label="Gender" onPress={() => {}} />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings -</Text>
          <ProfileRow label="default language" onPress={() => {}} />
          <ProfileRow label="preference" onPress={() => {}} />
        </View>

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#C97B84" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        {/* Bottom navigation (floating) */}
        <View style={styles.bottomWrap}>
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem}>
              <View style={styles.homeIconActive}>
                <MaterialCommunityIcons
                  name="home"
                  size={18}
                  color="#C97B84"
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={20}
                color="#E5BDC0"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <View style={styles.profileActive}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={18}
                  color="#C97B84"
                />
                <Text style={styles.profileLabel}>profile</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const PADDING = 24;
const rowHeight = 56;
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EDE2E0', // page background as requested
  },
  container: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: '#EDE2E0',
  },
  headerWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#2D1B47',
  },

  /* Profile Card */
  cardOuter: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 22,
  },
  profileCard: {
    width: width - 80,
    backgroundColor: '#F6EAE8',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    // subtle card shadow like design
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarWrap: {
    marginBottom: 8,
  },
  avatarInner: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    // inner shadow feeling
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  editBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#C97B84',
    borderRadius: 10,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    marginTop: 6,
    fontSize: 14,
    color: '#7A6B7A',
  },

  /* Section */
  section: {
    marginTop: 6,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 12,
    marginLeft: 6,
  },

  /* Row style */
  row: {
    height: rowHeight,
    backgroundColor: '#F2D2CE',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    // subtle inner border shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rowText: {
    fontSize: 16,
    color: '#2D1B47',
    fontWeight: '500',
  },

  /* Logout */
  logoutBtn: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    // shadow similar to image
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutText: {
    marginLeft: 8,
    color: '#2D1B47',
    fontSize: 16,
    fontWeight: '500',
  },

  /* Bottom nav */
  bottomWrap: {
    alignItems: 'center',
    marginTop: 26,
  },
  bottomNav: {
    width: width * 0.62,
    height: 64,
    backgroundColor: '#222222',
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    // strong shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  homeIconActive: {
    backgroundColor: '#E8C4CC',
    padding: 8,
    borderRadius: 12,
  },
  profileActive: {
    backgroundColor: '#E8C4CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLabel: {
    marginLeft: 6,
    fontSize: 12,
    color: '#C97B84',
    fontWeight: '600',
  },
});

export default Setting;