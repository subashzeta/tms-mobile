import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useApi } from '../../hooks/useApi'
import { taxis } from '../../api/endpoints'
import type { Taxi, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientFab } from '../../components/GradientFab'
import { colors, spacing } from '../../theme'

function formatCurrency(n: number | undefined) { return n ? '₹ ' + n.toLocaleString('en-IN') : '' }

export default function TaxisScreen() {
  const navigation = useNavigation<any>()
  const { data, loading, error, refresh } = useApi<ApiResponse<Taxi[]>>(() => taxis.list({ limit: 200 }), [])
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !data) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Taxis" subtitle="Manage fleet" icon="car-multiple" />
      <FlatList
        data={items} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No taxis found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <GradientCard icon="car" iconColor={colors.secondary}
            title={item.plateNumber} subtitle={`${item.model} (${item.year})`}
            value={formatCurrency(item.dailyRate)} valueColor={colors.success}
            stats={[
              { label: 'Driver', value: item.assignedDriver?.name || 'Unassigned', color: item.assignedDriver ? colors.text : colors.textTertiary },
              { label: 'Status', value: item.isActive ? 'Active' : 'Inactive', color: item.isActive ? colors.success : colors.textTertiary },
            ]}
            onPress={() => navigation.navigate('TaxiDetail', { taxiId: item._id })} />
        )} />
      <GradientFab onPress={() => navigation.navigate('TaxiForm')} />
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
