import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Dimensions,
} from 'react-native';
import { BarChart, DonutChart } from '../components/ChartComponents';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';
import { getShopkeeperRecommendations } from '../services/analyticsApi';

const CHART_W = Dimensions.get('window').width - 64;

const ICON_CONFIGS = [
  { icon: 'cube-outline',         iconBg: '#E6F4FF', iconColor: '#0F766E' },
  { icon: 'trending-up-outline',  iconBg: '#F3E8FF', iconColor: '#9333EA' },
  { icon: 'star-outline',         iconBg: '#FFF1E6', iconColor: '#F97316' },
  { icon: 'bag-check-outline',    iconBg: '#F0FDF4', iconColor: '#22C55E' },
];

const STATIC_TIPS = [
  { icon: 'shield-checkmark-outline', text: 'All recommendations are from verified or highly-rated suppliers.', color: '#22C55E' },
  { icon: 'time-outline',             text: 'Prices on bulk orders tend to be 8-12% lower — buy in larger quantities when possible.', color: '#0F766E' },
];

export default function ShopkeeperAIAnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();
  const [activeTab, setActiveTab] = useState('insights');

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const auth = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  useEffect(() => {
    load();
  }, [idToken, sessionId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getShopkeeperRecommendations(auth);
      setData(result);
    } catch (e) {
      setError(e.message || 'Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  }

  // Derive data from API response
  const products    = data?.products || [];
  const reasoning   = data?.reasoning || '';
  const topProducts = products.slice(0, 4);

  const insightCards = topProducts.map((p, i) => ({
    ...ICON_CONFIGS[i % ICON_CONFIGS.length],
    title: p.title,
    value: `Rs ${parseInt(p.price).toLocaleString()}/${p.unit}`,
    desc:  `${p.supplier?.name}${p.supplier?.verified ? ' · Verified ✓' : ''} · ${p.location}`,
    tag:   p.category,
  }));

  const uniqueCategories = [...new Set(products.map(p => p.category))];
  const uniqueSuppliers  = [...new Set(products.map(p => p.supplier?.id).filter(Boolean))];

  const tips = [
    ...(reasoning ? [{ icon: 'bulb-outline', text: reasoning, color: '#F97316' }] : []),
    ...STATIC_TIPS,
  ];

  // Spending tab: category distribution
  const categoryMap = {};
  products.forEach(p => { categoryMap[p.category] = (categoryMap[p.category] || 0) + 1; });
  const categoryDist = Object.entries(categoryMap)
    .map(([cat, count]) => ({ cat, count }))
    .sort((a, b) => b.count - a.count);
  const maxCatCount = Math.max(...categoryDist.map(c => c.count), 1);
  const CAT_COLORS = ['#0F766E','#F97316','#9333EA','#22C55E','#3B82F6','#EF4444'];

  // Suppliers tab: unique suppliers from recommendations
  const supplierMap = {};
  products.forEach(p => {
    if (p.supplier?.id && !supplierMap[p.supplier.id]) {
      supplierMap[p.supplier.id] = { ...p.supplier, categories: new Set() };
    }
    if (p.supplier?.id) supplierMap[p.supplier.id].categories.add(p.category);
  });
  const supplierList = Object.values(supplierMap);

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
          <Text style={styles.headerSub}>Shopkeeper Intelligence</Text>
        </View>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={13} color="#fff" />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {['insights', 'spending', 'suppliers'].map((tab) => (
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your recommendations...</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Summary bar */}
            <View style={styles.summaryRow}>
              {[
                { label: 'Recommended', value: String(products.length), icon: 'cube-outline' },
                { label: 'Categories',  value: String(uniqueCategories.length), icon: 'grid-outline' },
                { label: 'Suppliers',   value: String(uniqueSuppliers.length), icon: 'business-outline' },
              ].map((s, i) => (
                <View key={i} style={styles.summaryCard}>
                  <Ionicons name={s.icon} size={18} color={colors.primary} />
                  <Text style={styles.summaryValue}>{s.value}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* ── INSIGHTS TAB ─────────────────────────────────────────────── */}
            {activeTab === 'insights' && (
              <>
                <Text style={styles.sectionLabel}>
                  {insightCards.length > 0 ? 'TOP RECOMMENDATIONS' : 'AI INSIGHTS'}
                </Text>

                {insightCards.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="cube-outline" size={32} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No recommendations yet</Text>
                    <Text style={styles.emptyDesc}>Place some orders and we'll personalise your suggestions.</Text>
                  </View>
                ) : insightCards.map((card, i) => (
                  <View key={i} style={styles.insightCard}>
                    <View style={[styles.insightIcon, { backgroundColor: card.iconBg }]}>
                      <Ionicons name={card.icon} size={22} color={card.iconColor} />
                    </View>
                    <View style={styles.insightBody}>
                      <View style={styles.insightTitleRow}>
                        <Text style={styles.insightTitle} numberOfLines={1}>{card.title}</Text>
                        <View style={[styles.insightTag, { backgroundColor: `${colors.primary}15` }]}>
                          <Text style={[styles.insightTagText, { color: colors.primary }]}>{card.tag}</Text>
                        </View>
                      </View>
                      <Text style={styles.insightValue}>{card.value}</Text>
                      <Text style={styles.insightDesc} numberOfLines={2}>{card.desc}</Text>
                    </View>
                  </View>
                ))}

                <Text style={styles.sectionLabel}>SMART TIPS</Text>
                <View style={styles.tipsCard}>
                  {tips.map((tip, i) => (
                    <View key={i} style={[styles.tipRow, i < tips.length - 1 && styles.tipRowBorder]}>
                      <View style={[styles.tipDot, { backgroundColor: `${tip.color}20` }]}>
                        <Ionicons name={tip.icon} size={16} color={tip.color} />
                      </View>
                      <Text style={styles.tipText}>{tip.text}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ── SPENDING TAB — category distribution ─────────────────────── */}
            {activeTab === 'spending' && (
              <>
                {categoryDist.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyDesc}>No category data available yet.</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.sectionLabel}>PRODUCT DISTRIBUTION</Text>
                    <View style={[styles.demandCard, { padding: spacing.md, alignItems: 'center' }]}>
                      <DonutChart
                        data={categoryDist.slice(0, 6).map((item, i) => ({
                          label: item.cat,
                          value: item.count,
                          color: CAT_COLORS[i % CAT_COLORS.length],
                        }))}
                        size={190}
                        centerLabel={String(products.length)}
                        centerSublabel="Products"
                      />
                    </View>

                    <Text style={styles.sectionLabel}>BY CATEGORY</Text>
                    <View style={[styles.demandCard, { padding: spacing.md, paddingBottom: 8 }]}>
                      <BarChart
                        data={categoryDist.slice(0, 8).map((item, i) => ({
                          label: item.cat,
                          value: item.count,
                          color: CAT_COLORS[i % CAT_COLORS.length],
                        }))}
                        width={CHART_W}
                        height={170}
                        gridColor={isDark ? '#2A2A2A' : '#E5E7EB'}
                        labelColor={colors.textSecondary}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.marketBtn}
                  onPress={() => navigation.navigate('MarketAnalysis')}
                >
                  <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
                  <Text style={styles.marketBtnText}>View Full Market Analysis</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}

            {/* ── SUPPLIERS TAB ─────────────────────────────────────────────── */}
            {activeTab === 'suppliers' && (
              <>
                <Text style={styles.sectionLabel}>RECOMMENDED SUPPLIERS</Text>
                {supplierList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyDesc}>No supplier data available yet.</Text>
                  </View>
                ) : (
                  <View style={styles.tipsCard}>
                    {supplierList.map((s, i) => (
                      <View key={s.id}
                        style={[styles.tipRow, i < supplierList.length - 1 && styles.tipRowBorder]}>
                        <View style={[styles.tipDot, { backgroundColor: s.verified ? '#F0FDF4' : `${colors.primary}10` }]}>
                          <Ionicons
                            name={s.verified ? 'shield-checkmark-outline' : 'business-outline'}
                            size={16}
                            color={s.verified ? '#22C55E' : colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tipText}>{s.name}</Text>
                          <Text style={styles.supplierCategories}>
                            {[...s.categories].join(', ')}
                          </Text>
                        </View>
                        {s.verified && (
                          <View style={styles.verifiedPill}>
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Market analysis banner — visible on all tabs */}
            {activeTab === 'insights' && (
              <TouchableOpacity
                style={styles.marketBanner}
                onPress={() => navigation.navigate('MarketAnalysis')}
              >
                <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.marketBannerTitle}>View Market Analysis</Text>
                  <Text style={styles.marketBannerDesc}>
                    See what's selling in your city, 12-month trends, and next-month forecasts.
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 16, paddingTop: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
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
    marginHorizontal: spacing.md, marginTop: 16,
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radii.lg },
  tabActive: { backgroundColor: colors.primary },
  tabText:       { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  tabTextActive: { color: '#fff', fontFamily: fonts.semiBold },

  scroll: { padding: spacing.md, paddingBottom: 40 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  summaryCard: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderRadius: radii.xl, paddingVertical: 14,
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
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  insightIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  insightBody:    { flex: 1 },
  insightTitleRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  insightTitle:   { flex: 1, fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, marginRight: 6 },
  insightTag:     { borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  insightTagText: { fontSize: 10, fontFamily: fonts.medium },
  insightValue:   { fontSize: 18, fontFamily: fonts.bold, color: colors.primary, marginBottom: 2 },
  insightDesc:    { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 17 },

  tipsCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl, overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  tipRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  tipDot:       { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipText:      { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: colors.text, lineHeight: 18 },

  supplierCategories: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  verifiedPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full,
    backgroundColor: '#F0FDF4',
  },
  verifiedText: { fontSize: 10, fontFamily: fonts.semiBold, color: '#22C55E' },

  demandCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl, overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  demandRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md },
  demandRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  demandName:    { width: 110, fontSize: 12, fontFamily: fonts.medium, color: colors.text },
  demandBarWrap: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  demandBar:     { height: '100%', borderRadius: 3 },
  demandPct:     { width: 28, fontSize: 12, fontFamily: fonts.semiBold, textAlign: 'right' },

  marketBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1, borderColor: `${colors.primary}28`,
    borderRadius: radii.xl, padding: spacing.md,
  },
  marketBannerTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 2 },
  marketBannerDesc:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 17 },

  marketBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: `${colors.primary}10`, borderRadius: radii.xl, padding: spacing.md,
    borderWidth: 1, borderColor: `${colors.primary}28`, marginBottom: spacing.lg,
  },
  marketBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary, flex: 1 },

  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg,
    alignItems: 'center', gap: 8, marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  emptyTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  emptyDesc:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  loadingText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  errorBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  errorText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.primary },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
});
