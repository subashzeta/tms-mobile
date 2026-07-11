import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { dashboard } from '../../api/endpoints'
import type { DashboardStats } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, spacing, borderRadius } from '../../theme'

function formatCurrency(n: number | null | undefined) {
  if (n == null) return '₹ 0'
  return '₹ ' + n.toLocaleString('en-IN')
}

const quickLinks = [
  { label: 'Payments', icon: 'cash-multiple', screen: 'Payments', color: colors.success },
  { label: 'Reports', icon: 'file-chart', screen: 'Reports', color: colors.accent },
  { label: 'Docs', icon: 'file-document', screen: 'Documents', color: colors.primaryLight },
]

export default function EmployeeDashboardScreen() {
  const navigation = useNavigation<any>()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      const result = await dashboard.stats()
      setStats(result)
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  const onRefresh = useCallback(() => { setRefreshing(true); fetchStats() }, [fetchStats])

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
    </SafeAreaView>
  )

  if (error) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
    </SafeAreaView>
  )

  if (!stats) return null

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Employee Dashboard" icon="view-dashboard" showLogout />
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        <View style={styles.statsGrid}>
          <GradientCard
            icon="car"
            iconColor={colors.primary}
            title="Total Taxis"
            value={String(stats.taxis.total)}
            compact
            style={styles.statCard}
          />
          <GradientCard
            icon="cash"
            iconColor={colors.success}
            title="Today's Income"
            value={formatCurrency(stats.income.today)}
            compact
            style={styles.statCard}
          />
          <GradientCard
            icon="cash-multiple"
            iconColor={colors.accent}
            title="Total Collected"
            value={formatCurrency(stats.dailyPayments.totalCollected)}
            compact
            style={styles.statCard}
          />
          <GradientCard
            icon="account"
            iconColor={colors.purple}
            title="Drivers"
            value={String(stats.drivers.total)}
            compact
            style={styles.statCard}
          />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickLinksGrid}>
          {quickLinks.map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickLinkCard} onPress={() => navigation.navigate(item.screen)}>
              <View style={[styles.quickLinkIcon, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.quickLinkLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: 14 },
  scroll: { padding: spacing.lg, paddingBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { width: '47%' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickLinkCard: { width: '30%', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  quickLinkIcon: { width: 40, height: 40, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickLinkLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },
})
