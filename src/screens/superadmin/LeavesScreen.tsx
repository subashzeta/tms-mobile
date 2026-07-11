import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, RefreshControl, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApi } from '../../hooks/useApi'
import { leaves } from '../../api/endpoints'
import type { LeaveDay, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, spacing } from '../../theme'

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN') }

export default function SuperAdminLeavesScreen() {
  const { data, loading, error, refresh } = useApi<ApiResponse<LeaveDay[]>>(() => leaves.list(), [])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !data) return (
    <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>
  )
  if (error) return (
    <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>
  )

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Leaves" icon="calendar-clock" />
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <GradientCard
            title={formatDate(item.date)}
            subtitle={item.reason}
            stats={[{ label: 'Taxi', value: item.taxi?.plateNumber ?? 'N/A' }]}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No leaves found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: colors.danger, fontSize: 14 },
  loadingText: { color: colors.textTertiary, fontSize: 14 },
  emptyText: { color: colors.textTertiary, fontSize: 14 },
  list: { padding: spacing.lg },
})
