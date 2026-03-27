import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, spacing, radii } from '../constants/theme';
import { getMessages, sendMessage } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const QUICK_REPLIES = [
  'What is the price?',
  'Minimum order?',
  'Delivery available?',
  'Send photos',
];

export default function ChatConversationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const chat = route.params?.chat;
  const convId = chat?.id;

  const listRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Load messages on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!convId) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getMessages(convId, authArgs);
        if (!cancelled) setMessages(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load messages.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [convId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = useCallback(async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || sending) return;

    // Optimistic message (no id yet)
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mine: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    setSending(true);
    try {
      const confirmed = await sendMessage(convId, text, authArgs);
      // Replace the optimistic message with the server-confirmed one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? confirmed : m))
      );
    } catch {
      // Remove the optimistic message on failure and restore the input
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, sending, convId, authArgs]);

  // ── Render helpers ──────────────────────────────────────────────────────
  const renderMessage = ({ item }) => (
    <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <Text style={[styles.bubbleText, item.mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
        {item.text}
      </Text>
      <Text style={[styles.bubbleTime, item.mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
        {item.time}
        {item.mine && <Text>  ✓✓</Text>}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerInfo} activeOpacity={0.8}>
          <View style={[styles.avatar, { backgroundColor: chat?.avatarColor || colors.primary }]}>
            <Text style={styles.avatarText}>{chat?.avatarInitial || 'S'}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>{chat?.username || 'Seller'}</Text>
            <Text style={styles.headerProduct} numberOfLines={1}>
              {chat?.productTitle || 'Product inquiry'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="call-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Product context strip */}
      {chat?.productTitle && (
        <View style={styles.productStrip}>
          <Ionicons name="cube-outline" size={14} color={colors.primary} />
          <Text style={styles.productStripText} numberOfLines={1}>{chat.productTitle}</Text>
          <TouchableOpacity>
            <Text style={styles.productStripLink}>View</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#374151" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />
      )}

      {/* Quick replies */}
      <View style={styles.quickReplies}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={QUICK_REPLIES}
          keyExtractor={(q) => q}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickReply}
              onPress={() => handleSend(item)}
            >
              <Text style={styles.quickReplyText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8 }}
        />
      </View>

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="attach" size={22} color="#9CA3AF" />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#6B7280"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={4096}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#9CA3AF', fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  emptyText: { color: '#6B7280', fontSize: 14, fontFamily: fonts.regular },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingBottom: 12,
    backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontFamily: fonts.bold, color: '#fff' },
  headerText: { flex: 1 },
  headerName: { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff' },
  headerProduct: { fontSize: 11, fontFamily: fonts.regular, color: '#9CA3AF' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8 },

  productStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    backgroundColor: `${colors.primary}12`,
    borderBottomWidth: 1, borderBottomColor: `${colors.primary}20`,
  },
  productStripText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: '#9CA3AF' },
  productStripLink: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.primary },

  messageList: { paddingHorizontal: spacing.md, paddingVertical: 12, gap: 8 },

  bubble: {
    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9,
    marginVertical: 2,
  },
  bubbleMine: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#1F2937', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextTheirs: { color: '#E5E7EB' },
  bubbleTime: { fontSize: 10, fontFamily: fonts.regular, marginTop: 4 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeTheirs: { color: '#6B7280' },

  quickReplies: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  quickReply: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#1F2937', borderRadius: radii.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  quickReplyText: { fontSize: 12, fontFamily: fonts.medium, color: '#D1D5DB' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: spacing.md, paddingTop: 10,
    backgroundColor: '#111827', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  attachBtn: { padding: 6, marginBottom: 4 },
  textInput: {
    flex: 1, backgroundColor: '#1F2937', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    color: '#fff', fontSize: 14, fontFamily: fonts.regular,
    maxHeight: 120, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: '#374151' },
});
