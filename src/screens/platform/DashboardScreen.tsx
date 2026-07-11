import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { dashboard } from '../../api/endpoints'
import type { DashboardStats } from '../../types'

function formatCurrency(n: number | null | undefined) { if (n == null) return '₹ 0'; return '₹ ' + n.toLocaleString('en-IN') }

export default function PlatformDashboardScreen() {
  const navigation = useNavigation<any>()
  const { data: stats, loading, error, refresh } = useApi<DashboardStats>(dashboard.stats, [])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !stats) return (
    <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View></SafeAreaView>
  )
  if (error) return (
    <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>
  )
  if (!stats) return null

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}>
        <View style={styles.headerRow}><Text style={styles.heading}>Platform Dashboard</Text><TouchableOpacity onPress={onRefresh}><MaterialCommunityIcons name="refresh" size={20} color="#3B82F6" /></TouchableOpacity></View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statIcon}>🚕</Text><Text style={styles.statValue}>{stats.taxis.total}</Text><Text style={styles.statLabel}>Total Taxis</Text></View>
          <View style={styles.statCard}><Text style={styles.statIcon}>👤</Text><Text style={styles.statValue}>{stats.drivers.total}</Text><Text style={styles.statLabel}>Drivers</Text></View>
          <View style={styles.statCard}><Text style={styles.statIcon}>💰</Text><Text style={styles.statValue}>{formatCurrency(stats.income.today)}</Text><Text style={styles.statLabel}>Today's Income</Text></View>
          <View style={styles.statCard}><Text style={styles.statIcon}>📊</Text><Text style={styles.statValue}>{formatCurrency(stats.dailyPayments.totalCollected)}</Text><Text style={styles.statLabel}>Total Collected</Text></View>
        </View>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickLinksGrid}>
          {[
            { label: 'Organizations', icon: 'domain', screen: 'PlatformOrganizations', color: '#EC4899' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickLinkCard} onPress={() => navigation.navigate(item.screen)}>
              <View style={[styles.quickLinkIcon, { backgroundColor: item.color + '15' }]}><MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} /></View>
              <Text style={styles.quickLinkLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#DC2626', fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, width: '48%', borderWidth: 1, borderColor: '#f0f0f0' },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickLinkCard: { width: '30%', backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
  quickLinkIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickLinkLabel: { fontSize: 10, color: '#374151', fontWeight: '500', textAlign: 'center' },
})
