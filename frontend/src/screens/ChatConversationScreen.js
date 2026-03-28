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
import config from '../../config';

// Derive the WebSocket host from the HTTP base URL in config.js
// e.g. "http://192.168.0.134:8000" → "192.168.0.134:8000"
const WS_HOST = config.BACKEND_URL.replace(/^https?:\/\//, '');

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
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const chat   = route.params?.chat;
  const convId = chat?.id;

  const listRef       = useRef(null);
  const wsRef         = useRef(null);   // holds the live WebSocket instance
  const pendingTemps  = useRef([]);     // queue of optimistic tempIds waiting for WS echo

  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [error,       setError]       = useState(null);
  const [wsConnected, setWsConnected] = useState(false); // drives the live indicator dot

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── 1. Load message history via REST on mount ───────────────────────────
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

  // ── 2. Open WebSocket connection on mount, close on unmount ────────────
  useEffect(() => {
    if (!convId || !idToken) return;

    const ws = new WebSocket(`ws://${WS_HOST}/ws/chat/${convId}/?token=${idToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        setMessages((prev) => {
          // If this is an echo of our own sent message, replace the optimistic placeholder
          if (msg.mine && pendingTemps.current.length > 0) {
            const tempId = pendingTemps.current.shift(); // pop oldest pending
            return prev.map((m) => (m.id === tempId ? msg : m));
          }
          // Otherwise it's an inbound message from the other participant — just append
          // (guard against duplicates: the REST history fetch may have loaded it already)
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Scroll to new message
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      } catch {
        // Malformed frame — ignore
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setWsConnected(false);
      // Don't null wsRef here — onclose fires immediately after onerror
    };

    // Cleanup: close the socket when navigating away
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [convId, idToken]);

  // ── 3. Scroll to bottom when new messages arrive ────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  // ── 4. Send message — WebSocket primary, REST fallback ─────────────────
  const handleSend = useCallback(async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || sending) return;

    // Append optimistic message immediately so the UI feels instant
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id:   tempId,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mine: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    const ws = wsRef.current;
    const wsOpen = ws && ws.readyState === WebSocket.OPEN;

    if (wsOpen) {
      // Primary path: send via WebSocket
      // The server will broadcast the confirmed message back (with real id + time).
      // onmessage will receive it and replace the optimistic placeholder.
      pendingTemps.current.push(tempId);
      try {
        ws.send(JSON.stringify({ text }));
      } catch {
        // ws.send threw synchronously — fall back to REST
        pendingTemps.current.pop();
        await _sendViaRest(tempId, text, optimisticMsg);
      }
    } else {
      // Fallback path: WebSocket not open, use REST silently
      setSending(true);
      await _sendViaRest(tempId, text, optimisticMsg);
      setSending(false);
    }
  }, [input, sending, convId, authArgs]);

  // REST fallback helper (used when WS is unavailable)
  const _sendViaRest = async (tempId, text, optimisticMsg) => {
    try {
      const confirmed = await sendMessage(convId, text, authArgs);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmed : m)));
    } catch {
      // Remove optimistic message and restore input so the user can retry
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    }
  };

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

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerInfo} activeOpacity={0.8}>
          <View style={[styles.avatar, { backgroundColor: chat?.avatarColor || colors.primary }]}>
            <Text style={styles.avatarText}>{chat?.avatarInitial || 'S'}</Text>
          </View>
          <View style={styles.headerText}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>{chat?.username || 'Seller'}</Text>
              {/* Live indicator dot — shown when WebSocket is connected */}
              {wsConnected && <View style={styles.liveDot} />}
            </View>
            <Text style={styles.headerProduct} numberOfLines={1}>
              {wsConnected ? 'Live' : (chat?.productTitle || 'Product inquiry')}
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

      {/* ── Product context strip ─────────────────────────────────────────── */}
      {chat?.productTitle && (
        <View style={styles.productStrip}>
          <Ionicons name="cube-outline" size={14} color={colors.primary} />
          <Text style={styles.productStripText} numberOfLines={1}>{chat.productTitle}</Text>
          <TouchableOpacity>
            <Text style={styles.productStripLink}>View</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Message list ─────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.errorText}>{error}</Text>
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

      {/* ── Quick replies ─────────────────────────────────────────────────── */}
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

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="attach-outline" size={22} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Message..."
          placeholderTextColor="rgba(255,255,255,0.35)"
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

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0D0F12' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText:   { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14, fontFamily: fonts.regular },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 12,
    backgroundColor: '#111827',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn:     { padding: 4, marginRight: 4 },
  headerInfo:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:     { color: '#fff', fontSize: 15, fontFamily: fonts.bold },
  headerText:     { flex: 1 },
  headerNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerName:     { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff', flexShrink: 1 },
  headerProduct:  { fontSize: 12, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  headerActions:  { flexDirection: 'row', gap: 4 },
  headerBtn:      { padding: 6 },

  // Live indicator dot (green pulse when WS is open)
  liveDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#22c55e',
  },

  // ── Product strip ────────────────────────────────────────────────────────
  productStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    backgroundColor: 'rgba(0,168,89,0.08)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  productStripText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.7)' },
  productStripLink: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.primary },

  // ── Messages ─────────────────────────────────────────────────────────────
  messageList:      { paddingHorizontal: spacing.md, paddingTop: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: '78%', borderRadius: radii.lg,
    paddingHorizontal: 14, paddingVertical: 9, marginBottom: 6,
  },
  bubbleMine:   { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: '#1F2937' },
  bubbleText:         { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  bubbleTextMine:     { color: '#fff' },
  bubbleTextTheirs:   { color: '#E5E7EB' },
  bubbleTime:         { fontSize: 10, fontFamily: fonts.regular, marginTop: 4 },
  bubbleTimeMine:     { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeTheirs:   { color: '#6B7280' },

  // ── Quick replies ─────────────────────────────────────────────────────────
  quickReplies: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  quickReply: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#1F2937', borderRadius: radii.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  quickReplyText: { fontSize: 12, fontFamily: fonts.medium, color: '#D1D5DB' },

  // ── Input bar ─────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: spacing.md, paddingTop: 10,
    backgroundColor: '#111827', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  attachBtn:  { padding: 6, marginBottom: 4 },
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