import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { paymentAccounts } from '../../api/endpoints'
import type { PaymentAccount } from '../../types'
import { useToast } from '../../components/Toast'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientButton } from '../../components/GradientButton'
import { GradientFab } from '../../components/GradientFab'
import { colors, spacing, borderRadius, typography } from '../../theme'

const methodLabelMap: Record<string, string> = { cash: 'Cash', esewa: 'eSewa', bank_transfer: 'Bank Transfer' }
const methodIcons: Record<string, string> = { cash: 'cash', esewa: 'bank', bank_transfer: 'bank-transfer' }
function formatMethod(method: string) { return methodLabelMap[method?.toLowerCase()] ?? method ?? 'N/A' }

export default function AccountsScreen() {
  const { data, loading, error, refresh } = useApi<PaymentAccount[]>(() => paymentAccounts.list(), [])
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newMethod, setNewMethod] = useState('cash')
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
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
    finally { setSaving(false) }
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

  if (loading && !data) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  const items = data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Payment Accounts" subtitle="Manage payment methods" icon="bank" />
      <FlatList
        data={items} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No accounts found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <GradientCard icon={(methodIcons[item.method] || 'bank') as any} iconColor={colors.primary}
            title={item.label} value={formatMethod(item.method)}
            stats={[{ label: 'Active', value: item.isActive ? 'Yes' : 'No', color: item.isActive ? colors.success : colors.textTertiary }]}>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ alignSelf: 'flex-end' }}>
              <MaterialCommunityIcons name="delete" size={20} color={colors.danger} />
            </TouchableOpacity>
          </GradientCard>
        )} />
      <GradientFab onPress={() => setModalVisible(true)} />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Add Payment Account</Text>
          <Text style={styles.modalLabel}>Label</Text>
          <TextInput style={styles.modalInput} value={newLabel} onChangeText={setNewLabel} placeholder="e.g., Office Cash" placeholderTextColor={colors.textTertiary} />
          <Text style={styles.modalLabel}>Method</Text>
          <View style={styles.methodRow}>
            {['cash', 'esewa', 'bank_transfer'].map(m => (
              <TouchableOpacity key={m} style={[styles.methodBtn, newMethod === m && styles.methodActive]} onPress={() => setNewMethod(m)}>
                <Text style={[styles.methodText, newMethod === m && styles.methodTextActive]}>{formatMethod(m)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <GradientButton title={saving ? 'Saving...' : 'Save'} loading={saving} onPress={handleCreate} small />
          </View>
        </View></View>
      </Modal>
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: spacing.xxl, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  modalLabel: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.sm },
  modalInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceSecondary },
  methodRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  methodBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  methodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  methodTextActive: { color: colors.textInverse },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
})
