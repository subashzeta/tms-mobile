import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { dailyPayments, taxis, income } from '../../api/endpoints'
import type { Taxi } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientButton } from '../../components/GradientButton'
import { colors, spacing, borderRadius } from '../../theme'

function formatCurrency(n: number | null | undefined) { if (n == null) return '₹ 0'; return '₹ ' + n.toLocaleString('en-IN') }
function formatDate(d: string | null | undefined) { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('en-IN') }

type SubTab = 'calendar' | 'payments' | 'approvals'

export default function SuperAdminDailyPaymentsScreen() {
  const navigation = useNavigation<any>()
  const [tab, setTab] = useState<SubTab>('calendar')
  const [refreshing, setRefreshing] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedTaxi, setSelectedTaxi] = useState<Taxi | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data: taxisData, loading: tLoading, refresh: refreshTaxis } = useApi<any>(() => taxis.list({ isActive: true, limit: 200 }), [])
  const [searchText, setSearchText] = useState('')
  const { data: payData, loading: pLoading, refresh: refreshPay } = useApi<any>(() => dailyPayments.list({ limit: 50, sort: 'date', order: 'desc', search: searchText || undefined }), [searchText])
  const { data: apprData, loading: aLoading, refresh: refreshAppr } = useApi<any>(() => dailyPayments.getPendingApprovals(), [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    Promise.all([refreshTaxis(), refreshPay(), refreshAppr()]).finally(() => setRefreshing(false))
  }, [])

  useEffect(() => { if (!tLoading && !pLoading && !aLoading) setRefreshing(false) }, [tLoading, pLoading, aLoading])

  const handleApprove = useCallback(async (id: string) => {
    setActionLoading(id)
    try { await dailyPayments.approve(id); refreshAppr(); refreshPay() }
    catch (err: any) { alert(err?.response?.data?.message || err?.message || 'Failed') }
    finally { setActionLoading(null) }
  }, [])

  const handleReject = useCallback(async () => {
    if (!rejectId || !rejectReason.trim()) return
    setActionLoading(rejectId); setShowReject(false)
    try { await dailyPayments.reject(rejectId, rejectReason.trim()); refreshAppr(); refreshPay() }
    catch (err: any) { alert(err?.response?.data?.message || err?.message || 'Failed') }
    finally { setActionLoading(null); setRejectId(null); setRejectReason('') }
  }, [rejectId, rejectReason])

  const handleRecord = useCallback(async () => {
    if (!selectedTaxi || !payAmount) return
    setActionLoading(selectedTaxi._id)
    try {
      await dailyPayments.record({ taxiId: selectedTaxi._id, amountDue: parseFloat(payAmount), amountPaid: parseFloat(payAmount), paymentMethod: payMethod, date: new Date().toISOString().split('T')[0] })
      setShowPayModal(false); setSelectedTaxi(null); refreshPay()
    } catch (err: any) { alert(err?.response?.data?.message || err?.message || 'Failed') }
    finally { setActionLoading(null) }
  }, [selectedTaxi, payAmount, payMethod])

  const taxisList: Taxi[] = Array.isArray(taxisData?.data) ? taxisData.data : Array.isArray(taxisData) ? taxisData : []
  const payList: any[] = Array.isArray(payData?.data) ? payData.data : Array.isArray(payData) ? payData : []
  const apprList: any[] = Array.isArray(apprData?.data) ? apprData.data : Array.isArray(apprData) ? apprData : []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Daily Payments" icon="calendar-check" />
      <View style={styles.tabRow}>
        {(['calendar', 'payments', 'approvals'] as SubTab[]).map((st) => (
          <TouchableOpacity testID={`sa-tab-${st}`} key={st} style={[styles.tab, tab === st && styles.tabActive]} onPress={() => setTab(st)}>
            <MaterialCommunityIcons name={st === 'calendar' ? 'car' : st === 'payments' ? 'cash' : 'check-circle'} size={14} color={tab === st ? colors.textInverse : colors.textTertiary} />
            <Text style={[styles.tabText, tab === st && styles.tabTextActive]}>{st.charAt(0).toUpperCase() + st.slice(1)}{st === 'approvals' && apprList.length > 0 ? ` (${apprList.length})` : ''}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        {tab === 'calendar' ? (
          tLoading && taxisList.length === 0 ? (
            <View style={styles.loadingCentered}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Active Taxis</Text>
              {taxisList.length === 0 ? <Text style={styles.emptyText}>No active taxis</Text> : taxisList.map((t) => (
                <GradientCard
                  key={t._id}
                  icon="car"
                  iconColor={colors.primary}
                  title={t.plateNumber}
                  subtitle={t.assignedDriver?.name || 'Unassigned'}
                  value={t.dailyRate ? formatCurrency(t.dailyRate) : undefined}
                  onPress={() => { setSelectedTaxi(t); setPayAmount(String(t.dailyRate || '')); setPayMethod('cash'); setShowPayModal(true) }}
                >
                  <View style={styles.recordBtnWrap}>
                    <GradientButton title="Record" onPress={() => { setSelectedTaxi(t); setPayAmount(String(t.dailyRate || '')); setPayMethod('cash'); setShowPayModal(true) }} small />
                  </View>
                </GradientCard>
              ))}
            </View>
          )
        ) : tab === 'payments' ? (
          <>
            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textTertiary} />
              <TextInput testID="sa-payments-search" style={styles.searchInput} value={searchText} onChangeText={setSearchText} placeholder="Search by taxi or driver..." placeholderTextColor={colors.textTertiary} />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}
            </View>
            {pLoading && payList.length === 0 ? <View style={styles.loadingCentered}><ActivityIndicator size="large" color={colors.primary} /></View> : payList.length === 0 ? <Text style={styles.emptyText}>No payments found</Text> : payList.map((item, i) => (
            <GradientCard key={item._id ?? i} title={item.taxi?.plateNumber || 'N/A'} subtitle={item.driver?.name || ''} value={formatCurrency(item.amountPaid)} valueColor={colors.success}>
              <View style={styles.cardRow}><Text style={styles.cardStat}>Due: {formatCurrency(item.amountDue)}</Text><Text style={styles.cardStat}>Status: {item.status?.replace('_', ' ') || 'N/A'}</Text><Text style={styles.cardStat}>{formatDate(item.date)}</Text></View>
            </GradientCard>
          ))}</>
        ) : (
          aLoading && apprList.length === 0 ? <View style={styles.loadingCentered}><ActivityIndicator size="large" color={colors.primary} /></View> : apprList.length === 0 ? <Text style={styles.emptyText}>No pending approvals</Text> : apprList.map((item, i) => (
            <GradientCard key={item._id ?? i} title={item.taxi?.plateNumber || 'N/A'} subtitle={item.driver?.name || ''} value={formatCurrency(item.amountDue)} valueColor={colors.purple}>
              <View style={styles.cardRow}><Text style={styles.cardStat}>Paid: {formatCurrency(item.amountPaid)}</Text><Text style={styles.cardStat}>{item.paymentMethod?.replace('_', ' ') || ''}</Text><Text style={styles.cardStat}>{formatDate(item.paidAt || item.date)}</Text></View>
              <View style={styles.cardActions}>
                {actionLoading === item._id ? <ActivityIndicator size="small" color={colors.primary} /> : (
                  <><GradientButton title="Approve" onPress={() => handleApprove(item._id)} small gradient={[colors.success, colors.success]} /><GradientButton title="Reject" onPress={() => { setRejectId(item._id); setRejectReason(''); setShowReject(true) }} small gradient={[colors.danger, colors.danger]} /></>
                )}
              </View>
            </GradientCard>
          ))
        )}
      </ScrollView>

      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Record Payment</Text>
          {selectedTaxi && <View style={styles.modalInfo}><MaterialCommunityIcons name="car" size={18} color={colors.primary} /><Text style={styles.modalPlate}>{selectedTaxi.plateNumber}</Text><Text style={{ fontSize: 13, color: colors.textTertiary }}>{selectedTaxi.assignedDriver?.name}</Text></View>}
          <Text style={styles.label}>Amount (₹)</Text><TextInput style={styles.input} value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad" />
          <Text style={styles.label}>Method</Text>
          <View style={styles.methodRow}>{['cash', 'esewa', 'bank_transfer'].map(m => (<TouchableOpacity key={m} style={[styles.metBtn, payMethod === m && styles.metActive]} onPress={() => setPayMethod(m)}><Text style={[styles.metText, payMethod === m && styles.metTextActive]}>{m.replace('_', ' ')}</Text></TouchableOpacity>))}</View>
          <View style={styles.modalActions}><GradientButton title="Cancel" onPress={() => setShowPayModal(false)} outline /><GradientButton title={actionLoading === selectedTaxi?._id ? 'Saving...' : 'Save'} onPress={handleRecord} loading={actionLoading === selectedTaxi?._id} /></View>
        </View></View>
      </Modal>

      <Modal visible={showReject} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Reject Payment</Text>
          <Text style={styles.label}>Reason</Text>
          <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} value={rejectReason} onChangeText={setRejectReason} placeholder="Enter reason..." multiline />
          <View style={styles.modalActions}><GradientButton title="Cancel" onPress={() => setShowReject(false)} outline /><GradientButton title="Reject" onPress={handleReject} gradient={[colors.danger, colors.danger]} /></View>
        </View></View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingCentered: { padding: 60, alignItems: 'center' },
  emptyText: { color: colors.textTertiary, fontSize: 14, textAlign: 'center', padding: 40 },
  tabRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 7, paddingHorizontal: 10, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceSecondary },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '500', color: colors.textTertiary },
  tabTextActive: { color: colors.textInverse },
  scrollArea: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 100 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  recordBtnWrap: { marginTop: spacing.sm, alignSelf: 'flex-end' },
  cardRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: spacing.sm },
  cardStat: { fontSize: 12, color: colors.textTertiary },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.sm },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: colors.overlay, padding: 20 },
  modal: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  modalInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, padding: 12, backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.md },
  modalPlate: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  label: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceSecondary },
  methodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  metBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  metActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  metText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  metTextActive: { color: colors.textInverse },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, paddingVertical: 4 },
})
