import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, spacing, radii } from '../constants/theme';

const INITIAL_MESSAGES = [
  { id: '1', text: 'Assalamu Alaikum! I am interested in your product.', time: '10:30 AM', mine: false },
  { id: '2', text: 'Wa alaikum assalam! Welcome. What would you like to know?', time: '10:31 AM', mine: true },
  { id: '3', text: 'What is the minimum order quantity?', time: '10:32 AM', mine: false },
  { id: '4', text: 'Minimum order is 25kg. We can deliver to your location.', time: '10:33 AM', mine: true },
  { id: '5', text: 'What about the price for 100kg?', time: '10:35 AM', mine: false },
];

const QUICK_REPLIES = ['What is the price?', 'Minimum order?', 'Delivery available?', 'Send photos'];

export default function ChatConversationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const chat = route.params?.chat;
  const listRef = useRef(null);

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    const newMsg = {
      id: Date.now().toString(),
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mine: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    // Auto-scroll to bottom
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <Text style={[styles.bubbleText, item.mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
        {item.text}
      </Text>
      <Text style={[styles.bubbleTime, item.mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
        {item.time}
        {item.mine && <Text> ✓✓</Text>}
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
            <Text style={styles.headerProduct} numberOfLines={1}>{chat?.productTitle || 'Product inquiry'}</Text>
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
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Quick replies */}
      <View style={styles.quickReplies}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={QUICK_REPLIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.quickReply} onPress={() => sendMessage(item)}>
              <Text style={styles.quickReplyText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8 }}
        />
      </View>

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="attach" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.textLight}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, input.trim() ? styles.sendBtnActive : styles.sendBtnInactive]}
          onPress={() => sendMessage()}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={18} color={input.trim() ? '#fff' : colors.textLight} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontFamily: fonts.semiBold },
  headerText: { flex: 1 },
  headerName: { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff' },
  headerProduct: { fontSize: 11, fontFamily: fonts.regular, color: colors.primary },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8 },
  productStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(15,118,110,0.1)', paddingHorizontal: spacing.md, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(15,118,110,0.15)',
  },
  productStripText: { flex: 1, fontSize: 12, fontFamily: fonts.regular, color: '#9CA3AF' },
  productStripLink: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.primary },
  messageList: { padding: spacing.md, paddingBottom: 8 },
  bubble: {
    maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 8,
  },
  bubbleMine: {
    alignSelf: 'flex-end', backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start', backgroundColor: '#1F2937',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextTheirs: { color: '#F9FAFB' },
  bubbleTime: { fontSize: 10, fontFamily: fonts.regular, marginTop: 4 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeTheirs: { color: '#6B7280' },
  quickReplies: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  quickReply: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radii.full, borderWidth: 1, borderColor: 'rgba(15,118,110,0.4)',
    backgroundColor: 'rgba(15,118,110,0.08)',
  },
  quickReplyText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: spacing.md, paddingTop: 10,
    backgroundColor: '#1a1d23', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  attachBtn: { padding: 8, alignSelf: 'flex-end', marginBottom: 2 },
  textInput: {
    flex: 1, backgroundColor: '#374151', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, paddingTop: 10,
    color: '#fff', fontSize: 14, fontFamily: fonts.regular,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  sendBtnActive: { backgroundColor: colors.primary },
  sendBtnInactive: { backgroundColor: '#374151' },
});
