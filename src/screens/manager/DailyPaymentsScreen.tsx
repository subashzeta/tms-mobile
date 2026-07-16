import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { dailyPayments, taxis, income } from '../../api/endpoints'
import type { Taxi } from '../../types'
import RecordPaymentModal from '../../components/RecordPaymentModal'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientButton } from '../../components/GradientButton'

import { colors, gradients, spacing, borderRadius, typography } from '../../theme'
import { ExpenditureModal, ExtraPaymentModal, LeaveModal } from '../../components/TaxiActionModals'

function fmt(n: number | null | undefined) { if (n == null) return '₹ 0'; return '₹ ' + n.toLocaleString('en-IN') }
function fd(d: string | null | undefined) { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('en-IN') }

type SubTab = 'taxis' | 'payments' | 'approvals' | 'income'

export default function DailyPaymentsScreen() {
  const nav = useNavigation<any>()
  const [tab, setTab] = useState<SubTab>('taxis')
  const [refreshing, setRefreshing] = useState(false)
  const [showRec, setShowRec] = useState(false)
  const [recTaxi, setRecTaxi] = useState<Taxi | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editPayment, setEditPayment] = useState<any>(null)
  const [editAmountPaid, setEditAmountPaid] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editMethod, setEditMethod] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [markPaidLoading, setMarkPaidLoading] = useState<string | null>(null)
  const [modalType, setModalType] = useState<'expense' | 'extra' | 'leave' | null>(null)
  const [modalTaxiId, setModalTaxiId] = useState('')

  const { data: taxisData, loading: tLoading, refresh: refreshT } = useApi<any>(() => taxis.list({ isActive: true, limit: 200 }), [])
  const { data: pendingData, loading: pdLoading, refresh: refreshPd } = useApi<any>(() => dailyPayments.getPendingByTaxi({ range: 'tillToday', includeAll: 'true' }), [])
  const [searchText, setSearchText] = useState('')
  const { data: payData, loading: pLoading, refresh: refreshP } = useApi<any>(() => dailyPayments.list({ limit: 50, sort: 'date', order: 'desc', search: searchText || undefined }), [searchText])
  const { data: apprData, loading: aLoading, refresh: refreshA } = useApi<any>(() => dailyPayments.getPendingApprovals(), [])
  const { data: incData, loading: iLoading, refresh: refreshI } = useApi<any>(() => income.list({ limit: 50, sort: 'date', order: 'desc' }), [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    Promise.all([refreshT(), refreshPd(), refreshP(), refreshA(), refreshI()]).finally(() => setRefreshing(false))
  }, [])

  const taxisList: Taxi[] = Array.isArray(taxisData?.data) ? taxisData.data : Array.isArray(taxisData) ? taxisData : []
  const pendingByTaxi: any[] = Array.isArray(pendingData) ? pendingData : []
  const payList: any[] = Array.isArray(payData?.data) ? payData.data : Array.isArray(payData) ? payData : []
  const apprList: any[] = Array.isArray(apprData?.data) ? apprData.data : Array.isArray(apprData) ? apprData : []
  const incList: any[] = Array.isArray(incData?.data) ? incData.data : Array.isArray(incData) ? incData : []

  const pendingMap = useMemo(() => {
    const m = new Map<string, any>()
    pendingByTaxi.forEach((item: any) => {
      const tid = item.taxi?._id || item._id
      if (tid) m.set(tid, item)
    })
    return m
  }, [pendingByTaxi])

  const taxiCards = useMemo(() => {
    return taxisList.map(t => {
      const p = pendingMap.get(t._id)
      return {
        taxi: t,
        pending: p?.pendingDays || 0,
        paid: p?.paidDays || 0,
        totalDue: p?.outstandingAmount || 0,
        pendingDates: p?.pendingDates || [],
        paidDates: p?.paidDates || [],
      }
    }).sort((a, b) => b.pending - a.pending)
  }, [taxisList, pendingMap])

  const handleApprove = useCallback(async (id: string) => {
    setActionLoading(id)
    try { await dailyPayments.approve(id); refreshA(); refreshP() }
    catch (err: any) { alert(err?.response?.data?.message || err?.message || 'Failed') }
    finally { setActionLoading(null) }
  }, [])

  const handleReject = useCallback(async () => {
    if (!rejectId || !rejectReason.trim()) return
    setActionLoading(rejectId); setShowReject(false)
    try { await dailyPayments.reject(rejectId, rejectReason.trim()); refreshA(); refreshP() }
    catch (err: any) { alert(err?.response?.data?.message || err?.message || 'Failed') }
    finally { setActionLoading(null); setRejectId(null); setRejectReason('') }
  }, [rejectId, rejectReason])

  const handleVerify = useCallback(async (id: string, verified: boolean) => {
    setActionLoading(id)
    try { if (verified) await income.unverify(id); else await income.verify(id); refreshI() }
    catch (err: any) { alert(err?.response?.data?.message || err?.message || 'Failed') }
    finally { setActionLoading(null) }
  }, [])

  const handleMarkAsPaid = useCallback(async (item: any) => {
    setMarkPaidLoading(item._id)
    try {
      await dailyPayments.markAsPaid(item._id, { amountPaid: item.amountDue, paymentMethod: 'cash' })
      refreshP(); refreshPd(); refreshA()
    } catch (err: any) { alert(err?.response?.data?.message || err?.message || 'Failed') }
    finally { setMarkPaidLoading(null) }
  }, [])

  const handleEditSave = useCallback(async () => {
    if (!editPayment) return
    try {
      await dailyPayments.update(editPayment._id, {
        amountPaid: editAmountPaid ? parseFloat(editAmountPaid) : undefined,
        status: editStatus || undefined,
        paymentMethod: editMethod || undefined,
        notes: editNotes || undefined,
      })
      setEditPayment(null); refreshP(); refreshA()
    } catch (err: any) { alert(err?.response?.data?.message || err?.message || 'Failed') }
  }, [editPayment, editAmountPaid, editStatus, editMethod, editNotes])

  const tabs: { key: SubTab; label: string; icon: string }[] = [
    { key: 'taxis', label: 'Taxis', icon: 'car-multiple' },
    { key: 'payments', label: 'Payments', icon: 'cash-multiple' },
    { key: 'approvals', label: 'Approvals', icon: 'check-circle' },
    { key: 'income', label: 'Income', icon: 'trending-up' },
  ]

  return (
    <SafeAreaView style={styles.c} edges={['top', 'left', 'right']}>
      <GradientHeader title="Payments" subtitle="Manage daily payments and income" icon="cash-multiple" showLogout
        rightIcon="cog" onRightPress={() => nav.navigate('ManagerSettings')} />

      <View style={styles.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity testID={`tab-${t.key}`} key={t.key} style={[styles.tab, tab === t.key && styles.tabA]} onPress={() => setTab(t.key)}>
            <MaterialCommunityIcons name={t.icon as any} size={13} color={tab === t.key ? colors.textInverse : colors.textTertiary} />
            <Text style={[styles.tabT, tab === t.key && styles.tabTA]}>{t.label}{t.key === 'approvals' && apprList.length > 0 ? ` (${apprList.length})` : ''}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.sa} contentContainerStyle={styles.sc}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        {tab === 'taxis' ? (
          <View>
            {tLoading || pdLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ padding: 40 }} />
            ) : taxiCards.length === 0 ? (
              <Text style={styles.empty}>No taxis available</Text>
            ) : (
              taxiCards.map(({ taxi, pending, paid, totalDue, paidDates, pendingDates }) => (
                <View key={taxi._id} style={styles.taxiCard}>
                  <View style={styles.taxiCardTop}>
                    <View style={styles.taxiInfo}>
                      <MaterialCommunityIcons name="car" size={24} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.taxiPlate}>{taxi.plateNumber}</Text>
                        <Text style={styles.taxiDriver}>{taxi.assignedDriver?.name || 'No driver'}</Text>
                      </View>
                      <Text style={styles.taxiRate}>{fmt(taxi.dailyRate || 0)}/d</Text>
                    </View>
                  </View>
                  <View style={styles.statusRow}>
                    <View style={styles.statusItem}><View style={[styles.statusDot, { backgroundColor: colors.success }]} /><Text style={styles.statusLabel}>{paid} paid</Text></View>
                    <View style={styles.statusItem}><View style={[styles.statusDot, { backgroundColor: colors.warning }]} /><Text style={styles.statusLabel}>{pending} pending</Text></View>
                    <Text style={styles.totalDueText}>Due: {fmt(totalDue)}</Text>
                  </View>
                  <GradientButton
                    title="Record Payment"
                    icon="cash-check"
                    small
                    onPress={() => { setRecTaxi(taxi); setShowRec(true) }}
                    style={{ marginTop: spacing.sm }}
                  />
                  <View style={styles.taxiActions}>
                    <TouchableOpacity style={styles.taxiActionBtn} onPress={() => { setModalType('expense'); setModalTaxiId(taxi._id) }}>
                      <MaterialCommunityIcons name="cash-remove" size={14} color={colors.danger} />
                      <Text style={styles.taxiActionText}>Expense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.taxiActionBtn} onPress={() => { setModalType('extra'); setModalTaxiId(taxi._id) }}>
                      <MaterialCommunityIcons name="cash-plus" size={14} color={colors.primary} />
                      <Text style={styles.taxiActionText}>Extra</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.taxiActionBtn} onPress={() => { setModalType('leave'); setModalTaxiId(taxi._id) }}>
                      <MaterialCommunityIcons name="calendar-remove" size={14} color={colors.warning} />
                      <Text style={styles.taxiActionText}>Leave</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : tab === 'payments' ? (
          <>
            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textTertiary} />
              <TextInput testID="payments-search" style={styles.searchInput} value={searchText} onChangeText={setSearchText} placeholder="Search by taxi or driver..." placeholderTextColor={colors.textTertiary} />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}
            </View>
            {pLoading && payList.length === 0 ? <ActivityIndicator size="large" color={colors.primary} style={{ padding: 60 }} /> :
          payList.length === 0 ? <Text style={styles.empty}>No payments found</Text> : (() => {
            const grouped: Record<string, any[]> = {}
            payList.forEach((item: any) => {
              const key = item.date ? new Date(item.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'
              if (!grouped[key]) grouped[key] = []
              grouped[key].push(item)
            })
            return Object.entries(grouped).map(([dateLabel, items]) => (
              <View key={dateLabel} style={styles.payGroup}>
                <View style={styles.payGroupHeader}>
                  <MaterialCommunityIcons name="calendar-range" size={13} color={colors.textTertiary} />
                  <Text style={styles.payGroupDate}>{dateLabel}</Text>
                  <Text style={styles.payGroupCount}>{items.length} payment{items.length > 1 ? 's' : ''}</Text>
                </View>
                {items.map((item: any) => {
                  const isPaid = item.status === 'paid'
                  const isPartial = item.status === 'partial'
                  const isOverdue = item.status === 'overdue'
                  const sc = isPaid ? colors.success : isOverdue ? colors.danger : isPartial ? colors.primary : colors.warning
                  const sbg = isPaid ? colors.successLight : isOverdue ? colors.dangerLight : isPartial ? colors.infoLight : colors.warningLight
                  const mi: Record<string, string> = { cash: 'cash', esewa: 'cellphone-link', bank_transfer: 'bank' }
                  return (
                    <View key={item._id} style={styles.payRow}>
                      <View style={[styles.payRowIndicator, { backgroundColor: sc }]} />
                      <View style={styles.payRowBody}>
                        <View style={styles.payRowTop}>
                          <View style={styles.payRowLeft}>
                            <Text style={styles.payRowPlate}>{item.taxi?.plateNumber || '—'}</Text>
                            <Text style={styles.payRowDriver}>{item.driver?.name || ''}</Text>
                          </View>
                          <View style={styles.payRowRight}>
                            <Text style={styles.payRowAmount}>{fmt(item.amountPaid)}</Text>
                            {!isPaid && <Text style={styles.payRowBalance}>Bal: {fmt((item.amountDue || 0) - (item.amountPaid || 0))}</Text>}
                          </View>
                        </View>
                        <View style={styles.payRowMeta}>
                          <View style={[styles.payRowBadge, { backgroundColor: sbg }]}>
                            <Text style={[styles.payRowBadgeT, { color: sc }]}>{item.status?.replace('_', ' ')}</Text>
                          </View>
                          {item.paymentMethod ? (
                            <View style={styles.payRowMetaItem}>
                              <MaterialCommunityIcons name={mi[item.paymentMethod] || 'cash'} size={11} color={colors.textTertiary} />
                              <Text style={styles.payRowMetaT}>{item.paymentMethod.replace('_', ' ')}</Text>
                            </View>
                          ) : null}
                          {item.receivedBy?.name ? (
                            <View style={styles.payRowMetaItem}>
                              <MaterialCommunityIcons name="account-outline" size={11} color={colors.textTertiary} />
                              <Text style={styles.payRowMetaT}>{item.receivedBy.name}</Text>
                            </View>
                          ) : null}
                          <View style={{ flex: 1 }} />
                          <TouchableOpacity style={styles.payRowEdit} onPress={() => {
                            setEditPayment(item)
                            setEditAmountPaid(String(item.amountPaid || ''))
                            setEditStatus(item.status || 'pending')
                            setEditMethod(item.paymentMethod || '')
                            setEditNotes(item.notes || '')
                          }}>
                            <MaterialCommunityIcons name="pencil" size={13} color={colors.primary} />
                          </TouchableOpacity>
                          {!isPaid && (
                            markPaidLoading === item._id
                              ? <ActivityIndicator size={13} color={colors.success} />
                              : <TouchableOpacity style={styles.payRowCheck} onPress={() => handleMarkAsPaid(item)}>
                                  <MaterialCommunityIcons name="check" size={13} color={colors.success} />
                                </TouchableOpacity>
                          )}
                        </View>
                        {item.notes ? (
                          <View style={styles.payRowNotes}>
                            <MaterialCommunityIcons name="note-text-outline" size={10} color={colors.textTertiary} />
                            <Text style={styles.payRowNotesT} numberOfLines={1}>{item.notes}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  )
                })}
              </View>
            ))
          })()}
          </>
        ) : tab === 'approvals' ? (
          aLoading && apprList.length === 0 ? <ActivityIndicator size="large" color={colors.primary} style={{ padding: 60 }} /> :
          apprList.length === 0 ? <Text style={styles.empty}>No pending approvals</Text> :
          apprList.map((item, i) => (
            <GradientCard key={item._id ?? i} icon="clock" iconColor={colors.purple}
              title={item.taxi?.plateNumber || 'N/A'} subtitle={item.driver?.name || ''}
              value={fmt(item.amountDue)} valueColor={colors.purple}
              stats={[
                { label: 'Paid', value: fmt(item.amountPaid), color: colors.success },
                { label: 'Method', value: item.paymentMethod?.replace('_', ' ') || '', color: colors.textSecondary },
                { label: 'Date', value: fd(item.paidAt || item.date), color: colors.textTertiary },
              ]}>
              <View style={styles.aR}>
                {actionLoading === item._id ? <ActivityIndicator size="small" color={colors.primary} /> : (
                  <><TouchableOpacity style={styles.aprvB} onPress={() => handleApprove(item._id)}><Text style={styles.aprvBT}>Approve</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.rejB} onPress={() => { setRejectId(item._id); setRejectReason(''); setShowReject(true) }}><Text style={styles.aprvBT}>Reject</Text></TouchableOpacity></>
                )}
              </View>
            </GradientCard>
          ))
        ) : (
          iLoading && incList.length === 0 ? <ActivityIndicator size="large" color={colors.primary} style={{ padding: 60 }} /> : (
            <>{incList.length === 0 ? <Text style={styles.empty}>No income records</Text> : incList.map((item: any, i: number) => {
              const verified = !!item.verifiedAt
              return (
                <GradientCard key={item._id ?? i} icon="trending-up" iconColor={colors.success}
                  title={item.taxi?.plateNumber || 'N/A'} subtitle={item.driver?.name || ''}
                  value={fmt(item.amount)} valueColor={colors.success}
                  stats={[
                    { label: 'Date', value: fd(item.date), color: colors.textSecondary },
                    { label: 'Shift', value: item.shift || '-', color: colors.textTertiary },
                    { label: 'Status', value: verified ? 'Verified' : 'Pending', color: verified ? colors.success : colors.warning },
                  ]}>
                  {actionLoading === item._id ? <ActivityIndicator size="small" color={colors.primary} /> : (
                    <TouchableOpacity style={[styles.vBtn, verified && styles.uBtn]} onPress={() => handleVerify(item._id, verified)}>
                      <Text style={styles.aprvBT}>{verified ? 'Unverify' : 'Verify'}</Text>
                    </TouchableOpacity>
                  )}
                </GradientCard>
              )
            })}</>
          )
        )}
      </ScrollView>

      <RecordPaymentModal
        visible={showRec}
        onClose={() => setShowRec(false)}
        onSuccess={() => { refreshPd(); refreshP(); refreshA() }}
        taxi={recTaxi}
        taxisList={taxisList}
      />

      <Modal visible={showReject} transparent animationType="fade">
        <View style={styles.mO}><View style={styles.mM}>
          <Text style={styles.mT}>Reject Payment</Text>
          <Text style={styles.mL}>Reason *</Text>
          <TextInput style={[styles.mI, { minHeight: 80, textAlignVertical: 'top' }]} value={rejectReason} onChangeText={setRejectReason} placeholder="Enter reason..." multiline />
          <View style={styles.mAct}>
            <TouchableOpacity style={styles.canB} onPress={() => setShowReject(false)}><Text style={styles.canBT}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.rejCB} onPress={handleReject}><Text style={styles.aprvBT}>Reject</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={!!editPayment} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mO}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.mM}>
              <View style={styles.editModalHeader}>
                <MaterialCommunityIcons name="pencil-circle" size={28} color={colors.primary} />
                <Text style={styles.mT}>Edit Payment</Text>
              </View>
              <View style={styles.editHeader}>
                <View style={styles.editHeaderRow}>
                  <MaterialCommunityIcons name="car" size={18} color={colors.primary} />
                  <Text style={styles.editHeaderPlate}>{editPayment?.taxi?.plateNumber}</Text>
                </View>
                <View style={styles.editHeaderRow}>
                  <MaterialCommunityIcons name="account" size={14} color={colors.textSecondary} />
                  <Text style={styles.editHeaderDriver}>{editPayment?.driver?.name}</Text>
                </View>
                <View style={styles.editHeaderRow}>
                  <MaterialCommunityIcons name="calendar" size={14} color={colors.textTertiary} />
                  <Text style={styles.editHeaderDate}>{editPayment?.date ? fd(editPayment.date) : ''}</Text>
                </View>
              </View>

              <View style={styles.editField}>
                <View style={styles.editFieldLabel}>
                  <MaterialCommunityIcons name="cash" size={14} color={colors.textSecondary} />
                  <Text style={styles.mL}>Amount Due (NPR)</Text>
                </View>
                <TextInput style={[styles.mI, { backgroundColor: colors.surfaceSecondary }]} value={String(editPayment?.amountDue || '')} editable={false} />
              </View>

              <View style={styles.editField}>
                <View style={styles.editFieldLabel}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                  <Text style={styles.mL}>Amount Paid (NPR)</Text>
                </View>
                <TextInput style={styles.mI} value={editAmountPaid} onChangeText={setEditAmountPaid} keyboardType="numeric" placeholder="Enter amount paid" />
              </View>

              <View style={styles.editField}>
                <View style={styles.editFieldLabel}>
                  <MaterialCommunityIcons name="flag" size={14} color={colors.warning} />
                  <Text style={styles.mL}>Status</Text>
                </View>
                <View style={styles.statusSel}>
                  {['pending', 'paid', 'partial', 'overdue'].map(s => {
                    const sc = s === 'paid' ? colors.success : s === 'overdue' ? colors.danger : s === 'partial' ? colors.primary : colors.warning
                    return (
                      <TouchableOpacity key={s} style={[styles.statusOpt, editStatus === s && { backgroundColor: sc, borderColor: sc }]}
                        onPress={() => setEditStatus(s)}>
                        <Text style={[styles.statusOptT, editStatus === s && styles.statusOptTA]}>{s.replace('_', ' ')}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.editField}>
                <View style={styles.editFieldLabel}>
                  <MaterialCommunityIcons name="wallet" size={14} color={colors.info} />
                  <Text style={styles.mL}>Payment Method</Text>
                </View>
                <View style={styles.statusSel}>
                  {[{ v: '', l: 'None', i: 'close-circle' }, { v: 'cash', l: 'Cash', i: 'cash' }, { v: 'esewa', l: 'eSewa', i: 'cellphone-link' }, { v: 'bank_transfer', l: 'Bank Transfer', i: 'bank' }].map(m => (
                    <TouchableOpacity key={m.v} style={[styles.statusOpt, editMethod === m.v && styles.statusOptA]}
                      onPress={() => setEditMethod(m.v)}>
                      <MaterialCommunityIcons name={m.i as any} size={12} color={editMethod === m.v ? colors.textInverse : colors.textSecondary} />
                      <Text style={[styles.statusOptT, editMethod === m.v && styles.statusOptTA]}>{m.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.editField}>
                <View style={styles.editFieldLabel}>
                  <MaterialCommunityIcons name="note-text-outline" size={14} color={colors.purple} />
                  <Text style={styles.mL}>Notes</Text>
                </View>
                <TextInput style={[styles.mI, { minHeight: 70, textAlignVertical: 'top' }]} value={editNotes} onChangeText={setEditNotes} placeholder="Add or edit notes..." multiline />
              </View>

              <View style={styles.mAct}>
                <TouchableOpacity style={styles.canB} onPress={() => setEditPayment(null)}>
                  <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                  <Text style={styles.canBT}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveB} onPress={handleEditSave}>
                  <MaterialCommunityIcons name="check" size={16} color={colors.textInverse} />
                  <Text style={styles.aprvBT}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <ExpenditureModal visible={modalType === 'expense'} taxiId={modalTaxiId} onClose={() => setModalType(null)} onDone={() => { refreshT(); refreshPd(); refreshP(); refreshI() }} />
      <ExtraPaymentModal visible={modalType === 'extra'} taxiId={modalTaxiId} onClose={() => setModalType(null)} onDone={() => { refreshT(); refreshPd(); refreshP(); refreshI() }} />
      <LeaveModal visible={modalType === 'leave'} taxiId={modalTaxiId} onClose={() => setModalType(null)} onDone={() => { refreshT(); refreshPd() }} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  empty: { color: colors.textTertiary, fontSize: 14, textAlign: 'center', padding: 40 },
  tabRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.xs, marginBottom: spacing.md },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 7, paddingHorizontal: 10, borderRadius: borderRadius.sm, backgroundColor: colors.surface },
  tabA: { backgroundColor: colors.primary },
  tabT: { fontSize: 11, fontWeight: '500', color: colors.textTertiary },
  tabTA: { color: colors.textInverse },
  sa: { flex: 1 }, sc: { padding: spacing.lg, paddingBottom: 100 },
  aR: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  aprvB: { backgroundColor: colors.success, paddingHorizontal: 20, paddingVertical: 8, borderRadius: borderRadius.sm },
  rejB: { backgroundColor: colors.danger, paddingHorizontal: 20, paddingVertical: 8, borderRadius: borderRadius.sm },
  rejCB: { flex: 1, backgroundColor: colors.danger, paddingVertical: 12, borderRadius: borderRadius.md, alignItems: 'center' },
  aprvBT: { color: colors.textInverse, fontSize: 13, fontWeight: '600' },
  vBtn: { backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 7, borderRadius: borderRadius.sm, alignSelf: 'flex-start', marginTop: spacing.sm },
  uBtn: { backgroundColor: colors.warning },
  mO: { flex: 1, justifyContent: 'center', backgroundColor: colors.overlay, padding: spacing.xxl },
  mM: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxl },
  mT: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  mL: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: spacing.xs },
  mI: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceSecondary },
  mAct: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  taxiCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md,
    ...{ shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 } as any,
  },
  taxiCardTop: { marginBottom: spacing.sm },
  taxiInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  taxiPlate: { fontSize: 16, fontWeight: '700', color: colors.text },
  taxiDriver: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  taxiRate: { fontSize: 14, fontWeight: '600', color: colors.success },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, color: colors.textSecondary },
  totalDueText: { fontSize: 13, fontWeight: '600', color: colors.text, marginLeft: 'auto' },
  taxiActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  taxiActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderLight },
  taxiActionText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  payGroup: { marginBottom: spacing.md },
  payGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm, paddingHorizontal: 2 },
  payGroupDate: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, flex: 1 },
  payGroupCount: { fontSize: 11, color: colors.textTertiary },
  payRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: spacing.xs, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden' },
  payRowIndicator: { width: 3 },
  payRowBody: { flex: 1, padding: spacing.md },
  payRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  payRowLeft: { flex: 1 },
  payRowPlate: { fontSize: 14, fontWeight: '700', color: colors.text },
  payRowDriver: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  payRowRight: { alignItems: 'flex-end' },
  payRowAmount: { fontSize: 14, fontWeight: '700', color: colors.text },
  payRowBalance: { fontSize: 11, color: colors.danger, marginTop: 1 },
  payRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  payRowBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.sm },
  payRowBadgeT: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  payRowMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  payRowMetaT: { fontSize: 10, color: colors.textTertiary },
  payRowEdit: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.infoLight, justifyContent: 'center', alignItems: 'center' },
  payRowCheck: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.successLight, justifyContent: 'center', alignItems: 'center' },
  payRowNotes: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  payRowNotesT: { fontSize: 10, color: colors.textTertiary, fontStyle: 'italic', flex: 1 },
  editHeader: { backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg, gap: 4 },
  editHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editHeaderPlate: { fontSize: 15, fontWeight: '700', color: colors.text },
  editHeaderDriver: { fontSize: 13, color: colors.textSecondary },
  editHeaderDate: { fontSize: 12, color: colors.textTertiary },
  editModalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.lg },
  editField: { marginBottom: spacing.md },
  editFieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  statusSel: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  statusOpt: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  statusOptA: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusOptT: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, textTransform: 'capitalize' },
  statusOptTA: { color: colors.textInverse },
  saveB: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: borderRadius.md },
  canB: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border },
  canBT: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, paddingVertical: 4 },
})
