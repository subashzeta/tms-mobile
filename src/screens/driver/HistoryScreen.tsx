import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApi } from '../../hooks/useApi'
import { dailyPayments } from '../../api/endpoints'
import type { DailyPayment, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, spacing } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN') }

export default function HistoryScreen() {
  const { data, loading, error, refresh } = useApi<ApiResponse<DailyPayment[]>>(() => dailyPayments.list({ limit: 100, sort: 'date', order: 'desc' }), [])
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !data) return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Payment History" subtitle="All your past payments" icon="history" />
      <FlatList
        data={items} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No history found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <GradientCard icon="history" iconColor={colors.secondary}
            title={item.taxi?.plateNumber ?? 'N/A'} subtitle={formatDate(item.date)}
            value={formatCurrency(item.amountPaid)} valueColor={colors.success}
            stats={[
              { label: 'Due', value: formatCurrency(item.amountDue), color: colors.textSecondary },
              { label: 'Status', value: item.status?.replace('_', ' ') || 'N/A', color: item.status === 'paid' ? colors.success : colors.warning },
            ]} />
        )} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.textTertiary, fontSize: 14 },
  list: { padding: spacing.lg },
})
