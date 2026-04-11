// BottomNav — floating pill redesign.
//
// Sits inside the layout flow (not absolutely positioned) but appears to float
// via marginHorizontal: 12, marginBottom: 8, and a strong drop shadow.
//
// Light mode : teal primary background, white icons.
// Dark mode  : dark surface background, white icons.
// Active tab : frosted inner pill (rgba(255,255,255,0.22)).

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { fonts } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const TAB_MAP = {
  Home:     'home',
  Browse:   'browse',
  Sell:     'sell',
  ChatList: 'chat',
  Account:  'account',
};

const SUPPLIER_TABS = [
  { key: 'home',    label: 'Home',     icon: 'home-outline',       screen: 'Home' },
  { key: 'sell',    label: 'Listings', icon: 'cube-outline',       screen: 'Sell' },
  { key: 'create',  label: 'Create',   icon: 'add-circle',         screen: 'CategorySelection', isFAB: true },
  { key: 'chat',    label: 'Chat',     icon: 'chatbubble-outline', screen: 'ChatList' },
  { key: 'account', label: 'Account',  icon: 'person-outline',     screen: 'Account' },
];

const SHOPKEEPER_TABS = [
  { key: 'home',    label: 'Home',    icon: 'home-outline',       screen: 'Home' },
  { key: 'browse',  label: 'Browse',  icon: 'storefront-outline', screen: 'Browse' },
  { key: 'chat',    label: 'Chat',    icon: 'chatbubble-outline', screen: 'ChatList' },
  { key: 'account', label: 'Account', icon: 'person-outline',     screen: 'Account' },
];

export default function BottomNav({ activeTab }) {
  const navigation = useNavigation();
  const route      = useRoute();
  const { role }   = useUser();
  const { colors } = useTheme();

  const isShopkeeper = role === 'shopkeeper' || !role;
  const tabs         = isShopkeeper ? SHOPKEEPER_TABS : SUPPLIER_TABS;
  const derived      = activeTab || TAB_MAP[route.name] || 'home';

  // Pill background: teal in light, dark surface in dark
  const pillBg = colors.isDark ? colors.surface : colors.primary;

  return (
    <View style={[styles.container, {
      backgroundColor: pillBg,
      // Primary-tinted or neutral shadow
      shadowColor: colors.isDark ? '#000' : colors.primary,
    }]}>
      {tabs.map((tab) => {
        const isActive   = derived === tab.key;
        const activeIcon = tab.icon.replace('-outline', '');

        if (tab.isFAB) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.fabWrapper}
              onPress={() => navigation.navigate(tab.screen)}
              activeOpacity={0.85}
            >
              <View style={[styles.fab, {
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
                borderTopColor: 'rgba(255,255,255,0.35)',
              }]}>
                <Ionicons name="add" size={26} color="#fff" />
              </View>
              <Text style={styles.fabLabel}>Create</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => navigation.navigate(tab.screen)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isActive ? activeIcon : tab.icon}
              size={22}
              color={isActive ? '#fff' : 'rgba(255,255,255,0.55)'}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 28,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    // Top-edge inner highlight
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    // Floating shadow
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius:  18,
    elevation:     14,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.55)',
  },
  labelActive: {
    color: '#fff',
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
    gap: 3,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius:  8,
    elevation:     8,
  },
  fabLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
