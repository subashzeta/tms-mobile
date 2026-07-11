import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { documents } from '../../api/endpoints'
import type { Document, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientFab } from '../../components/GradientFab'
import { colors, spacing, borderRadius } from '../../theme'
import * as ImagePicker from 'expo-image-picker'

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN') }
function getOwner(item: Document) { return item.owner?.plateNumber || item.owner?.name || 'N/A' }

type TabType = 'all' | 'expiring'

export default function SuperAdminDocumentsScreen() {
  const [tab, setTab] = useState<TabType>('all')
  const { data, loading, error, refresh } = useApi<any>(() => tab === 'expiring' ? documents.getExpiring(30) : documents.list(), [tab])
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  const handleUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow access to photos'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (!result.canceled && result.assets[0]) {
      setUploading(true)
      try {
        const form = new FormData()
        form.append('file', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'document.jpg' } as any)
        form.append('type', 'other')
        await documents.upload(form)
        Alert.alert('Success', 'Document uploaded'); refresh()
      } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
      finally { setUploading(false) }
    }
  }

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await documents.delete(id); refresh() } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) } }},
    ])
  }, [refresh])

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

  const items = Array.isArray(data) ? data : (data?.data ?? [])

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Documents" icon="file-document" />
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}><Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>All</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'expiring' && styles.tabActive]} onPress={() => setTab('expiring')}><Text style={[styles.tabText, tab === 'expiring' && styles.tabTextActive]}>Expiring</Text></TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator size="small" color={colors.textInverse} /> : <MaterialCommunityIcons name="upload" size={20} color={colors.textInverse} />}
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <GradientCard
            title={item.type ?? 'N/A'}
            value={item.isExpired ? 'Expired' : 'Valid'}
            valueColor={item.isExpired ? colors.danger : colors.success}
            subtitle={getOwner(item)}
            stats={[
              { label: 'Owner', value: getOwner(item) },
              ...(item.expiryDate ? [{ label: 'Expires', value: formatDate(item.expiryDate), color: item.isExpired ? colors.danger : colors.text }] : []),
            ]}
          >
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
              <MaterialCommunityIcons name="delete" size={18} color={colors.danger} />
            </TouchableOpacity>
          </GradientCard>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>{tab === 'expiring' ? 'No expiring documents' : 'No documents found'}</Text></View>}
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
  tabRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: borderRadius.sm, marginRight: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.textTertiary },
  tabTextActive: { color: colors.textInverse },
  uploadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { alignSelf: 'flex-end', marginTop: spacing.sm },
})
