import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApi } from '../../hooks/useApi'
import { income } from '../../api/endpoints'
import type { IncomeStatsData } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, spacing } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }

export default function SuperAdminIncomeStatsScreen() {
  const { data: stats, loading, error, refresh } = useApi<IncomeStatsData>(() => income.getStats(), [])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !stats) return (
    <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>
  )
  if (error) return (
    <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>
  )
  if (!stats) return null

  const cards = [
    { label: 'Total Income', value: formatCurrency(stats.totalIncome), color: colors.success },
    { label: 'Total Expenses', value: formatCurrency(stats.totalExpenditure), color: colors.danger },
    { label: 'Net', value: formatCurrency(stats.net), color: stats.net >= 0 ? colors.success : colors.danger },
    { label: 'Today', value: formatCurrency(stats.todayIncome), color: colors.primary },
    { label: 'This Week', value: formatCurrency(stats.weeklyIncome), color: colors.primary },
    { label: 'This Month', value: formatCurrency(stats.monthlyIncome), color: colors.primary },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Income Stats" icon="chart-bar" />
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        <View style={styles.grid}>
          {cards.map((card, i) => (
            <GradientCard
              key={i}
              title={card.label}
              value={card.value}
              valueColor={card.color}
              compact
              style={styles.gridCard}
            />
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
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCard: { width: '47%' },
})
