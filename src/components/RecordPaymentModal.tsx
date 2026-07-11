import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { dailyPayments, paymentAccounts } from '../api/endpoints'
import NepaliDateRangePicker, { DateRange } from './NepaliDateRangePicker'
import { GradientButton } from './GradientButton'
import { useToast } from './Toast'
import { colors, spacing, borderRadius, typography } from '../theme'
import type { Taxi, PaymentAccount } from '../types'

function fmt(n: number | null | undefined) { if (n == null) return '₹ 0'; return '₹ ' + n.toLocaleString('en-IN') }

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
  taxi?: Taxi | null
  taxisList?: Taxi[]
}

export default function RecordPaymentModal({ visible, onClose, onSuccess, taxi: initTaxi, taxisList = [] }: Props) {
  const toast = useToast()
  const [selTaxi, setSelTaxi] = useState<Taxi | null>(initTaxi || null)
  const [showTp, setShowTp] = useState(false)
  const [dr, setDr] = useState<DateRange>({ from: '', to: '' })
  const [method, setMethod] = useState('cash')
  const [accs, setAccs] = useState<PaymentAccount[]>([])
  const [selAcc, setSelAcc] = useState('')
  const [amt, setAmt] = useState(initTaxi?.dailyRate ? String(initTaxi.dailyRate) : '')
  const [nts, setNts] = useState('')
  const [proof, setProof] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingA, setLoadingA] = useState(false)
  const [paidDates, setPaidDates] = useState<string[]>([])

  useEffect(() => {
    if (visible) {
      setSelTaxi(initTaxi || null)
      setDr({ from: '', to: '' })
      setMethod('cash'); setSelAcc(''); setNts(''); setProof(null)
      setAmt(initTaxi?.dailyRate ? String(initTaxi.dailyRate) : '')
      setPaidDates([])
      loadAccs()
    }
  }, [visible, initTaxi])

  const loadAccs = async () => {
    setLoadingA(true)
    try { const d = await paymentAccounts.list(); setAccs(Array.isArray(d) ? d : []) }
    catch { setAccs([]) }
    finally { setLoadingA(false) }
  }

  const loadPaidDates = useCallback(async (taxiId: string) => {
    try {
      const now = new Date()
      const res = await dailyPayments.getPaidDates({ taxiId, year: now.getFullYear(), month: now.getMonth() + 1 })
      setPaidDates(Array.isArray(res) ? res : Array.isArray(res?.dates) ? res.dates : [])
    } catch { setPaidDates([]) }
  }, [])

  const handleTaxiSelect = useCallback((t: Taxi) => {
    setSelTaxi(t)
    setAmt(String(t.dailyRate || ''))
    setShowTp(false)
    loadPaidDates(t._id)
  }, [loadPaidDates])

  useEffect(() => {
    if (initTaxi) loadPaidDates(initTaxi._id)
  }, [initTaxi])

  const days = dr.from && dr.to ? Math.round((new Date(dr.to).getTime() - new Date(dr.from).getTime()) / 86400000) + 1 : 0
  const total = (parseFloat(amt || '0') || (selTaxi?.dailyRate || 0)) * days
  const filtered = useMemo(() => accs.filter(a => a.isActive && a.method === method), [accs, method])

  const pick = useCallback(async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!p.granted) { toast.error('Permission needed', 'Allow access to photos'); return }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 })
    if (!r.canceled) setProof(r.assets[0].uri)
  }, [])

  const snap = useCallback(async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync()
    if (!p.granted) { toast.error('Permission needed', 'Allow camera access'); return }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 })
    if (!r.canceled) setProof(r.assets[0].uri)
  }, [])

  const handleRec = useCallback(async () => {
    if (!selTaxi || !dr.from || !dr.to) { toast.error('Missing', 'Select taxi and date range'); return }
    setLoading(true)
    try {
      const p: any = { taxiId: selTaxi._id, fromDate: dr.from, toDate: dr.to, paymentMethod: method, notes: nts.trim() || undefined }
      if (method !== 'cash' && selAcc) p.paymentAccount = selAcc
      else if (method !== 'cash' && filtered.length > 0) p.paymentAccount = filtered[0]._id
      if (proof) {
        const fd = new FormData()
        const fn = proof.split('/').pop() || 'proof.jpg'
        fd.append('proofImage', { uri: proof, name: fn, type: fn.endsWith('.png') ? 'image/png' : 'image/jpeg' } as any)
        fd.append('taxiId', selTaxi._id); fd.append('fromDate', dr.from); fd.append('toDate', dr.to)
        fd.append('paymentMethod', method); if (nts.trim()) fd.append('notes', nts.trim())
        if (p.paymentAccount) fd.append('paymentAccount', p.paymentAccount)
        await dailyPayments.recordRange(fd)
      } else {
        await dailyPayments.recordRange(p)
      }
      toast.success('Success', `Payment recorded for ${days} day(s)`); onSuccess?.(); onClose()
    } catch (e: any) { toast.error('Error', e?.response?.data?.message || e?.message || 'Failed') }
    finally { setLoading(false) }
  }, [selTaxi, dr, method, selAcc, nts, proof, days])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalTop}>
            <View style={styles.modalTopL}>
              <MaterialCommunityIcons name="cash-check" size={22} color={colors.primary} />
              <Text style={styles.modalTitle}>Record Payment</Text>
            </View>
            <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={22} color={colors.textTertiary} /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
            {/* Taxi display */}
            <Text style={styles.fl}>Taxi</Text>
            {initTaxi ? (
              <View style={styles.taxiDisplay}>
                <MaterialCommunityIcons name="car" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taxiPlate}>{selTaxi?.plateNumber}</Text>
                  <Text style={styles.taxiDriver}>{selTaxi?.assignedDriver?.name || 'No driver'} — {fmt(selTaxi?.dailyRate || 0)}/d</Text>
                </View>
                <TouchableOpacity onPress={() => setShowTp(true)}><MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} /></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.taxiSel} onPress={() => setShowTp(true)}>
                <MaterialCommunityIcons name="car" size={18} color={selTaxi ? colors.primary : colors.textTertiary} />
                <Text style={[styles.taxiSelT, !selTaxi && { color: colors.textTertiary }]}>
                  {selTaxi ? `${selTaxi.plateNumber} — ${selTaxi.assignedDriver?.name || 'No driver'} (${fmt(selTaxi.dailyRate)}/d)` : 'Select taxi'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}

            {/* Payment summary */}
            {selTaxi && paidDates.length > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{paidDates.length} date{paidDates.length > 1 ? 's' : ''} already paid this month</Text>
              </View>
            )}

            {/* Date Range */}
            <View style={styles.div} />
            <NepaliDateRangePicker
              value={dr}
              onChange={setDr}
              showQuickSelect
              label="Payment dates *"
              paidDates={paidDates}
            />

            {/* Amount */}
            <Text style={styles.fl}>Amount per day (₹)</Text>
            <TextInput style={styles.inp} value={amt} onChangeText={setAmt} keyboardType="decimal-pad" placeholder="Auto from taxi rate" placeholderTextColor={colors.textTertiary} />
            {days > 0 && <Text style={styles.totalT}>Total: {fmt(total)} ({days} day{days > 1 ? 's' : ''})</Text>}

            {/* Method */}
            <View style={styles.div} />
            <Text style={styles.fl}>Payment method *</Text>
            <View style={styles.mRow}>
              {['cash', 'esewa', 'bank_transfer'].map(m => (
                <TouchableOpacity key={m} style={[styles.mBtn, method === m && styles.mBtnA]} onPress={() => { setMethod(m); setSelAcc('') }}>
                  <MaterialCommunityIcons name={m === 'cash' ? 'cash' : m === 'esewa' ? 'wallet' : 'bank'} size={16} color={method === m ? colors.textInverse : colors.textSecondary} />
                  <Text style={[styles.mBtnT, method === m && styles.mBtnTA]}>{m.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Account */}
            {method !== 'cash' && (
              <View>
                <Text style={styles.fl}>Account</Text>
                {loadingA ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} /> :
                  filtered.length === 0 ? <Text style={styles.noAcc}>No {method} accounts. Add one in Accounts screen.</Text> :
                  <View style={styles.aRow}>
                    {filtered.map(a => (
                      <TouchableOpacity key={a._id} style={[styles.aBtn, selAcc === a._id && styles.aBtnA]} onPress={() => setSelAcc(a._id)}>
                        <Text style={[styles.aBtnT, selAcc === a._id && styles.aBtnTA]}>{a.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                }
              </View>
            )}

            {/* Proof */}
            <View style={styles.div} />
            <Text style={styles.fl}>Proof (optional)</Text>
            <View style={styles.pRow}>
              <TouchableOpacity style={styles.pBtn} onPress={pick}><MaterialCommunityIcons name="image" size={18} color={colors.primary} /><Text style={styles.pBtnT}>Gallery</Text></TouchableOpacity>
              <TouchableOpacity style={styles.pBtn} onPress={snap}><MaterialCommunityIcons name="camera" size={18} color={colors.primary} /><Text style={styles.pBtnT}>Camera</Text></TouchableOpacity>
              {proof && <TouchableOpacity style={styles.pBtn} onPress={() => setProof(null)}><MaterialCommunityIcons name="close-circle" size={18} color={colors.danger} /><Text style={[styles.pBtnT, { color: colors.danger }]}>Remove</Text></TouchableOpacity>}
            </View>
            {proof && <Text style={styles.proofName}>{proof.split('/').pop()}</Text>}

            {/* Notes */}
            <View style={styles.div} />
            <Text style={styles.fl}>Notes</Text>
            <TextInput style={[styles.inp, styles.txtA]} value={nts} onChangeText={setNts} placeholder="Optional notes" placeholderTextColor={colors.textTertiary} multiline />

            {/* Submit */}
            <View style={styles.actRow}>
              <TouchableOpacity style={styles.canBtn} onPress={onClose}><Text style={styles.canBtnT}>Cancel</Text></TouchableOpacity>
              <View style={{ flex: 1 }}><GradientButton
                title={loading ? 'Recording...' : `Record ${days} day(s) — ${fmt(total)}`}
                icon="cash-check" loading={loading} onPress={handleRec}
                disabled={!selTaxi || !dr.from || !dr.to || days === 0}
              /></View>
            </View>
          </ScrollView>
        </View>

        <Modal visible={showTp} transparent animationType="fade" onRequestClose={() => setShowTp(false)}>
          <View style={styles.subOverlay}>
            <View style={styles.subModal}>
              <Text style={styles.subTitle}>Select Taxi</Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {taxisList.length === 0 ? <Text style={styles.noAcc}>No taxis available</Text> :
                  taxisList.map(t => (
                    <TouchableOpacity key={t._id} style={styles.tpOpt} onPress={() => handleTaxiSelect(t)}>
                      <MaterialCommunityIcons name="car" size={20} color={colors.primary} />
                      <View style={{ flex: 1 }}><Text style={styles.tpPlate}>{t.plateNumber}</Text><Text style={styles.tpDriver}>{t.assignedDriver?.name || 'No driver'}</Text></View>
                      <Text style={styles.tpRate}>{fmt(t.dailyRate)}/d</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              <TouchableOpacity style={styles.canBtn2} onPress={() => setShowTp(false)}><Text style={styles.canBtnT2}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, maxHeight: '92%', paddingBottom: 40 },
  modalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTopL: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  fl: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.xs },
  taxiDisplay: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, gap: spacing.sm },
  taxiPlate: { fontSize: 15, fontWeight: '600', color: colors.text },
  taxiDriver: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  taxiSel: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, gap: spacing.sm },
  taxiSelT: { flex: 1, fontSize: 14, color: colors.text },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.sm },
  summaryText: { fontSize: 12, color: colors.success, fontWeight: '500' },
  inp: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceSecondary },
  txtA: { minHeight: 80, textAlignVertical: 'top' },
  div: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.md },
  totalT: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  mRow: { flexDirection: 'row', gap: spacing.sm },
  mBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  mBtnA: { backgroundColor: colors.primary, borderColor: colors.primary },
  mBtnT: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  mBtnTA: { color: colors.textInverse },
  aRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  aBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  aBtnA: { backgroundColor: colors.primary, borderColor: colors.primary },
  aBtnT: { fontSize: 13, color: colors.textSecondary },
  aBtnTA: { color: colors.textInverse, fontWeight: '600' },
  noAcc: { color: colors.textTertiary, fontSize: 13, fontStyle: 'italic', paddingVertical: spacing.sm },
  pRow: { flexDirection: 'row', gap: spacing.sm },
  pBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border },
  pBtnT: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  proofName: { fontSize: 11, color: colors.textTertiary, marginTop: spacing.xs },
  actRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  canBtn: { paddingHorizontal: spacing.xl, justifyContent: 'center', borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border },
  canBtnT: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  canBtn2: { paddingVertical: 12, alignItems: 'center', marginTop: spacing.md },
  canBtnT2: { fontSize: 14, fontWeight: '500', color: colors.textTertiary },
  subOverlay: { flex: 1, justifyContent: 'center', backgroundColor: colors.overlay, padding: spacing.xxl },
  subModal: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxl, maxHeight: '80%' },
  subTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  tpOpt: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tpPlate: { fontSize: 15, fontWeight: '600', color: colors.text },
  tpDriver: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  tpRate: { fontSize: 13, fontWeight: '600', color: colors.success },
})
