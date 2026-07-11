import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApi } from '../../hooks/useApi'
import { users } from '../../api/endpoints'
import type { User, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, spacing } from '../../theme'

export default function EmployeesScreen() {
  const { data, loading, error, refresh } = useApi<ApiResponse<User[]>>(() => users.getEmployees({ limit: 100 }), [])
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !data) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Employees" subtitle="Manage employees" icon="account-tie" />
      <FlatList
        data={items} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No employees found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <GradientCard icon="account-tie" iconColor={colors.purple}
            title={item.name} subtitle={item.email || ''}
            stats={[{ label: 'Role', value: item.role || 'employee', color: colors.textSecondary }]} />
        )} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: colors.danger, fontSize: 14 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  emptyText: { color: colors.textTertiary, fontSize: 14 },
  list: { padding: spacing.lg },
})
