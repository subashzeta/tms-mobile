import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { expenditure, extraPayments, leaves, taxis, paymentAccounts } from '../api/endpoints'
import { FormFileUpload } from '../components/FormFileUpload'
import NepaliDateRangePicker, { DateRange } from '../components/NepaliDateRangePicker'
import { useToast } from './Toast'
import { colors, spacing, borderRadius, shadow } from '../theme'
import type { Taxi, PaymentAccount, ApiResponse } from '../types'

const CATEGORIES = ['fuel', 'repair', 'maintenance', 'other']
const catIcons: Record<string, string> = { fuel: 'fuel', repair: 'wrench', maintenance: 'tools', other: 'dots-horizontal' }

/* ───────── Expenditure Modal ───────── */
export function ExpenditureModal({ visible, taxiId, onClose, onDone }: { visible: boolean; taxiId: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [cat, setCat] = useState('fuel')
  const [amt, setAmt] = useState('')
  const [dr, setDr] = useState<DateRange>({ from: '', to: '' })
  const [vendor, setVendor] = useState('')
  const [odometer, setOdometer] = useState('')
  const [desc, setDesc] = useState('')
  const [receipt, setReceipt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [accs, setAccs] = useState<PaymentAccount[]>([])
  const [method, setMethod] = useState('cash')
  const [selAcc, setSelAcc] = useState('')

  useEffect(() => {
    if (visible) {
      setTitle(''); setCat('fuel'); setAmt(''); setDr({ from: '', to: '' })
      setVendor(''); setOdometer(''); setDesc(''); setReceipt(null)
      setMethod('cash'); setSelAcc('')
      paymentAccounts.list().then(d => setAccs(Array.isArray(d) ? d : [])).catch(() => {})
    }
  }, [visible])

  const filteredAccs = accs.filter(a => a.isActive && a.method === method)

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Error', 'Title is required'); return }
    if (!amt || parseFloat(amt) <= 0) { toast.error('Error', 'Enter a valid amount'); return }
    if (!dr.from) { toast.error('Error', 'Select a date'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('taxi', taxiId)
      fd.append('title', title.trim())
      fd.append('category', cat)
      fd.append('amount', amt)
      fd.append('date', dr.from)
      if (vendor.trim()) fd.append('vendor', vendor.trim())
      if (odometer.trim()) fd.append('odometer', odometer.trim())
      if (desc.trim()) fd.append('description', desc.trim())
      fd.append('paymentMethod', method)
      if (method !== 'cash' && selAcc) fd.append('paymentAccount', selAcc)
      if (receipt) {
        const filename = receipt.split('/').pop() || 'receipt.jpg'
        fd.append('receipt', { uri: receipt, name: filename, type: 'image/jpeg' } as any)
      }
      await expenditure.create(fd)
      toast.success('Success', 'Expense recorded')
      onDone(); onClose()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <View style={mStyles.sheetHeader}>
            <View style={[mStyles.sheetIcon, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="cash-remove" size={16} color={colors.danger} />
            </View>
            <Text style={mStyles.sheetTitle}>Record Expense</Text>
            <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}><MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
            <Text style={mStyles.label}>Title *</Text>
            <TextInput style={mStyles.input} value={title} onChangeText={setTitle} placeholder="e.g. Fuel refill" placeholderTextColor={colors.textTertiary} />

            <Text style={mStyles.label}>Category *</Text>
            <View style={mStyles.chipRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[mStyles.chip, cat === c && mStyles.chipActive]} onPress={() => setCat(c)}>
                  <MaterialCommunityIcons name={(catIcons[c] || 'circle') as any} size={12} color={cat === c ? colors.textInverse : colors.textSecondary} />
                  <Text style={[mStyles.chipText, cat === c && mStyles.chipTextActive]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={mStyles.label}>Amount (₹) *</Text>
            <TextInput style={mStyles.input} value={amt} onChangeText={setAmt} placeholder="e.g. 1500" placeholderTextColor={colors.textTertiary} keyboardType="decimal-pad" />

            <NepaliDateRangePicker value={dr} onChange={setDr} showQuickSelect={false} label="Date *" />

            <Text style={mStyles.label}>Payment Method</Text>
            <View style={mStyles.chipRow}>
              {['cash', 'esewa', 'bank_transfer'].map(m => (
                <TouchableOpacity key={m} style={[mStyles.chip, method === m && mStyles.chipActive]} onPress={() => { setMethod(m); setSelAcc('') }}>
                  <Text style={[mStyles.chipText, method === m && mStyles.chipTextActive]}>{m === 'bank_transfer' ? 'Bank' : m === 'esewa' ? 'eSewa' : 'Cash'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {method !== 'cash' && filteredAccs.length > 0 && (
              <View style={mStyles.chipRow}>
                {filteredAccs.map(a => (
                  <TouchableOpacity key={a._id} style={[mStyles.chip, selAcc === a._id && mStyles.chipActive]} onPress={() => setSelAcc(a._id)}>
                    <Text style={[mStyles.chipText, selAcc === a._id && mStyles.chipTextActive]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={mStyles.label}>Vendor</Text>
            <TextInput style={mStyles.input} value={vendor} onChangeText={setVendor} placeholder="Vendor name" placeholderTextColor={colors.textTertiary} />

            <Text style={mStyles.label}>Odometer</Text>
            <TextInput style={mStyles.input} value={odometer} onChangeText={setOdometer} placeholder="Odometer reading" placeholderTextColor={colors.textTertiary} keyboardType="numeric" />

            <Text style={mStyles.label}>Description</Text>
            <TextInput style={[mStyles.input, { minHeight: 50 }]} value={desc} onChangeText={setDesc} placeholder="Optional description" placeholderTextColor={colors.textTertiary} multiline />

            <FormFileUpload label="Attach Receipt" value={receipt} onChange={setReceipt} />

            <TouchableOpacity style={[mStyles.submitBtn, loading && { opacity: 0.6 }]} disabled={loading} onPress={handleSubmit}>
              {loading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={mStyles.submitText}>Record Expense</Text>}
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

/* ───────── Extra Payment Modal ───────── */
export function ExtraPaymentModal({ visible, taxiId, onClose, onDone }: { visible: boolean; taxiId: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [amt, setAmt] = useState('')
  const [dr, setDr] = useState<DateRange>({ from: '', to: '' })
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [proof, setProof] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      setAmt(''); setDr({ from: '', to: '' }); setReason(''); setNotes(''); setProof(null)
    }
  }, [visible])

  const handleSubmit = async () => {
    if (!amt || parseFloat(amt) <= 0) { toast.error('Error', 'Enter a valid amount'); return }
    if (!reason.trim()) { toast.error('Error', 'Enter a reason'); return }
    setLoading(true)
    try {
      await extraPayments.create({
        taxi: taxiId,
        amount: parseFloat(amt),
        paymentDate: dr.from || new Date().toISOString().slice(0, 10),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      })
      toast.success('Success', 'Extra payment recorded')
      onDone(); onClose()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <View style={mStyles.sheetHeader}>
            <View style={[mStyles.sheetIcon, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="cash-plus" size={16} color={colors.warning} />
            </View>
            <Text style={mStyles.sheetTitle}>Extra Payment</Text>
            <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}><MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
            <Text style={mStyles.label}>Amount (₹) *</Text>
            <TextInput style={mStyles.input} value={amt} onChangeText={setAmt} placeholder="e.g. 1000" placeholderTextColor={colors.textTertiary} keyboardType="decimal-pad" />

            <NepaliDateRangePicker value={dr} onChange={setDr} showQuickSelect={false} label="Date" />

            <Text style={mStyles.label}>Reason *</Text>
            <TextInput style={mStyles.input} value={reason} onChangeText={setReason} placeholder="e.g. Overtime, Incentive" placeholderTextColor={colors.textTertiary} />

            <Text style={mStyles.label}>Notes</Text>
            <TextInput style={[mStyles.input, { minHeight: 50 }]} value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor={colors.textTertiary} multiline />

            <FormFileUpload label="Attach Proof" value={proof} onChange={setProof} />

            <TouchableOpacity style={[mStyles.submitBtn, { backgroundColor: colors.warning }, loading && { opacity: 0.6 }]} disabled={loading} onPress={handleSubmit}>
              {loading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={mStyles.submitText}>Record Extra Payment</Text>}
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

/* ───────── Leave Modal ───────── */
export function LeaveModal({ visible, taxiId, onClose, onDone }: { visible: boolean; taxiId: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [dr, setDr] = useState<DateRange>({ from: '', to: '' })
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [taxiObj, setTaxiObj] = useState<Taxi | null>(null)

  useEffect(() => {
    if (visible && taxiId) {
      setDr({ from: '', to: '' }); setReason('')
      taxis.list().then((r: any) => {
        const list: Taxi[] = r?.data ?? (Array.isArray(r) ? r : [])
        setTaxiObj(list.find((t: Taxi) => t._id === taxiId) || null)
      }).catch(() => {})
    }
  }, [visible, taxiId])

  const driverName = taxiObj?.assignedDriver?.name || ''
  const driverId = taxiObj?.assignedDriver?._id || ''
  const days = dr.from && dr.to ? Math.round((new Date(dr.to).getTime() - new Date(dr.from).getTime()) / 86400000) + 1 : dr.from ? 1 : 0

  const handleSubmit = async () => {
    if (!dr.from) { toast.error('Error', 'Select a date'); return }
    if (!driverId) { toast.error('Error', 'No driver assigned to this taxi'); return }
    setLoading(true)
    try {
      if (days > 1) {
        const dates: any[] = []
        const d = new Date(dr.from)
        while (d <= new Date(dr.to)) {
          dates.push({ date: d.toISOString().split('T')[0], reason: reason.trim() || undefined })
          d.setDate(d.getDate() + 1)
        }
        await leaves.batchCreate(dates, taxiId, driverId)
      } else {
        await leaves.create(dr.from, reason.trim() || undefined, taxiId, driverId)
      }
      toast.success('Success', `Leave recorded for ${days > 1 ? `${days} days` : dr.from}`)
      onDone(); onClose()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <View style={mStyles.sheetHeader}>
            <View style={[mStyles.sheetIcon, { backgroundColor: '#FCE7F3' }]}>
              <MaterialCommunityIcons name="calendar-remove" size={16} color={colors.pink} />
            </View>
            <Text style={mStyles.sheetTitle}>Mark Leave</Text>
            <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}><MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
            {driverName ? (
              <View style={mStyles.driverRow}>
                <MaterialCommunityIcons name="account-check" size={14} color={colors.success} />
                <Text style={mStyles.driverText}>Driver: {driverName}</Text>
              </View>
            ) : (
              <View style={[mStyles.driverRow, { backgroundColor: colors.dangerLight }]}>
                <MaterialCommunityIcons name="account-alert" size={14} color={colors.danger} />
                <Text style={[mStyles.driverText, { color: colors.danger }]}>No driver assigned</Text>
              </View>
            )}

            <NepaliDateRangePicker value={dr} onChange={setDr} showQuickSelect label="Leave dates *" />
            {days > 0 && <Text style={{ fontSize: 12, color: colors.pink, fontWeight: '600', marginTop: spacing.xs }}>{days} day{days > 1 ? 's' : ''}</Text>}

            <Text style={mStyles.label}>Reason</Text>
            <TextInput style={[mStyles.input, { minHeight: 50 }]} value={reason} onChangeText={setReason} placeholder="e.g. Public holiday" placeholderTextColor={colors.textTertiary} multiline />

            <TouchableOpacity style={[mStyles.submitBtn, { backgroundColor: colors.pink }, loading && { opacity: 0.6 }]} disabled={loading} onPress={handleSubmit}>
              {loading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={mStyles.submitText}>Mark Leave{days > 0 ? ` (${days} day${days > 1 ? 's' : ''})` : ''}</Text>}
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

/* ───────── Shared Styles ───────── */
const mStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sheetIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: colors.text, backgroundColor: colors.surfaceSecondary, minHeight: 36, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  submitBtn: { marginTop: spacing.md, paddingVertical: 12, borderRadius: borderRadius.sm, backgroundColor: colors.danger, alignItems: 'center' },
  submitText: { fontSize: 13, fontWeight: '700', color: colors.textInverse },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successLight, padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
  driverText: { fontSize: 12, fontWeight: '600', color: colors.text },
})
