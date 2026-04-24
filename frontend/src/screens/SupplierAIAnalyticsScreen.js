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
import { getSupplierAnalysis, getMarketForecast } from '../services/analyticsApi';

const CHART_W = Dimensions.get('window').width - 64;
const FORECAST_COLORS = ['#0F766E','#F97316','#9333EA','#22C55E','#3B82F6','#EF4444'];

export default function SupplierAIAnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();
  const [activeTab, setActiveTab] = useState('insights');

  const [analysisData, setAnalysisData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError]               = useState(null);
  const [isPremiumError, setIsPremiumError] = useState(false);

  const auth = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  useEffect(() => {
    loadAnalysis();
    loadForecast();
  }, [idToken, sessionId]);

  async function loadAnalysis() {
    setLoading(true);
    setError(null);
    setIsPremiumError(false);
    try {
      const result = await getSupplierAnalysis(auth);
      setAnalysisData(result);
    } catch (e) {
      if (e.status === 403) {
        setIsPremiumError(true);
      } else {
        setError(e.message || 'Failed to load analysis.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadForecast() {
    setForecastLoading(true);
    try {
      const result = await getMarketForecast(auth);
      setForecastData(result);
    } catch {
      // non-critical, fail silently
    } finally {
      setForecastLoading(false);
    }
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const listings     = analysisData?.listings || [];
  const activeCount  = listings.length;
  const lowPerfListings = listings.filter(l => l.analysis?.isLowPerforming);
  const lowPerfCount    = lowPerfListings.length;

  const allSuggestions = [...new Set(
    listings.flatMap(l => l.analysis?.portfolioSuggestions || [])
  )];

  // 4 aggregate insight cards from analysis data
  const insightCards = (() => {
    if (listings.length === 0) return [];

    const overpriced = listings.filter(l => {
      const curr = parseFloat(l.currentPrice);
      const rec  = parseFloat(l.analysis?.recommendedPrice);
      return rec && curr > rec * 1.05;
    }).length;
    const underpriced = listings.filter(l => {
      const curr = parseFloat(l.currentPrice);
      const rec  = parseFloat(l.analysis?.recommendedPrice);
      return rec && curr < rec * 0.95;
    }).length;
    const competitive = listings.length - overpriced - underpriced;

    const cityMap = {};
    listings.forEach(l => {
      const city = l.analysis?.bestCity;
      if (city) cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const topCity = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return [
      {
        icon: 'cash-outline', iconBg: '#E6F4FF', iconColor: '#0F766E',
        title: 'Price Positioning',
        value: `${competitive} Optimal`,
        desc: `${overpriced} overpriced · ${underpriced} underpriced across your listings.`,
        tag: 'Pricing',
      },
      {
        icon: 'location-outline', iconBg: '#F3E8FF', iconColor: '#9333EA',
        title: 'Best City',
        value: topCity,
        desc: `Most recommended target city for your active listings.`,
        tag: 'City',
      },
      {
        icon: 'alert-circle-outline', iconBg: '#FFF1E6', iconColor: '#F97316',
        title: 'Low Performers',
        value: `${lowPerfCount} Listing${lowPerfCount !== 1 ? 's' : ''}`,
        desc: lowPerfCount > 0
          ? lowPerfListings.map(l => l.title).join(', ')
          : 'All your listings are performing well.',
        tag: 'Alert',
      },
      {
        icon: 'trending-up-outline', iconBg: '#F0FDF4', iconColor: '#22C55E',
        title: 'Portfolio Gap',
        value: allSuggestions[0] || 'Up to date',
        desc: allSuggestions.length > 0
          ? `Consider adding: ${allSuggestions.slice(0, 3).join(', ')}.`
          : 'Your portfolio matches current market demand.',
        tag: 'Growth',
      },
    ];
  })();

  // Demand forecast bars — top 4 categories by predicted units
  const demandItems = (() => {
    const preds = forecastData?.predictions || [];
    const grouped = {};
    preds.forEach(p => {
      grouped[p.category] = (grouped[p.category] || 0) + p.predictedUnits;
    });
    const sorted = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const max = Math.max(...sorted.map(([, v]) => v), 1);
    return sorted.map(([cat, units], i) => ({
      name: cat,
      demand: Math.round((units / max) * 100),
      color: FORECAST_COLORS[i % FORECAST_COLORS.length],
    }));
  })();

  // Growth tips from portfolio suggestions + low-perf guidance
  const tips = (() => {
    const result = [];
    const lowPerf = listings.find(l => l.analysis?.isLowPerforming && l.analysis?.lowPerfGuidance);
    if (lowPerf) {
      result.push({ icon: 'alert-circle-outline', text: lowPerf.analysis.lowPerfGuidance, color: '#F97316' });
    }
    if (allSuggestions.length > 0) {
      result.push({
        icon: 'rocket-outline',
        text: `Market gap: consider adding ${allSuggestions.slice(0, 2).join(' or ')} to your portfolio.`,
        color: '#9333EA',
      });
    }
    result.push({ icon: 'shield-outline', text: 'Getting verified increases your listing visibility by 40%.', color: '#22C55E' });
    return result.slice(0, 3);
  })();

  // ── Premium upgrade prompt ──────────────────────────────────────────────────
  if (!loading && isPremiumError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
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
        <View style={styles.premiumBox}>
          <View style={styles.premiumIconWrap}>
            <Ionicons name="sparkles" size={36} color={colors.primary} />
          </View>
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumDesc}>
            Personal AI analysis is available for verified suppliers only. Get verified to unlock
            price recommendations, city targeting, and portfolio insights for every listing.
          </Text>
          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={() => navigation.navigate('Verification')}
          >
            <Text style={styles.verifyBtnText}>Get Verified</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.marketLinkBtn}
            onPress={() => navigation.navigate('MarketAnalysis')}
          >
            <Ionicons name="bar-chart-outline" size={16} color={colors.primary} />
            <Text style={styles.marketLinkText}>View Market Analysis (Free)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Analysing your listings...</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadAnalysis}>
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
                { label: 'Active Listings', value: String(activeCount), icon: 'cube-outline' },
                { label: 'Low Performing', value: String(lowPerfCount), icon: 'alert-circle-outline' },
                { label: 'Suggestions',    value: String(allSuggestions.length), icon: 'bulb-outline' },
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
                <Text style={styles.sectionLabel}>AI INSIGHTS</Text>
                {insightCards.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="cube-outline" size={32} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No active listings</Text>
                    <Text style={styles.emptyDesc}>Add active listings to receive personal AI analysis.</Text>
                  </View>
                ) : insightCards.map((card, i) => (
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

                {listings.length > 0 && (() => {
                  const good = listings.length - lowPerfCount;
                  const donutData = [
                    good > 0        ? { label: 'Performing',     value: good,         color: '#22C55E' } : null,
                    lowPerfCount > 0 ? { label: 'Low Performing', value: lowPerfCount, color: '#F97316' } : null,
                  ].filter(Boolean);
                  return (
                    <>
                      <Text style={styles.sectionLabel}>LISTING PERFORMANCE</Text>
                      <View style={[styles.insightCard, { flexDirection: 'column', alignItems: 'center', padding: spacing.md }]}>
                        <DonutChart
                          data={donutData}
                          size={170}
                          centerLabel={String(listings.length)}
                          centerSublabel="Listings"
                        />
                      </View>
                    </>
                  );
                })()}

                <Text style={styles.sectionLabel}>GROWTH TIPS</Text>
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

                <TouchableOpacity
                  style={styles.marketBanner}
                  onPress={() => navigation.navigate('MarketAnalysis')}
                >
                  <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.marketBannerTitle}>View Market Analysis</Text>
                    <Text style={styles.marketBannerDesc}>
                      City-wise trends, forecasts, and top products across the market.
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}

            {/* ── DEMAND TAB ───────────────────────────────────────────────── */}
            {activeTab === 'demand' && (
              <>
                <Text style={styles.sectionLabel}>MARKET CATEGORY DEMAND</Text>
                {forecastLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
                ) : demandItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyDesc}>
                      Demand forecast needs at least 2 months of market data.
                    </Text>
                    <TouchableOpacity
                      style={styles.marketLinkBtn}
                      onPress={() => navigation.navigate('MarketAnalysis')}
                    >
                      <Text style={styles.marketLinkText}>View Market Analysis</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={[styles.demandCard, { padding: spacing.md, paddingBottom: 8 }]}>
                      <BarChart
                        data={demandItems.map((item) => ({
                          label: item.name,
                          value: item.demand,
                          color: item.color,
                        }))}
                        width={CHART_W}
                        height={190}
                        gridColor={isDark ? '#2A2A2A' : '#E5E7EB'}
                        labelColor={colors.textSecondary}
                      />
                    </View>

                    <Text style={styles.sectionLabel}>BREAKDOWN</Text>
                    <View style={styles.demandCard}>
                      {demandItems.map((item, i) => (
                        <View key={item.name}
                          style={[styles.demandRow, i < demandItems.length - 1 && styles.demandRowBorder]}>
                          <Text style={styles.demandName}>{item.name}</Text>
                          <View style={styles.demandBarWrap}>
                            <View style={[styles.demandBar, {
                              width: `${item.demand}%`,
                              backgroundColor: item.color,
                            }]} />
                          </View>
                          <Text style={[styles.demandPct, { color: item.color }]}>{item.demand}%</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}

            {/* ── LISTINGS TAB ─────────────────────────────────────────────── */}
            {activeTab === 'listings' && (
              <>
                <Text style={styles.sectionLabel}>PER-LISTING ANALYSIS</Text>
                {listings.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyDesc}>No active listings to analyse.</Text>
                  </View>
                ) : listings.map((listing, i) => (
                  <View key={listing.listingId} style={styles.listingCard}>
                    <View style={styles.listingHeader}>
                      <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                      <View style={styles.listingCatPill}>
                        <Text style={[styles.listingCatText, { color: colors.primary }]}>{listing.category}</Text>
                      </View>
                    </View>
                    <View style={styles.listingRow}>
                      <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.listingMeta}>
                        Current: Rs {parseInt(listing.currentPrice).toLocaleString()} →
                        Suggested: Rs {parseInt(listing.analysis?.recommendedPrice || listing.currentPrice).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.listingRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.listingMeta} numberOfLines={2}>{listing.analysis?.cityReasoning}</Text>
                    </View>
                    {listing.analysis?.isLowPerforming && (
                      <View style={styles.lowPerfBadge}>
                        <Ionicons name="alert-circle-outline" size={12} color='#F97316' />
                        <Text style={styles.lowPerfText}>Low Performing</Text>
                      </View>
                    )}
                    {listing.analysis?.priceImpact ? (
                      <Text style={styles.listingImpact} numberOfLines={3}>
                        {listing.analysis.priceImpact}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </>
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
  insightTitle:   { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  insightTag:     { borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  insightTagText: { fontSize: 10, fontFamily: fonts.medium },
  insightValue:   { fontSize: 18, fontFamily: fonts.bold, color: colors.primary, marginBottom: 2 },
  insightDesc:    { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 17 },

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
  demandPct:     { width: 36, fontSize: 12, fontFamily: fonts.semiBold, textAlign: 'right' },

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

  marketBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1, borderColor: `${colors.primary}28`,
    borderRadius: radii.xl, padding: spacing.md,
  },
  marketBannerTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 2 },
  marketBannerDesc:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 17 },

  // Per-listing cards
  listingCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
    gap: 6,
  },
  listingHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  listingTitle:   { flex: 1, fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  listingCatPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full, backgroundColor: `${colors.primary}15` },
  listingCatText: { fontSize: 10, fontFamily: fonts.medium },
  listingRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  listingMeta:    { flex: 1, fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 17 },
  listingImpact:  { fontSize: 12, fontFamily: fonts.regular, color: colors.text, lineHeight: 17, backgroundColor: colors.backgroundAlt || colors.border, padding: 10, borderRadius: radii.md },
  lowPerfBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full,
  },
  lowPerfText: { fontSize: 11, fontFamily: fonts.semiBold, color: '#F97316' },

  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg,
    alignItems: 'center', gap: 8, marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  emptyTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  emptyDesc:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  // Premium gate
  premiumBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl, gap: 16,
  },
  premiumIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  premiumTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  premiumDesc: {
    fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  verifyBtn: {
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  verifyBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
  marketLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.full,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1, borderColor: `${colors.primary}28`,
  },
  marketLinkText: { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },

  loadingBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  loadingText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  errorBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  errorText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.primary },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
});
