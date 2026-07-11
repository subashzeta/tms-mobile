import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { expenditure } from '../../api/endpoints'
import type { Expenditure as ExpenditureType, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientFab } from '../../components/GradientFab'
import { colors, spacing, typography } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN') }

const catIcons: Record<string, string> = { fuel: 'fuel', repair: 'wrench', maintenance: 'tools', other: 'dots-horizontal' }

export default function ExpenditureScreen() {
  const navigation = useNavigation<any>()
  const { data, loading, error, refresh } = useApi<ApiResponse<ExpenditureType[]>>(() => expenditure.list(), [])
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !data) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Expenses" subtitle="Track all expenditure" icon="cash-remove" />
      <FlatList
        data={items} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No expenditure records found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <GradientCard icon={catIcons[item.category] as any || 'cash-remove'} iconColor={colors.danger}
            title={item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            subtitle={item.description || item.vendor || ''}
            value={formatCurrency(item.amount)} valueColor={colors.danger}
            stats={[
              { label: 'Date', value: formatDate(item.date), color: colors.textTertiary },
              ...(item.vendor ? [{ label: 'Vendor', value: item.vendor, color: colors.textSecondary }] : []),
              ...(item.taxi?.plateNumber ? [{ label: 'Taxi', value: item.taxi.plateNumber, color: colors.textSecondary }] : []),
            ]} />
        )} />
      <GradientFab onPress={() => navigation.navigate('ExpenditureForm')} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: colors.danger, fontSize: 14 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  emptyText: { color: colors.textTertiary, fontSize: 14 },
  list: { padding: spacing.lg, paddingBottom: 100 },
})
