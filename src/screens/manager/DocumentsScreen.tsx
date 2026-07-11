import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { documents } from '../../api/endpoints'
import type { Document, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, spacing } from '../../theme'

function formatDate(d: string | null | undefined) { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('en-IN') }

const docIcons: Record<string, string> = { license: 'card-account-details', citizenship: 'passport', insurance: 'shield-car', bluebook: 'book', other: 'file-document' }

export default function DocumentsScreen() {
  const { data, loading, error, refresh } = useApi<ApiResponse<Document[]>>(() => documents.list(), [])
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await documents.delete(id); refresh() }
        catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
      }},
    ])
  }, [refresh])

  if (loading && !data) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Documents" subtitle="Manage driver & taxi documents" icon="file-document" />
      <FlatList
        data={items} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No documents found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <GradientCard icon={(docIcons[item.type] || 'file-document') as any}
            iconColor={item.isExpired ? colors.danger : colors.primary}
            title={item.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            subtitle={item.owner?.plateNumber || item.owner?.name || ''}
            stats={[
              { label: 'Expiry', value: formatDate(item.expiryDate), color: item.isExpired ? colors.danger : colors.textSecondary },
              { label: 'Status', value: item.isExpired ? 'Expired' : 'Active', color: item.isExpired ? colors.danger : colors.success },
            ]}>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ alignSelf: 'flex-end' }}>
              <MaterialCommunityIcons name="delete" size={20} color={colors.danger} />
            </TouchableOpacity>
          </GradientCard>
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
