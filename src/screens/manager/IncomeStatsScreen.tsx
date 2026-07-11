import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { income } from '../../api/endpoints'
import type { IncomeStatsData } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { colors, gradients, spacing, borderRadius, shadow, typography } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }

export default function IncomeStatsScreen() {
  const { data: stats, loading, error, refresh } = useApi<IncomeStatsData>(() => income.getStats(), [])
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !stats) return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>
  if (!stats) return null

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Income Stats" subtitle="Financial overview" icon="chart-bar" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        <View style={styles.grid}>
          <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <MaterialCommunityIcons name="trending-up" size={24} color="rgba(255,255,255,0.8)" />
            <Text style={styles.cardValue}>{formatCurrency(stats.totalIncome)}</Text>
            <Text style={styles.cardLabel}>Total Income</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.danger} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <MaterialCommunityIcons name="cash-remove" size={24} color="rgba(255,255,255,0.8)" />
            <Text style={styles.cardValue}>{formatCurrency(stats.totalExpenditure)}</Text>
            <Text style={styles.cardLabel}>Total Expenses</Text>
          </LinearGradient>
          <LinearGradient colors={(stats.net || 0) >= 0 ? gradients.primary : gradients.danger} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <MaterialCommunityIcons name="scale-balance" size={24} color="rgba(255,255,255,0.8)" />
            <Text style={styles.cardValue}>{formatCurrency(stats.net)}</Text>
            <Text style={styles.cardLabel}>Net</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.secondary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <MaterialCommunityIcons name="calendar-today" size={24} color="rgba(255,255,255,0.8)" />
            <Text style={styles.cardValue}>{formatCurrency(stats.todayIncome)}</Text>
            <Text style={styles.cardLabel}>Today</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <MaterialCommunityIcons name="calendar-week" size={24} color="rgba(255,255,255,0.8)" />
            <Text style={styles.cardValue}>{formatCurrency(stats.weeklyIncome)}</Text>
            <Text style={styles.cardLabel}>This Week</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.pink} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <MaterialCommunityIcons name="calendar-month" size={24} color="rgba(255,255,255,0.8)" />
            <Text style={styles.cardValue}>{formatCurrency(stats.monthlyIncome)}</Text>
            <Text style={styles.cardLabel}>This Month</Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: 14 },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { borderRadius: borderRadius.lg, padding: spacing.xl, width: '47%', ...shadow.md },
  cardValue: { fontSize: 20, fontWeight: '800', color: colors.textInverse, marginTop: spacing.sm, marginBottom: 4 },
  cardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
})
