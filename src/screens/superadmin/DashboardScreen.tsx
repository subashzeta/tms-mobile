import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useApi } from '../../hooks/useApi'
import { dashboard } from '../../api/endpoints'
import type { DashboardStats } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, gradients, spacing, borderRadius, shadow, typography } from '../../theme'

function formatCurrency(n: number | null | undefined) { if (n == null) return '₹ 0'; return '₹ ' + n.toLocaleString('en-IN') }

const quickLinks = [
  { label: 'Drivers', icon: 'account-group' as const, screen: 'SADrivers', gradient: gradients.primary },
  { label: 'Taxis', icon: 'car-multiple' as const, screen: 'SATaxis', gradient: gradients.secondary },
  { label: 'Income', icon: 'trending-up' as const, screen: 'SAIncome', gradient: gradients.success },
  { label: 'Reports', icon: 'file-chart' as const, screen: 'SAReports', gradient: gradients.purple },
  { label: 'Payments', icon: 'cash-multiple' as const, screen: 'SADailyPayments', gradient: gradients.warning },
  { label: 'Leaves', icon: 'calendar-remove' as const, screen: 'SALeaves', gradient: gradients.pink },
]

export default function SuperAdminDashboardScreen() {
  const navigation = useNavigation<any>()
  const { data: stats, loading, error, refresh } = useApi<DashboardStats>(dashboard.stats, [])
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !stats) return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>
  if (!stats) return null

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        <GradientHeader title="Admin Dashboard" subtitle="Full system overview" icon="shield-account" showLogout />

        <View style={styles.statsGrid}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="car" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{stats.taxis.total}</Text>
            <Text style={styles.statLabel}>Total Taxis</Text>
            <Text style={styles.statSub}>{stats.taxis.active} Active</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="account" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{stats.drivers.total}</Text>
            <Text style={styles.statLabel}>Drivers</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{formatCurrency(stats.dailyPayments.grandTotalCollected || stats.dailyPayments.totalCollected)}</Text>
            <Text style={styles.statLabel}>Total Collected</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.warning} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{stats.dailyPayments.pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickLinksGrid}>
          {quickLinks.map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickLinkCard} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
              <LinearGradient colors={item.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickLinkGradient}>
                <MaterialCommunityIcons name={item.icon} size={22} color={colors.textInverse} />
              </LinearGradient>
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
  scroll: { paddingBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  statCard: { width: '47%', borderRadius: borderRadius.lg, padding: spacing.lg, ...shadow.md },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.textInverse, marginTop: spacing.sm },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 2 },
  statSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  sectionLabel: { ...typography.label, paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md, textTransform: 'uppercase' },
  quickLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg },
  quickLinkCard: { width: '29%', alignItems: 'center', marginBottom: spacing.md },
  quickLinkGradient: { width: 48, height: 48, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', ...shadow.md },
  quickLinkLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', marginTop: spacing.xs, textAlign: 'center' },
})
