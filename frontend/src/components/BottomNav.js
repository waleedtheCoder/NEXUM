import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts } from '../constants/theme';

const TAB_MAP = {
  Home: 'home',
  MyListings: 'listings',
  CategorySelection: 'sell',
  ChatList: 'chat',
  AccountSettings: 'account',
};

export default function BottomNav({ activeTab }) {
  const navigation = useNavigation();
  const route = useRoute();

  // Auto-derive from route name if not explicitly passed
  const derived = activeTab || TAB_MAP[route.name] || 'home';

  const tabs = [
    { key: 'home',     label: 'Home',     icon: 'home',              screen: 'Home' },
    { key: 'listings', label: 'Listings', icon: 'cube-outline',       screen: 'MyListings' },
    { key: 'sell',     label: 'Sell',     icon: 'add-circle',         screen: 'CategorySelection', isFAB: true },
    { key: 'chat',     label: 'Chat',     icon: 'chatbubble-outline',  screen: 'ChatList' },
    { key: 'account',  label: 'Account',  icon: 'person-outline',     screen: 'AccountSettings' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = derived === tab.key;

        if (tab.isFAB) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.fabWrapper}
              onPress={() => navigation.navigate(tab.screen)}
            >
              <View style={styles.fab}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
              <Text style={[styles.label, { color: colors.accent }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.screen)}
          >
            <Ionicons
              name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
              size={24}
              color={isActive ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.label, { color: isActive ? colors.primary : colors.textSecondary }]}>
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
  },
  fab: {
    backgroundColor: colors.accent,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
});
