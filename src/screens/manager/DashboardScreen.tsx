import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, StyleSheet, Modal, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useApi } from '../../hooks/useApi'
import { dashboard, extraPayments, dailyPayments } from '../../api/endpoints'
import type { DashboardStats, CollectionByMethod } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, gradients, spacing, borderRadius, shadow, typography } from '../../theme'

function fmt(n: number | null | undefined) { if (n == null) return '₹ 0'; return '₹ ' + n.toLocaleString('en-IN') }
function fd(d: string | null | undefined) { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('en-IN') }

export default function DashboardScreen() {
  const navigation = useNavigation<any>()
  const { data: stats, loading, error, refresh } = useApi<DashboardStats>(dashboard.stats, [])
  const { data: collections, loading: colLoading } = useApi<CollectionByMethod[]>(() => dashboard.getCollectionsByMethod(), [])
  const [refreshing, setRefreshing] = useState(false)

  const [pendingType, setPendingType] = useState<'extras' | 'daily' | null>(null)
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<any>(null)
  const [editAmt, setEditAmt] = useState('')
  const [editReason, setEditReason] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState('pending')
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  const openPending = async (type: 'extras' | 'daily') => {
    setPendingType(type)
    setPendingItems([])
    setPendingLoading(true)
    try {
      if (type === 'extras') {
        const res = await extraPayments.list({ status: 'pending', limit: 50 })
        setPendingItems(res.data ?? [])
      } else {
        const res = await dailyPayments.getPendingApprovals({ limit: 50 })
        setPendingItems(res.data ?? [])
      }
    } catch { }
    setPendingLoading(false)
  }

  const handleEditSave = async () => {
    if (!editItem) return
    if (!editAmt || isNaN(Number(editAmt)) || Number(editAmt) <= 0) {
      Alert.alert('Error', 'Enter a valid amount')
      return
    }
    setSavingEdit(true)
    try {
      await extraPayments.update(editItem._id, {
        amount: Number(editAmt),
        reason: editReason || undefined,
        paymentDate: editDate || undefined,
        notes: editNotes || undefined,
        status: editStatus,
      })
      Alert.alert('Success', 'Extra payment updated')
      setEditItem(null)
      refresh()
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleApprove = async (id: string) => {
    setActionId(id)
    try {
      await dailyPayments.approve(id)
      Alert.alert('Success', 'Payment approved')
      setPendingItems(prev => prev.filter((x: any) => x._id !== id))
      refresh()
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed')
    } finally {
      setActionId(null)
    }
  }

  if (loading && !stats) {
    return (
      <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
        <View style={s.centered}><ActivityIndicator size="small" color={colors.primary} /></View>
      </SafeAreaView>
    )
  }
  if (error) {
    return (
      <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
        <View style={s.centered}><Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text></View>
      </SafeAreaView>
    )
  }
  if (!stats) return null

  const hasPendingDaily = stats.dailyPayments.pendingApprovals > 0
  const hasPendingExtras = stats.extraPayments.pendingCount > 0
  const hasExpiringDocs = stats.documents.expiringSoon > 0
  const hasCollections = !colLoading && collections && collections.length > 0

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>
        <GradientHeader title="Dashboard" subtitle="Overview of your operations" icon="view-dashboard" showLogout />

        {/* Stats grid */}
        <View style={s.statsGrid}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statCard}>
            <View style={s.statIcon}><MaterialCommunityIcons name="car" size={16} color="rgba(255,255,255,0.8)" /></View>
            <Text style={s.statValue}>{stats.taxis.total}</Text>
            <Text style={s.statLabel}>Taxis</Text>
            <Text style={s.statSub}>{stats.taxis.active} active</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statCard}>
            <View style={s.statIcon}><MaterialCommunityIcons name="account" size={16} color="rgba(255,255,255,0.8)" /></View>
            <Text style={s.statValue}>{stats.drivers.total}</Text>
            <Text style={s.statLabel}>Drivers</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statCard}>
            <View style={s.statIcon}><MaterialCommunityIcons name="trending-up" size={16} color="rgba(255,255,255,0.8)" /></View>
            <Text style={s.statValue}>{fmt(stats.income.today)}</Text>
            <Text style={s.statLabel}>Today's Income</Text>
            <Text style={s.statSub}>{stats.income.todayCount} payments</Text>
          </LinearGradient>
          <LinearGradient colors={gradients.secondary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statCard}>
            <View style={s.statIcon}><MaterialCommunityIcons name="cash-multiple" size={16} color="rgba(255,255,255,0.8)" /></View>
            <Text style={s.statValue}>{fmt(stats.dailyPayments.totalCollected)}</Text>
            <Text style={s.statLabel}>Collected</Text>
          </LinearGradient>
        </View>

        {/* Income vs Expenditure */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="scale-balance" size={14} color={colors.primary} />
            <Text style={s.sectionTitle}>Income vs Expenses</Text>
          </View>
          <View style={s.ieCard}>
            <View style={s.ieRow}>
              <View style={s.ieItem}>
                <View style={[s.ieDot, { backgroundColor: colors.success }]} />
                <View>
                  <Text style={s.ieLabel}>Income</Text>
                  <Text style={[s.ieValue, { color: colors.success }]}>{fmt(stats.income.total)}</Text>
                </View>
              </View>
              <View style={s.ieItem}>
                <View style={[s.ieDot, { backgroundColor: colors.danger }]} />
                <View>
                  <Text style={s.ieLabel}>Expenses</Text>
                  <Text style={[s.ieValue, { color: colors.danger }]}>{fmt(stats.expenditure.total)}</Text>
                </View>
              </View>
            </View>
            {stats.income.total > 0 && (
              <>
                <View style={s.ieBarBg}>
                  <View style={[s.ieBarIncome, { width: `${Math.min((stats.income.total / (stats.income.total + stats.expenditure.total)) * 100, 100)}%` }]} />
                </View>
                <Text style={s.ieRatio}>{Math.round((stats.income.total / (stats.income.total + stats.expenditure.total)) * 100)}% income ratio</Text>
              </>
            )}
          </View>
        </View>

        {/* Weekly + Leaves row */}
        <View style={s.duoRow}>
          <View style={s.duoCard}>
            <MaterialCommunityIcons name="calendar-week" size={16} color={colors.primary} />
            <Text style={s.duoValue}>{fmt(stats.income.weekly)}</Text>
            <Text style={s.duoLabel}>This Week</Text>
            <Text style={s.duoSub}>{stats.income.weeklyCount} payments</Text>
          </View>
          <View style={s.duoCard}>
            <MaterialCommunityIcons name="calendar-remove" size={16} color={colors.warning} />
            <Text style={s.duoValue}>{stats.leaves.thisMonth}</Text>
            <Text style={s.duoLabel}>Leaves</Text>
            <Text style={s.duoSub}>this month</Text>
          </View>
        </View>

        {/* Collection progress */}
        {stats.dailyPayments.grandTotalCollected > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <MaterialCommunityIcons name="progress-check" size={14} color={colors.success} />
              <Text style={s.sectionTitle}>Collection Progress</Text>
            </View>
            <View style={s.progressCard}>
              <View style={s.progressTop}>
                <Text style={s.progressAmt}>{fmt(stats.dailyPayments.grandTotalCollected)}</Text>
                <Text style={s.progressLabel}>of {fmt(stats.dailyPayments.grandTotalCollected + stats.dailyPayments.totalDue)}</Text>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${Math.min((stats.dailyPayments.grandTotalCollected / (stats.dailyPayments.grandTotalCollected + stats.dailyPayments.totalDue)) * 100, 100)}%` }]} />
              </View>
              <View style={s.progressBottom}>
                <Text style={s.progressMeta}>Due: {fmt(stats.dailyPayments.totalDue)}</Text>
                <Text style={s.progressMeta}>{stats.dailyPayments.pendingApprovals} pending approvals</Text>
              </View>
            </View>
          </View>
        )}

        {/* Expiring docs */}
        {hasExpiringDocs && (
          <GradientCard gradient={gradients.warning} icon="file-document" iconColor={colors.warning}
            title="Expiring Documents" value={`${stats.documents.expiringSoon}`}
            subtitle="Documents expiring soon"
            onPress={() => navigation.navigate('Documents')} />
        )}

        {/* Collections */}
        {hasCollections && (
          <GradientCard icon="chart-bar" iconColor={colors.primary} title="Collections by Method" compact>
            {(() => {
              const maxTotal = Math.max(...collections!.map(x => x.total))
              return collections!.map((c, i) => (
                <View key={i} style={s.collectionRow}>
                  <Text style={s.collectionLabel}>{c.label || c.method}</Text>
                  <View style={s.collectionBarBg}>
                    <View style={[s.collectionBarFill, { width: `${(c.total / maxTotal) * 100}%` }]} />
                  </View>
                  <Text style={s.collectionValue}>{fmt(c.total)}</Text>
                </View>
              ))
            })()}
          </GradientCard>
        )}
      </ScrollView>

      {/* Pending items footer */}
      {(hasPendingDaily || hasPendingExtras) && (
        <View style={s.footer}>
          <Text style={s.footerTitle}>Needs Action</Text>

          {hasPendingDaily && (
            <TouchableOpacity style={[s.footerCard, { borderLeftColor: colors.purple }]} onPress={() => openPending('daily')} activeOpacity={0.7}>
              <View style={[s.footerIcon, { backgroundColor: colors.purpleLight }]}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.purple} />
              </View>
              <View style={s.footerInfo}>
                <Text style={s.footerLabel}>Pending Approvals</Text>
                <Text style={s.footerSub}>{stats.dailyPayments.pendingApprovals} daily payments to review</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

          {hasPendingExtras && (
            <TouchableOpacity style={[s.footerCard, { borderLeftColor: colors.danger }]} onPress={() => openPending('extras')} activeOpacity={0.7}>
              <View style={[s.footerIcon, { backgroundColor: colors.dangerLight }]}>
                <MaterialCommunityIcons name="cash-plus" size={14} color={colors.danger} />
              </View>
              <View style={s.footerInfo}>
                <Text style={s.footerLabel}>Pending Extra Payments</Text>
                <Text style={s.footerSub}>{stats.extraPayments.pendingCount} extras awaiting action</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Pending items list modal */}
      <Modal visible={!!pendingType} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={[s.modalIcon, { backgroundColor: pendingType === 'extras' ? colors.dangerLight : colors.purpleLight }]}>
                <MaterialCommunityIcons name={pendingType === 'extras' ? 'cash-plus' : 'cash-check'} size={16} color={pendingType === 'extras' ? colors.danger : colors.purple} />
              </View>
              <Text style={s.modalTitle}>{pendingType === 'extras' ? 'Pending Extras' : 'Pending Approvals'}</Text>
              <TouchableOpacity onPress={() => { setPendingType(null); setPendingItems([]) }} style={s.modalClose}>
                <MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {pendingLoading ? (
              <ActivityIndicator color={colors.primary} style={{ padding: 40 }} />
            ) : pendingItems.length === 0 ? (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="check-circle" size={28} color={colors.success} />
                <Text style={s.emptyText}>All clear — nothing pending</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: '70%' }} showsVerticalScrollIndicator={false}>
                {pendingItems.map((item: any) => (
                  <View key={item._id} style={s.pi}>
                    <View style={s.piTop}>
                      <View style={s.piLeft}>
                        <View style={[s.piDot, { backgroundColor: pendingType === 'extras' ? colors.danger : colors.purple }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.piTitle} numberOfLines={1}>{item.taxi?.plateNumber || 'N/A'}</Text>
                          <Text style={s.piSub} numberOfLines={1}>{item.driver?.name || item.reason || ''}</Text>
                        </View>
                      </View>
                      <Text style={[s.piAmt, { color: pendingType === 'extras' ? colors.danger : colors.purple }]}>{fmt(item.amount || item.amountPaid || 0)}</Text>
                    </View>
                    <View style={s.piBottom}>
                      <Text style={s.piMeta}>{fd(item.paymentDate || item.date || item.createdAt)}</Text>
                      {item.reason ? <Text style={s.piMeta}>· {item.reason}</Text> : null}

                      {pendingType === 'extras' && (
                        <TouchableOpacity style={s.editBtn} onPress={() => {
                          setEditItem(item)
                          setEditAmt(String(item.amount || ''))
                          setEditReason(item.reason || '')
                          setEditDate(item.paymentDate ? new Date(item.paymentDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
                          setEditNotes(item.notes || '')
                          setEditStatus(item.status || 'pending')
                        }}>
                          <MaterialCommunityIcons name="pencil-outline" size={10} color={colors.primary} />
                          <Text style={s.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                      )}
                      {pendingType === 'daily' && (
                        <TouchableOpacity
                          style={[s.approveBtn, actionId === item._id && { opacity: 0.5 }]}
                          disabled={actionId === item._id}
                          onPress={() => handleApprove(item._id)}>
                          {actionId === item._id ? <ActivityIndicator size={10} color={colors.success} /> : <MaterialCommunityIcons name="check-circle-outline" size={10} color={colors.success} />}
                          <Text style={s.approveBtnText}>Approve</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit modal */}
      <Modal visible={!!editItem} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditItem(null)}>
          <TouchableOpacity activeOpacity={1} style={s.modalContent} onPress={() => {}}>
            <View style={s.modalHeader}>
              <View style={[s.modalIcon, { backgroundColor: colors.primaryLight + '20' }]}>
                <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
              </View>
              <Text style={s.modalTitle}>Edit Extra Payment</Text>
              <TouchableOpacity onPress={() => setEditItem(null)} style={s.modalClose}>
                <MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            {editItem && (
              <>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Driver</Text>
                  <Text style={s.infoValue}>{editItem.driver?.name || 'N/A'}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Status</Text>
                  <Text style={[s.infoValue, { color: editItem.status === 'paid' ? colors.success : colors.danger }]}>{editItem.status}</Text>
                </View>

                <Text style={s.fieldLabel}>Status</Text>
                <View style={s.statusRow}>
                  {(['pending', 'paid', 'cancelled'] as const).map(st => (
                    <TouchableOpacity key={st} style={[s.statusBtn, editStatus === st && s.statusBtnActive, editStatus === st && { backgroundColor: st === 'paid' ? colors.success : st === 'cancelled' ? colors.danger : colors.primary }]} onPress={() => setEditStatus(st)}>
                      <Text style={[s.statusText, editStatus === st && s.statusTextActive]}>{st.charAt(0).toUpperCase() + st.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.fieldLabel}>Amount</Text>
                <TextInput style={s.fieldInput} value={editAmt} onChangeText={setEditAmt} keyboardType="decimal-pad" placeholder="Amount" placeholderTextColor={colors.textTertiary} />

                <Text style={s.fieldLabel}>Reason</Text>
                <TextInput style={s.fieldInput} value={editReason} onChangeText={setEditReason} placeholder="Reason" placeholderTextColor={colors.textTertiary} />

                <Text style={s.fieldLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput style={s.fieldInput} value={editDate} onChangeText={setEditDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />

                <Text style={s.fieldLabel}>Notes</Text>
                <TextInput style={[s.fieldInput, { minHeight: 50 }]} value={editNotes} onChangeText={setEditNotes} placeholder="Optional notes" placeholderTextColor={colors.textTertiary} multiline />

                <TouchableOpacity style={[s.saveBtn, savingEdit && { opacity: 0.6 }]} disabled={savingEdit} onPress={handleEditSave}>
                  {savingEdit ? <ActivityIndicator color={colors.textInverse} /> : <Text style={s.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  statCard: { width: '47%', borderRadius: borderRadius.md, padding: spacing.md, ...shadow.sm },
  statIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textInverse, marginTop: 2 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 1 },
  statSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  collectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
  collectionLabel: { width: 70, fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  collectionBarBg: { flex: 1, height: 6, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  collectionBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  collectionValue: { width: 70, textAlign: 'right', fontSize: 11, fontWeight: '600', color: colors.text },

  // Section
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },

  // Income vs Expense
  ieCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight, ...shadow.sm },
  ieRow: { flexDirection: 'row', gap: spacing.lg },
  ieItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ieDot: { width: 8, height: 8, borderRadius: 4 },
  ieLabel: { fontSize: 10, color: colors.textTertiary },
  ieValue: { fontSize: 15, fontWeight: '700' },
  ieBarBg: { height: 5, backgroundColor: colors.dangerLight, borderRadius: 3, overflow: 'hidden', marginTop: spacing.sm },
  ieBarIncome: { height: '100%', backgroundColor: colors.success, borderRadius: 3 },
  ieRatio: { fontSize: 10, color: colors.textTertiary, marginTop: 3, textAlign: 'right' },

  // Duo row
  duoRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  duoCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', ...shadow.sm },
  duoValue: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
  duoLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  duoSub: { fontSize: 10, color: colors.textTertiary },

  // Progress
  progressCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight, ...shadow.sm },
  progressTop: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  progressAmt: { fontSize: 18, fontWeight: '800', color: colors.success },
  progressLabel: { fontSize: 11, color: colors.textTertiary },
  progressBg: { height: 6, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden', marginTop: spacing.sm },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: 3 },
  progressBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  progressMeta: { fontSize: 10, color: colors.textTertiary },

  // Footer
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
  footerTitle: { fontSize: 11, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  footerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceSecondary, marginBottom: spacing.xs, borderLeftWidth: 3 },
  footerIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  footerInfo: { flex: 1 },
  footerLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  footerSub: { fontSize: 10, color: colors.textTertiary, marginTop: 1 },

  // Modal shared
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  modalIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  modalClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: colors.textTertiary, fontSize: 13, marginTop: 8 },

  // Pending item
  pi: { backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.sm, padding: spacing.sm, marginBottom: spacing.xs },
  piTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  piLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  piDot: { width: 6, height: 6, borderRadius: 3 },
  piTitle: { fontSize: 12, fontWeight: '600', color: colors.text },
  piSub: { fontSize: 10, color: colors.textTertiary },
  piAmt: { fontSize: 12, fontWeight: '700' },
  piBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  piMeta: { fontSize: 10, color: colors.textTertiary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.sm, backgroundColor: colors.primaryLight + '15', marginLeft: 'auto' },
  editBtnText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  approveBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.sm, backgroundColor: colors.successLight, marginLeft: 'auto' },
  approveBtnText: { fontSize: 10, fontWeight: '600', color: colors.success },

  // Edit modal fields
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  infoLabel: { fontSize: 11, color: colors.textSecondary },
  infoValue: { fontSize: 11, fontWeight: '600', color: colors.text },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  fieldInput: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12, color: colors.text, backgroundColor: colors.surfaceSecondary, minHeight: 36, textAlignVertical: 'top' },
  saveBtn: { marginTop: spacing.md, paddingVertical: 10, borderRadius: borderRadius.sm, backgroundColor: colors.success, alignItems: 'center' },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: colors.textInverse },
  statusRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  statusBtn: { flex: 1, paddingVertical: 7, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surfaceSecondary },
  statusBtnActive: { borderWidth: 1, borderColor: 'transparent' },
  statusText: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  statusTextActive: { color: colors.textInverse, fontWeight: '600' },
})
