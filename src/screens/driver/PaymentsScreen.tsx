import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { dailyPayments } from '../../api/endpoints'
import type { DailyPayment } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, spacing } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN') }

const statusColors: Record<string, string> = { paid: colors.success, approved: colors.success, pending: colors.warning, rejected: colors.danger }

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<DailyPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    try { setError(null); const res = await dailyPayments.list(); setPayments(res.data) }
    catch (err: any) { setError(err?.message || 'Failed to load payments') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])
  const onRefresh = useCallback(() => { setRefreshing(true); fetchPayments() }, [fetchPayments])

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="My Payments" subtitle="Your payment history" icon="cash-multiple" />
      <FlatList
        data={payments} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No payments found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <GradientCard icon="cash" iconColor={statusColors[item.status?.toLowerCase()] || colors.textTertiary}
            title={item.taxi?.plateNumber ?? 'N/A'} subtitle={formatDate(item.date)}
            value={formatCurrency(item.amountDue)} valueColor={statusColors[item.status?.toLowerCase()] || colors.text}
            stats={[
              { label: 'Paid', value: formatCurrency(item.amountPaid), color: colors.success },
              { label: 'Status', value: item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'N/A', color: statusColors[item.status?.toLowerCase()] || colors.textSecondary },
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
