import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { colors, fonts, spacing, radii } from '../constants/theme';

const MOCK_CHATS = [
  { id: '1', username: 'Bismillah Rice Mills', productTitle: 'Basmati Rice 50kg', secondaryDetail: 'Final price?', timestamp: '10:45 AM', isUnread: true, isFavourite: true, avatarColor: colors.accent, avatarInitial: 'B', type: 'buying' },
  { id: '2', username: 'Karachi Spice Co', productTitle: 'Red Chilli Powder 25kg', secondaryDetail: 'Quality check done', timestamp: '9:30 AM', isUnread: true, isFavourite: false, avatarColor: colors.primary, avatarInitial: 'K', type: 'buying' },
  { id: '3', username: 'Lahore Flour Mills', productTitle: 'Wheat Flour 100kg', secondaryDetail: 'Delivery scheduled', timestamp: 'Yesterday', isUnread: false, isFavourite: true, avatarColor: colors.green, avatarInitial: 'L', type: 'selling' },
  { id: '4', username: 'Punjab Oil Traders', productTitle: 'Cooking Oil 20L', secondaryDetail: 'Price confirmed', timestamp: 'Yesterday', isUnread: false, isFavourite: false, avatarColor: '#8B5CF6', avatarInitial: 'P', type: 'selling' },
  { id: '5', username: 'Sindh Sugar Mills', productTitle: 'White Sugar 50kg', secondaryDetail: 'In transit', timestamp: 'Mon', isUnread: false, isFavourite: false, avatarColor: '#EC4899', avatarInitial: 'S', type: 'buying' },
];

const CATEGORY_CHIPS = ['All', 'Buying', 'Selling', 'Favourites'];

function ChatItem({ chat, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chatRow, chat.isUnread && styles.chatRowUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.avatar, { backgroundColor: chat.avatarColor }]}>
        <Text style={styles.avatarText}>{chat.avatarInitial}</Text>
        <View style={styles.nexumBadge}>
          <Text style={styles.nexumBadgeText}>N</Text>
        </View>
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{chat.username}</Text>
            {chat.isFavourite && <Ionicons name="star" size={12} color={colors.green} />}
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.timestamp}>{chat.timestamp}</Text>
            {chat.isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
        <Text style={styles.productTitle}>{chat.productTitle}</Text>
        <Text style={styles.secondary}>{chat.secondaryDetail}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeChip, setActiveChip] = useState('All');
  const [search, setSearch] = useState('');

  // FIX: chip filter now actually applied
  const filtered = MOCK_CHATS.filter((c) => {
    const matchesSearch =
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.productTitle.toLowerCase().includes(search.toLowerCase());

    const matchesChip =
      activeChip === 'All' ||
      (activeChip === 'Buying' && c.type === 'buying') ||
      (activeChip === 'Selling' && c.type === 'selling') ||
      (activeChip === 'Favourites' && c.isFavourite);

    return matchesSearch && matchesChip;
  });

  // FIX: compose icon opens a new chat flow (navigate to marketplace)
  const handleCompose = () => {
    navigation.navigate('MarketplaceBrowsing');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
        {/* FIX: compose icon now has onPress */}
        <TouchableOpacity onPress={handleCompose}>
          <Ionicons name="create-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.chipRow}>
        {CATEGORY_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, activeChip === chip && styles.chipActive]}
            onPress={() => setActiveChip(chip)}
          >
            <Text style={[styles.chipText, activeChip === chip && styles.chipTextActive]}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // FIX: onPress now navigates to ChatConversation screen
          <ChatItem
            chat={item}
            onPress={() => navigation.navigate('ChatConversation', { chat: item })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={52} color="#374151" />
            <Text style={styles.emptyText}>No conversations found</Text>
          </View>
        }
      />

      <BottomNav activeTab="chat" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.bold, color: '#fff' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1F2937', marginHorizontal: spacing.md,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13, fontFamily: fonts.regular },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radii.full, borderWidth: 1, borderColor: '#374151',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontFamily: fonts.medium, color: '#9CA3AF' },
  chipTextActive: { color: '#fff' },
  chatRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  chatRowUnread: { backgroundColor: 'rgba(15,118,110,0.07)' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarText: { color: '#fff', fontSize: 18, fontFamily: fonts.semiBold },
  nexumBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9, backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0D0F12',
  },
  nexumBadgeText: { color: '#fff', fontSize: 8, fontFamily: fonts.bold },
  chatContent: { flex: 1 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  username: { fontSize: 14, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.8)' },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  timestamp: { fontSize: 11, color: '#6B7280', fontFamily: fonts.regular },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  productTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff', marginBottom: 2 },
  secondary: { fontSize: 12, color: 'rgba(15,118,110,0.7)', fontFamily: fonts.regular },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: spacing.md },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#6B7280', fontSize: 14, fontFamily: fonts.regular },
});
