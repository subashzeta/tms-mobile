import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, RefreshControl, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApi } from '../../hooks/useApi'
import { organizations } from '../../api/endpoints'
import type { Organization, ApiResponse } from '../../types'
import { MobileCard } from '../../components/MobileCard'

export default function PlatformOrganizationsScreen() {
  const { data, loading, error, refresh } = useApi<ApiResponse<Organization[]>>(() => organizations.list(), [])
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
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <MobileCard
            primary={{ label: item.name, value: item.code }}
            subtitle={item.address}
            stats={[
              { label: 'Email', value: item.contactEmail ?? 'N/A' },
              { label: 'Phone', value: item.contactPhone ?? 'N/A' },
              { label: 'Status', value: item.isActive ? 'Active' : 'Inactive', textStyle: item.isActive ? 'secondary' as const : 'default' as const },
            ]}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No organizations found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: '#DC2626', fontSize: 14 },
  loadingText: { color: '#6B7280', fontSize: 14 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  list: { padding: 16 },
})
