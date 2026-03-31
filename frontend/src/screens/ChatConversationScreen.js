import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getMessages, sendMessage, sendTypingSignal } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const POLL_INTERVAL_MS = 3000;

const QUICK_REPLIES = [
  'What is the price?',
  'Minimum order?',
  'Delivery available?',
  'Send photos',
];

export default function ChatConversationScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const chat   = route.params?.chat;
  const convId = chat?.id;

  const listRef = useRef(null);

  const [messages, setMessages]         = useState([]);
  const [input,    setInput]            = useState('');
  const [loading,  setLoading]          = useState(true);
  const [sending,  setSending]          = useState(false);
  const [error,    setError]            = useState(null);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const typingTimerRef = useRef(null);

  // Build auth args from current token values (not in deps to avoid re-creating intervals)
  const authArgsRef = useRef({});
  useEffect(() => {
    authArgsRef.current = {
      idToken, sessionId, refreshToken,
      onTokenRefreshed: (t) => updateUser({ idToken: t }),
    };
  }, [idToken, sessionId, refreshToken]);

  const fetchMessages = useCallback(async (isInitial = false) => {
    if (!convId) return;
    try {
      const data = await getMessages(convId, authArgsRef.current);
      // Backend now returns { messages, other_is_typing }
      if (data && typeof data === 'object' && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setOtherIsTyping(!!data.other_is_typing);
      } else {
        // Fallback if backend returns plain array (old format)
        setMessages(Array.isArray(data) ? data : []);
      }
      if (isInitial) setError(null);
    } catch (err) {
      if (isInitial) setError(err.message || 'Failed to load messages.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [convId]);

  // Send typing signal with debounce — fires at most once per 2.5s
  const handleTyping = useCallback((text) => {
    setInput(text);
    if (!convId || !text) return;
    if (typingTimerRef.current) return;  // already scheduled
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
      sendTypingSignal(convId, authArgsRef.current).catch(() => {});
    }, 2500);
  }, [convId]);

  // Cleanup typing timer on unmount
  useEffect(() => () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); }, []);

  // Initial load
  useEffect(() => {
    if (!convId) { setLoading(false); return; }
    fetchMessages(true);
  }, [convId]);

  // Polling for new messages every 3 seconds
  useEffect(() => {
    if (loading || !convId) return;
    const interval = setInterval(() => fetchMessages(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loading, convId, fetchMessages]);

  const handleSend = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;

    if (!overrideText) setInput('');
    setSending(true);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, text, time: 'Sending…', mine: true, pending: true },
    ]);

    try {
      await sendMessage(convId, text, authArgsRef.current);
      // Refresh immediately to get the server-confirmed message
      await fetchMessages(false);
    } catch {
      // Remove failed optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }, [input, sending, convId, fetchMessages]);

  const styles = makeStyles(colors);

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
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
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
            <Ionicons name="call-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Product strip */}
      {chat?.productTitle && (
        <View style={styles.productStrip}>
          <Ionicons name="cube-outline" size={14} color={colors.primary} />
          <Text style={styles.productStripText} numberOfLines={1}>{chat.productTitle}</Text>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchMessages(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Typing indicator */}
      {otherIsTyping && (
        <View style={styles.typingRow}>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>{chat?.username || 'Seller'} is typing…</Text>
          </View>
        </View>
      )}

      {/* Quick replies — shown when conversation is empty */}
      {!loading && !error && messages.length === 0 && (
        <FlatList
          data={QUICK_REPLIES}
          horizontal
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickReplies}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.quickReply} onPress={() => handleSend(item)}>
              <Text style={styles.quickReplyText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="attach-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={handleTyping}
          placeholder="Message..."
          placeholderTextColor={colors.textLight}
          multiline
          returnKeyType="default"
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={16} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  retryBtn:  { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.full },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn:       { padding: 4, marginRight: 4 },
  headerInfo:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { color: '#fff', fontSize: 15, fontFamily: fonts.bold },
  headerText:    { flex: 1 },
  headerName:    { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text, flexShrink: 1 },
  headerProduct: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn:     { padding: 6 },

  // Product strip
  productStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    backgroundColor: `${colors.primary}10`,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  productStripText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary },

  // Messages
  messageList:    { paddingHorizontal: spacing.md, paddingTop: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: '78%', borderRadius: radii.lg,
    paddingHorizontal: 14, paddingVertical: 9, marginBottom: 6,
  },
  bubbleMine:          { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleTheirs:        { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt },
  bubbleText:          { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  bubbleTextMine:      { color: '#fff' },
  bubbleTextTheirs:    { color: colors.text },
  bubbleTime:          { fontSize: 10, fontFamily: fonts.regular, marginTop: 4 },
  bubbleTimeMine:      { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeTheirs:    { color: colors.textSecondary },

  // Typing indicator
  typingRow:    { paddingHorizontal: spacing.md, paddingBottom: 4 },
  typingBubble: {
    alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  typingText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, fontStyle: 'italic' },

  // Quick replies
  quickReplies: { paddingVertical: 8, paddingHorizontal: spacing.md, gap: 8 },
  quickReply: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.surfaceAlt, borderRadius: radii.full,
    borderWidth: 1, borderColor: colors.border,
  },
  quickReplyText: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: spacing.md, paddingTop: 10,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  attachBtn: { padding: 6, marginBottom: 4 },
  textInput: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    color: colors.text, fontSize: 14, fontFamily: fonts.regular,
    maxHeight: 120, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: colors.border },
});
