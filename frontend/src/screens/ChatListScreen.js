import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { colors, fonts, spacing, radii } from '../constants/theme';
import { getConversations } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

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
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChip, setActiveChip] = useState('All');
  const [search, setSearch] = useState('');

  const authArgs = {
    idToken,
    sessionId,
    refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // Fetch conversations; re-fetch every time the screen comes into focus
  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConversations(authArgs);
      setConversations(data);
    } catch (err) {
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [idToken, sessionId])
  );

  // Client-side chip + search filter (API type filter is available too,
  // but filtering locally keeps chip switches instant without a round-trip)
  const filtered = conversations.filter((c) => {
    const matchesSearch =
      !search ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.productTitle.toLowerCase().includes(search.toLowerCase());

    const matchesChip =
      activeChip === 'All' ||
      (activeChip === 'Buying' && c.type === 'buying') ||
      (activeChip === 'Selling' && c.type === 'selling') ||
      (activeChip === 'Favourites' && c.isFavourite);

    return matchesSearch && matchesChip;
  });

  const handleCompose = () => navigation.navigate('MarketplaceBrowsing');

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
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
            <Text style={[styles.chipText, activeChip === chip && styles.chipTextActive]}>
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#374151" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchConversations}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatItem
              chat={item}
              onPress={() => navigation.navigate('ChatConversation', { chat: item })}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={52} color="#374151" />
              <Text style={styles.errorText}>No conversations found</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => navigation.navigate('MarketplaceBrowsing')}
              >
                <Text style={styles.retryText}>Browse Marketplace</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

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
  chipRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radii.full, backgroundColor: '#1F2937',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontFamily: fonts.medium, color: '#9CA3AF' },
  chipTextActive: { color: '#fff' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 40 },
  errorText: { color: '#9CA3AF', fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.full },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  // Chat row
  chatRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  chatRowUnread: { backgroundColor: 'rgba(0,168,89,0.06)' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarText: { fontSize: 18, fontFamily: fonts.bold, color: '#fff' },
  nexumBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: colors.primary, borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  nexumBadgeText: { fontSize: 9, fontFamily: fonts.bold, color: '#fff' },
  chatContent: { flex: 1 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  username: { fontSize: 14, fontFamily: fonts.semiBold, color: '#fff' },
  rightCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timestamp: { fontSize: 11, fontFamily: fonts.regular, color: '#6B7280' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  productTitle: { fontSize: 12, fontFamily: fonts.medium, color: '#9CA3AF', marginBottom: 2 },
  secondary: { fontSize: 12, fontFamily: fonts.regular, color: '#6B7280' },
});
