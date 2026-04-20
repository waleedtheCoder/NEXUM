import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const INSIGHT_CARDS = [
  {
    icon: 'bar-chart-outline',
    iconBg: '#E6F4FF',
    iconColor: '#0F766E',
    title: 'Sales Velocity',
    value: '+18%',
    desc: 'Your listings are selling faster than last month.',
    tag: 'Growth',
  },
  {
    icon: 'eye-outline',
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
    title: 'Listing Views',
    value: '1,240',
    desc: 'Total views across all active listings this week.',
    tag: 'Visibility',
  },
  {
    icon: 'people-outline',
    iconBg: '#FFF1E6',
    iconColor: '#F97316',
    title: 'Repeat Buyers',
    value: '34%',
    desc: 'Shopkeepers who ordered from you more than once.',
    tag: 'Retention',
  },
  {
    icon: 'trending-up-outline',
    iconBg: '#F0FDF4',
    iconColor: '#22C55E',
    title: 'Top Listing',
    value: 'Basmati 25kg',
    desc: 'Most viewed and ordered product this month.',
    tag: 'Product',
  },
];

const DEMAND_ITEMS = [
  { name: 'Rice & Grains',     demand: 82, color: '#0F766E' },
  { name: 'Cooking Oil',       demand: 67, color: '#F97316' },
  { name: 'Flour & Atta',      demand: 55, color: '#9333EA' },
  { name: 'Spices & Masalas',  demand: 43, color: '#22C55E' },
];

const TIPS = [
  { icon: 'rocket-outline',    text: 'Add more photos to your listings — they get 3× more inquiries.', color: '#9333EA' },
  { icon: 'time-outline',      text: 'Respond to inquiries within 1 hour to improve your rank.', color: '#F97316' },
  { icon: 'shield-outline',    text: 'Getting verified can increase your listing visibility by 40%.', color: '#22C55E' },
];

export default function SupplierAIAnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Analytics</Text>
          <Text style={styles.headerSub}>Supplier Intelligence</Text>
        </View>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={13} color="#fff" />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {['insights', 'demand', 'listings'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Summary bar */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Active Listings', value: '12', icon: 'cube-outline' },
            { label: 'Inquiries',       value: '38', icon: 'chatbubble-outline' },
            { label: 'Orders',          value: '21', icon: 'bag-check-outline' },
          ].map((s, i) => (
            <View key={i} style={styles.summaryCard}>
              <Ionicons name={s.icon} size={18} color={colors.primary} />
              <Text style={styles.summaryValue}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* AI Insight cards */}
        <Text style={styles.sectionLabel}>AI INSIGHTS</Text>
        {INSIGHT_CARDS.map((card, i) => (
          <View key={i} style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: card.iconBg }]}>
              <Ionicons name={card.icon} size={22} color={card.iconColor} />
            </View>
            <View style={styles.insightBody}>
              <View style={styles.insightTitleRow}>
                <Text style={styles.insightTitle}>{card.title}</Text>
                <View style={[styles.insightTag, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.insightTagText, { color: colors.primary }]}>{card.tag}</Text>
                </View>
              </View>
              <Text style={styles.insightValue}>{card.value}</Text>
              <Text style={styles.insightDesc}>{card.desc}</Text>
            </View>
          </View>
        ))}

        {/* Demand forecast */}
        <Text style={styles.sectionLabel}>CATEGORY DEMAND</Text>
        <View style={styles.demandCard}>
          {DEMAND_ITEMS.map((item, i) => (
            <View key={i} style={[styles.demandRow, i < DEMAND_ITEMS.length - 1 && styles.demandRowBorder]}>
              <Text style={styles.demandName}>{item.name}</Text>
              <View style={styles.demandBarWrap}>
                <View style={[styles.demandBar, { width: `${item.demand}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={[styles.demandPct, { color: item.color }]}>{item.demand}%</Text>
            </View>
          ))}
        </View>

        {/* Smart tips */}
        <Text style={styles.sectionLabel}>GROWTH TIPS</Text>
        <View style={styles.tipsCard}>
          {TIPS.map((tip, i) => (
            <View key={i} style={[styles.tipRow, i < TIPS.length - 1 && styles.tipRowBorder]}>
              <View style={[styles.tipDot, { backgroundColor: `${tip.color}20` }]}>
                <Ionicons name={tip.icon} size={16} color={tip.color} />
              </View>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

        {/* Coming soon banner */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.comingSoonTitle}>Advanced Forecasting Coming Soon</Text>
            <Text style={styles.comingSoonDesc}>
              Price optimization, demand prediction, and buyer scoring are being trained on your sales data.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
    paddingTop: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 17, fontFamily: fonts.bold },
  headerSub:   { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontFamily: fonts.regular, marginTop: 1 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  aiBadgeText: { color: '#fff', fontSize: 11, fontFamily: fonts.semiBold },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radii.lg },
  tabActive: { backgroundColor: colors.primary },
  tabText:       { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  tabTextActive: { color: '#fff', fontFamily: fonts.semiBold },

  scroll: { padding: spacing.md, paddingBottom: 40 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  summaryCard: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radii.xl, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  summaryValue: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  summaryLabel: { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },

  sectionLabel: {
    fontSize: 11, fontFamily: fonts.semiBold, color: colors.textSecondary,
    letterSpacing: 0.6, marginBottom: 10, marginTop: 4,
  },

  insightCard: {
    flexDirection: 'row', gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.xl, padding: spacing.md,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  insightIcon: {
    width: 50, height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  insightBody:    { flex: 1 },
  insightTitleRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  insightTitle:   { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  insightTag:     { borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  insightTagText: { fontSize: 10, fontFamily: fonts.medium },
  insightValue:   { fontSize: 18, fontFamily: fonts.bold, color: colors.primary, marginBottom: 2 },
  insightDesc:    { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 17 },

  demandCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl, overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  demandRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md },
  demandRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  demandName:    { width: 110, fontSize: 12, fontFamily: fonts.medium, color: colors.text },
  demandBarWrap: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  demandBar:     { height: '100%', borderRadius: 3 },
  demandPct:     { width: 36, fontSize: 12, fontFamily: fonts.semiBold, textAlign: 'right' },

  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl, overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  tipRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  tipDot:       { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipText:      { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: colors.text, lineHeight: 18 },

  comingSoonBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1, borderColor: `${colors.primary}28`,
    borderRadius: radii.xl, padding: spacing.md,
  },
  comingSoonTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 4 },
  comingSoonDesc:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 18 },
});
