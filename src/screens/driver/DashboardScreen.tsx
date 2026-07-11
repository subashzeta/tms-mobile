import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useApi } from '../../hooks/useApi'
import { dashboard } from '../../api/endpoints'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, gradients, spacing, borderRadius, shadow } from '../../theme'

function formatCurrency(n: number | null | undefined) { if (n == null) return '₹ 0'; return '₹ ' + n.toLocaleString('en-IN') }

export default function DriverDashboardScreen() {
  const navigation = useNavigation<any>()
  const { data: stats, loading, error, refresh } = useApi<any>(() => dashboard.getDriverStats(), [])
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !stats) return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        <GradientHeader title="Driver Dashboard" subtitle="Your payment overview" icon="account" showLogout />

        <View style={styles.statsGrid}>
          <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{formatCurrency(stats?.totalPaid)}</Text>
            <Text style={styles.statLabel}>Total Paid</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.danger} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{formatCurrency(stats?.totalPending)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-check" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{stats?.paidDays ?? 0}</Text>
            <Text style={styles.statLabel}>Paid Days</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.warning} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-remove" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statValue}>{stats?.pendingDays ?? 0}</Text>
            <Text style={styles.statLabel}>Pending Days</Text>
          </LinearGradient>
        </View>

        <GradientCard icon="cash" iconColor={colors.success} title="Today's Collection" value={formatCurrency(stats?.todayCollection)} valueColor={colors.success} compact>
          <Text style={styles.metaText}>Keep up the good work!</Text>
        </GradientCard>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: 14 },
  scroll: { paddingBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  statCard: { width: '47%', borderRadius: borderRadius.lg, padding: spacing.lg, ...shadow.md },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.textInverse, marginTop: spacing.sm },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 2 },
  metaText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
})
