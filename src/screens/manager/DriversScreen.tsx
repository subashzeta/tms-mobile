import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useApi } from '../../hooks/useApi'
import { users } from '../../api/endpoints'
import type { Driver, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientFab } from '../../components/GradientFab'
import { colors, spacing } from '../../theme'

export default function DriversScreen() {
  const navigation = useNavigation<any>()
  const { data, loading, error, refresh } = useApi<ApiResponse<Driver[]>>(() => users.getDrivers({ limit: 100 }), [])
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  if (loading && !data) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Drivers" subtitle="Manage drivers" icon="account-group" />
      <FlatList
        data={items} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No drivers found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <GradientCard icon="account" iconColor={colors.primary}
            title={item.name} subtitle={item.phone || item.email || ''}
            stats={[
              { label: 'License', value: item.licenseNumber || 'N/A', color: colors.textSecondary },
              { label: 'Status', value: item.isActive ? 'Active' : 'Inactive', color: item.isActive ? colors.success : colors.textTertiary },
            ]}
            onPress={() => navigation.navigate('DriverDetail', { driverId: item._id })} />
        )} />
      <GradientFab onPress={() => navigation.navigate('DriverForm')} />
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
