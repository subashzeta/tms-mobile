import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, RefreshControl, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useApi } from '../../hooks/useApi'
import { taxis } from '../../api/endpoints'
import type { Taxi, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientFab } from '../../components/GradientFab'
import { colors, spacing } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }

export default function SuperAdminTaxisScreen() {
  const navigation = useNavigation<any>()
  const { data, loading, error, refresh } = useApi<ApiResponse<Taxi[]>>(() => taxis.list(), [])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !data) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View>
    </SafeAreaView>
  )
  if (error) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
    </SafeAreaView>
  )

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Taxis" icon="car" />
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <GradientCard
            title={item.plateNumber}
            value={item.model ?? 'N/A'}
            subtitle={item.assignedDriver?.name}
            stats={[
              ...(item.dailyRate ? [{ label: 'Daily Rate', value: formatCurrency(item.dailyRate) }] : []),
              { label: 'Status', value: item.isActive ? 'Active' : 'Inactive', color: item.isActive ? colors.success : colors.textTertiary },
            ]}
            onPress={() => navigation.navigate('SATaxiDetail', { taxiId: item._id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No taxis found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      />
      <GradientFab onPress={() => navigation.navigate('SATaxiForm')} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: colors.danger, fontSize: 14 },
  loadingText: { color: colors.textTertiary, fontSize: 14 },
  emptyText: { color: colors.textTertiary, fontSize: 14 },
  list: { padding: spacing.lg, paddingBottom: 80 },
})
