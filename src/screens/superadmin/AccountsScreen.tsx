import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, RefreshControl, TouchableOpacity, TextInput, Modal, StyleSheet, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { paymentAccounts } from '../../api/endpoints'
import type { PaymentAccount } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientFab } from '../../components/GradientFab'
import { GradientButton } from '../../components/GradientButton'
import { colors, spacing, borderRadius, typography } from '../../theme'

const methodMap: Record<string, string> = { cash: 'Cash', esewa: 'eSewa', bank_transfer: 'Bank Transfer' }
function fmtMethod(m: string) { return methodMap[m?.toLowerCase()] ?? m ?? 'N/A' }

export default function SuperAdminAccountsScreen() {
  const { data, loading, error, refresh } = useApi<PaymentAccount[]>(() => paymentAccounts.list(), [])
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newMethod, setNewMethod] = useState('esewa')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  const handleCreate = async () => {
    if (!newLabel.trim()) { Alert.alert('Error', 'Label is required'); return }
    setSaving(true)
    try {
      await paymentAccounts.create(newLabel.trim(), newMethod)
      Alert.alert('Success', 'Account created')
      setModalVisible(false); setNewLabel(''); refresh()
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err.message)
    } finally { setSaving(false) }
  }

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await paymentAccounts.delete(id); refresh() }
        catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
      }},
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

  const items = data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Payment Accounts" icon="bank" />
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <GradientCard
            title={item.label}
            value={fmtMethod(item.method)}
            stats={[
              { label: 'Method', value: fmtMethod(item.method) },
              { label: 'Active', value: item.isActive ? 'Yes' : 'No', color: item.isActive ? colors.success : colors.textTertiary },
            ]}
          >
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
              <MaterialCommunityIcons name="delete" size={20} color={colors.danger} />
            </TouchableOpacity>
          </GradientCard>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No accounts found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      />
      <GradientFab onPress={() => setModalVisible(true)} />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Payment Account</Text>
            <Text style={styles.label}>Label</Text>
            <TextInput style={styles.input} value={newLabel} onChangeText={setNewLabel} placeholder="e.g., Office Cash" />
            <Text style={styles.label}>Method</Text>
            <View style={styles.methodRow}>
              {['cash', 'esewa', 'bank_transfer'].map(m => (
                <TouchableOpacity key={m} style={[styles.methodBtn, newMethod === m && styles.methodActive]} onPress={() => setNewMethod(m)}>
                  <Text style={[styles.methodText, newMethod === m && styles.methodTextActive]}>{fmtMethod(m)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <GradientButton title="Cancel" onPress={() => setModalVisible(false)} outline />
              <GradientButton title={saving ? 'Saving...' : 'Save'} onPress={handleCreate} loading={saving} />
            </View>
          </View>
        </View>
      </Modal>
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
  deleteBtn: { alignSelf: 'flex-end', marginTop: spacing.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceSecondary },
  methodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  methodBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  methodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  methodTextActive: { color: colors.textInverse },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
})
