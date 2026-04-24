import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Dimensions,
} from 'react-native';
import { BarChart, LineChart } from '../components/ChartComponents';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';
import {
  getMarketCurrent,
  getMarketHistory,
  getMarketForecast,
  getMarketTopProducts,
} from '../services/analyticsApi';

const CHART_W = Dimensions.get('window').width - 64;
const TABS  = ['overview', 'history', 'forecast', 'top10'];
const TAB_LABELS = { overview: 'Overview', history: 'History', forecast: 'Forecast', top10: 'Top 10' };
const BAR_COLORS = ['#0F766E','#F97316','#9333EA','#22C55E','#3B82F6','#EF4444','#EC4899','#F59E0B'];

function confidenceColor(c) {
  if (c >= 0.7) return '#22C55E';
  if (c >= 0.4) return '#F97316';
  return '#EF4444';
}

function fmtMonth(str) {
  if (!str) return '';
  const [y, m] = str.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[parseInt(m, 10) - 1]} ${y}`;
}

function fmtNum(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function MarketAnalysisScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const auth = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  const [activeTab, setActiveTab]     = useState('overview');
  const [selectedCity, setSelectedCity] = useState('');
  const [tabData, setTabData]         = useState({});
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [cities, setCities]           = useState([]);

  const cacheKey  = `${activeTab}::${selectedCity}`;
  const data      = tabData[cacheKey];

  const fetchTab = useCallback(async (tab, city) => {
    const key = `${tab}::${city}`;
    setLoading(true);
    setError(null);
    try {
      let result;
      if (tab === 'overview')  result = await getMarketCurrent({ city, ...auth });
      if (tab === 'history')   result = await getMarketHistory({ city, ...auth });
      if (tab === 'forecast')  result = await getMarketForecast({ city, ...auth });
      if (tab === 'top10')     result = await getMarketTopProducts({ city, ...auth });
      setTabData(prev => ({ ...prev, [key]: result }));

      // Extract city list from overview for chips
      if (tab === 'overview' && !city && result?.cityBreakdown) {
        setCities(result.cityBreakdown.map(c => c.city).filter(Boolean));
      }
    } catch (e) {
      setError(e.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [idToken, sessionId]);

  useEffect(() => {
    if (!tabData[cacheKey]) {
      fetchTab(activeTab, selectedCity);
    }
  }, [activeTab, selectedCity]);

  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  const handleCityPress = (city) => {
    setSelectedCity(prev => prev === city ? '' : city);
  };

  // ── Overview tab ───────────────────────────────────────────────────────────
  function renderOverview() {
    if (!data) return null;
    const cats = data.categories || [];
    const cityBreak = data.cityBreakdown || [];
    const maxUnits = Math.max(...cats.map(c => c.unitsSold), 1);

    return (
      <>
        <View style={styles.summaryRow}>
          {[
            { label: 'Total Units', value: fmtNum(cats.reduce((s, c) => s + c.unitsSold, 0)), icon: 'cube-outline' },
            { label: 'Categories',  value: String(cats.length), icon: 'grid-outline' },
            { label: 'Cities',      value: String(cityBreak.length), icon: 'location-outline' },
          ].map((s, i) => (
            <View key={i} style={styles.summaryCard}>
              <Ionicons name={s.icon} size={18} color={colors.primary} />
              <Text style={styles.summaryValue}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {cats.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>SALES BY CATEGORY</Text>
            <View style={[styles.card, { padding: spacing.md, paddingBottom: 8 }]}>
              <BarChart
                data={cats.slice(0, 8).map((c, i) => ({
                  label: c.category.split(' ')[0],
                  value: c.unitsSold,
                  color: BAR_COLORS[i % BAR_COLORS.length],
                }))}
                width={CHART_W}
                height={190}
                gridColor={isDark ? '#2A2A2A' : '#E5E7EB'}
                labelColor={colors.textSecondary}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>TRENDING CATEGORIES</Text>
        <View style={styles.card}>
          {cats.length === 0 ? (
            <Text style={styles.emptyText}>No sales data for this period.</Text>
          ) : cats.map((cat, i) => (
            <View key={cat.category}
              style={[styles.demandRow, i < cats.length - 1 && styles.rowBorder]}>
              <Text style={styles.demandName} numberOfLines={1}>{cat.category}</Text>
              <View style={styles.demandBarWrap}>
                <View style={[styles.demandBar, {
                  width: `${Math.max(4, (cat.unitsSold / maxUnits) * 100)}%`,
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                }]} />
              </View>
              <View style={styles.demandRight}>
                <Text style={[styles.demandPct, { color: BAR_COLORS[i % BAR_COLORS.length] }]}>
                  {fmtNum(cat.unitsSold)}
                </Text>
                {cat.growthPct != null && (
                  <Text style={[styles.growthBadge, {
                    color: cat.growthPct >= 0 ? '#22C55E' : '#EF4444',
                    backgroundColor: cat.growthPct >= 0 ? '#F0FDF4' : '#FEF2F2',
                  }]}>
                    {cat.growthPct >= 0 ? '+' : ''}{cat.growthPct}%
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {cityBreak.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>CITY BREAKDOWN</Text>
            <View style={styles.card}>
              {cityBreak.map((c, i) => (
                <View key={c.city}
                  style={[styles.cityRow, i < cityBreak.length - 1 && styles.rowBorder]}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.cityName}>{c.city}</Text>
                  <Text style={styles.cityUnits}>{fmtNum(c.unitsSold)} units</Text>
                  {c.topCategory ? (
                    <View style={styles.cityTag}>
                      <Text style={[styles.cityTagText, { color: colors.primary }]}>{c.topCategory}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        )}
      </>
    );
  }

  // ── History tab ────────────────────────────────────────────────────────────
  function renderHistory() {
    if (!data) return null;
    const months = data.months || [];
    const maxUnits = Math.max(...months.map(m => m.totalUnits), 1);

    if (months.length === 0) {
      return <Text style={[styles.emptyText, { marginTop: 32 }]}>No historical data available yet.</Text>;
    }

    return (
      <>
        {months.length >= 2 && (
          <>
            <Text style={styles.sectionLabel}>MONTHLY TREND</Text>
            <View style={[styles.card, { padding: spacing.md, paddingBottom: 8 }]}>
              <LineChart
                data={months.map(m => ({
                  label: fmtMonth(m.month).split(' ')[0],
                  value: m.totalUnits,
                }))}
                width={CHART_W}
                height={160}
                color={colors.primary}
                gridColor={isDark ? '#2A2A2A' : '#E5E7EB'}
                labelColor={colors.textSecondary}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>12-MONTH OVERVIEW</Text>
        <View style={styles.card}>
          {[...months].reverse().map((m, i) => (
            <View key={m.month}
              style={[styles.historyRow, i < months.length - 1 && styles.rowBorder]}>
              <Text style={styles.historyMonth}>{fmtMonth(m.month)}</Text>
              <View style={styles.historyBarWrap}>
                <View style={[styles.historyBar, {
                  width: `${Math.max(4, (m.totalUnits / maxUnits) * 100)}%`,
                }]} />
              </View>
              <Text style={styles.historyUnits}>{fmtNum(m.totalUnits)}</Text>
              <View style={styles.categoryPills}>
                {(m.categories || []).slice(0, 2).map((cat, ci) => (
                  <View key={cat.category} style={[styles.pill, { backgroundColor: `${BAR_COLORS[ci % BAR_COLORS.length]}20` }]}>
                    <Text style={[styles.pillText, { color: BAR_COLORS[ci % BAR_COLORS.length] }]} numberOfLines={1}>
                      {cat.category}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </>
    );
  }

  // ── Forecast tab ──────────────────────────────────────────────────────────
  function renderForecast() {
    if (!data) return null;
    const preds = data.predictions || [];
    const maxUnits = Math.max(...preds.map(p => p.predictedUnits), 1);

    return (
      <>
        <View style={styles.forecastHeader}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.forecastTitle}>
            Predicted demand for {fmtMonth(data.forecastMonth)}
          </Text>
        </View>

        {preds.length === 0 ? (
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            Need at least 2 months of sales data to generate forecasts.
          </Text>
        ) : (
          <>
            <Text style={styles.sectionLabel}>DEMAND PREDICTIONS</Text>
            <View style={styles.card}>
              {preds.map((p, i) => (
                <View key={`${p.city}-${p.category}`}
                  style={[styles.forecastRow, i < preds.length - 1 && styles.rowBorder]}>
                  <View style={styles.forecastLeft}>
                    <Text style={styles.forecastCategory} numberOfLines={1}>{p.category}</Text>
                    <Text style={styles.forecastCity}>{p.city}</Text>
                  </View>
                  <View style={styles.forecastBarWrap}>
                    <View style={[styles.forecastBar, {
                      width: `${Math.max(4, (p.predictedUnits / maxUnits) * 100)}%`,
                      backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                    }]} />
                  </View>
                  <Text style={styles.forecastUnits}>{Math.round(p.predictedUnits)}</Text>
                  <View style={[styles.confDot, { backgroundColor: confidenceColor(p.confidence) }]} />
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              {[['High', '#22C55E'], ['Medium', '#F97316'], ['Low', '#EF4444']].map(([label, color]) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.confDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label} confidence</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </>
    );
  }

  // ── Top 10 tab ─────────────────────────────────────────────────────────────
  function renderTop10() {
    if (!data) return null;
    const cityGroups = data.cities || [];
    const rankColors = ['#F59E0B', '#94A3B8', '#C2410C'];

    return (
      <>
        {cityGroups.length === 0 ? (
          <Text style={[styles.emptyText, { marginTop: 32 }]}>No top product data yet for this period.</Text>
        ) : cityGroups.map((group) => (
          <View key={group.city} style={{ marginBottom: spacing.lg }}>
            <View style={styles.cityGroupHeader}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.cityGroupTitle}>{group.city}</Text>
            </View>
            <View style={styles.card}>
              {(group.topProducts || []).map((p, i) => (
                <View key={p.id}
                  style={[styles.topRow, i < group.topProducts.length - 1 && styles.rowBorder]}>
                  <View style={[styles.rankBadge, {
                    backgroundColor: i < 3 ? `${rankColors[i]}20` : `${colors.primary}10`,
                  }]}>
                    <Text style={[styles.rankText, {
                      color: i < 3 ? rankColors[i] : colors.primary,
                    }]}>{p.rank}</Text>
                  </View>
                  <View style={styles.topProduct}>
                    <Text style={styles.topTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.topMeta}>{p.category} · {p.supplier?.name}</Text>
                  </View>
                  <View style={styles.topRight}>
                    <Text style={styles.topUnits}>{fmtNum(p.unitsSold)} sold</Text>
                    <Text style={styles.topPrice}>Rs {parseInt(p.price).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </>
    );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading market data...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchTab(activeTab, selectedCity)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!data) return null;
    if (activeTab === 'overview')  return renderOverview();
    if (activeTab === 'history')   return renderHistory();
    if (activeTab === 'forecast')  return renderForecast();
    if (activeTab === 'top10')     return renderTop10();
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Market Analysis</Text>
          <Text style={styles.headerSub}>NEXUM Market Intelligence</Text>
        </View>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={13} color="#fff" />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      {/* City filter chips */}
      {cities.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedCity && styles.chipActive]}
            onPress={() => handleCityPress('')}
          >
            <Text style={[styles.chipText, !selectedCity && styles.chipTextActive]}>All Cities</Text>
          </TouchableOpacity>
          {cities.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, selectedCity === c && styles.chipActive]}
              onPress={() => handleCityPress(c)}
            >
              <Text style={[styles.chipText, selectedCity === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        key={cacheKey}
      >
        {renderContent()}
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

  chipsRow: { paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 4, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radii.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontFamily: fonts.semiBold },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.md, marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.xl, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radii.lg },
  tabActive: { backgroundColor: colors.primary },
  tabText:       { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary },
  tabTextActive: { color: '#fff', fontFamily: fonts.semiBold },

  scroll: { padding: spacing.md, paddingBottom: 40 },

  // Summary bar
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

  card: {
    backgroundColor: colors.surface, borderRadius: radii.xl, overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },

  // Demand bars (overview)
  demandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md },
  demandName: { width: 100, fontSize: 12, fontFamily: fonts.medium, color: colors.text },
  demandBarWrap: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  demandBar:     { height: '100%', borderRadius: 3 },
  demandRight:   { width: 60, alignItems: 'flex-end', gap: 2 },
  demandPct:     { fontSize: 12, fontFamily: fonts.semiBold },
  growthBadge:   { fontSize: 10, fontFamily: fonts.semiBold, paddingHorizontal: 5, paddingVertical: 1, borderRadius: radii.full },

  // City breakdown
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md },
  cityName:  { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  cityUnits: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  cityTag:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full, backgroundColor: `${colors.primary}15` },
  cityTagText: { fontSize: 10, fontFamily: fonts.medium },

  // History
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md },
  historyMonth:   { width: 60, fontSize: 12, fontFamily: fonts.semiBold, color: colors.text },
  historyBarWrap: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  historyBar:     { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  historyUnits:   { width: 36, fontSize: 11, fontFamily: fonts.semiBold, color: colors.primary, textAlign: 'right' },
  categoryPills:  { flexDirection: 'row', gap: 4, flexWrap: 'wrap', maxWidth: 100 },
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.full },
  pillText: { fontSize: 9, fontFamily: fonts.semiBold },

  // Forecast
  forecastHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: `${colors.primary}10`, borderRadius: radii.xl,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: `${colors.primary}20`,
  },
  forecastTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, flex: 1 },
  forecastRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md },
  forecastLeft: { width: 110 },
  forecastCategory: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.text },
  forecastCity:     { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  forecastBarWrap: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  forecastBar:     { height: '100%', borderRadius: 3 },
  forecastUnits:   { width: 36, fontSize: 11, fontFamily: fonts.semiBold, color: colors.text, textAlign: 'right' },
  confDot: { width: 10, height: 10, borderRadius: 5 },
  legendRow: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: -8, marginBottom: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },

  // Top 10
  cityGroupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8,
  },
  cityGroupTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.primary },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md },
  rankBadge: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: 13, fontFamily: fonts.bold },
  topProduct: { flex: 1 },
  topTitle:   { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  topMeta:    { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  topRight:   { alignItems: 'flex-end' },
  topUnits:   { fontSize: 12, fontFamily: fonts.semiBold, color: colors.primary },
  topPrice:   { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },

  // States
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  errorBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  errorText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  emptyText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
});
