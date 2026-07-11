import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { extraPayments } from '../../api/endpoints'
import type { ExtraPayment, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientButton } from '../../components/GradientButton'
import { GradientFab } from '../../components/GradientFab'
import { colors, spacing, borderRadius, typography } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN') }

const statusColors: Record<string, string> = { pending: colors.warning, paid: colors.success }

const methods = ['cash', 'esewa', 'bank_transfer']

export default function ExtraPaymentsScreen() {
  const navigation = useNavigation<any>()
  const { data, loading, error, refresh } = useApi<ApiResponse<ExtraPayment[]>>(() => extraPayments.list(), [])
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [payId, setPayId] = useState<string | null>(null)
  const [showMethodModal, setShowMethodModal] = useState(false)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  const openMethodModal = useCallback((id: string) => { setPayId(id); setShowMethodModal(true) }, [])
  const handleMarkPaid = useCallback(async (method: string) => {
    if (!payId) return
    setActionLoading(payId); setShowMethodModal(false)
    try {
      await extraPayments.markAsPaid(payId, { paymentMethod: method })
      Alert.alert('Success', 'Extra payment marked as paid'); refresh()
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
    finally { setActionLoading(null); setPayId(null) }
  }, [payId, refresh])

  if (loading && !data) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Extra Payments" subtitle="Overtime & additional payments" icon="cash-plus" />
      <FlatList
        data={items} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No extra payments found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <GradientCard icon="cash-plus" iconColor={statusColors[item.status] || colors.textTertiary}
            title={item.reason ?? 'Extra Payment'} subtitle={item.taxi?.plateNumber}
            value={formatCurrency(item.amount)} valueColor={statusColors[item.status] || colors.text}
            stats={[
              { label: 'Status', value: item.status.charAt(0).toUpperCase() + item.status.slice(1), color: statusColors[item.status] || colors.textTertiary },
              { label: 'Date', value: formatDate(item.date), color: colors.textTertiary },
            ]}>
            {item.status === 'pending' && (
              actionLoading === item._id ? <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.sm }} /> :
              <GradientButton title="Mark Paid" small icon="cash-check" onPress={() => openMethodModal(item._id)} />
            )}
          </GradientCard>
        )} />
      <GradientFab onPress={() => navigation.navigate('ExtraPaymentForm')} />

      <Modal visible={showMethodModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Select Payment Method</Text>
          {methods.map((m) => (
            <TouchableOpacity key={m} style={styles.methodBtn} onPress={() => handleMarkPaid(m)}>
              <Text style={styles.methodBtnText}>{m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowMethodModal(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
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
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.overlay, padding: 32 },
  modal: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxl, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  methodBtn: { paddingVertical: 14, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md, backgroundColor: colors.surfaceSecondary, marginBottom: spacing.sm },
  methodBtnText: { fontSize: 15, fontWeight: '500', color: colors.text, textAlign: 'center' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: spacing.xs },
  cancelBtnText: { fontSize: 14, fontWeight: '500', color: colors.textTertiary },
})
