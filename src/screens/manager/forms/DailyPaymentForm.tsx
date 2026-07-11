import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { GradientHeader } from '../../../components/GradientHeader'
import { dailyPayments, taxis, paymentAccounts } from '../../../api/endpoints'
import type { Taxi, PaymentAccount, ApiResponse } from '../../../types'
import NepaliDateRangePicker, { DateRange } from '../../../components/NepaliDateRangePicker'
import { GradientButton } from '../../../components/GradientButton'
import { colors, gradients, spacing, borderRadius, typography } from '../../../theme'

function fmt(n: number | null | undefined) { if (n == null) return '₹ 0'; return '₹ ' + n.toLocaleString('en-IN') }

export default function DailyPaymentForm() {
  const nav = useNavigation()
  const [taxisList, setTaxisList] = useState<Taxi[]>([])
  const [selTaxi, setSelTaxi] = useState<string>('')
  const [dr, setDr] = useState<DateRange>({ from: '', to: '' })
  const [amt, setAmt] = useState('')
  const [method, setMethod] = useState('cash')
  const [accs, setAccs] = useState<PaymentAccount[]>([])
  const [selAcc, setSelAcc] = useState('')
  const [nts, setNts] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingT, setLoadingT] = useState(true)
  const [loadingA, setLoadingA] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    taxis.list({ isActive: true }).then(r => setTaxisList((r as ApiResponse<Taxi[]>).data ?? [])).catch(() => Alert.alert('Error', 'Failed to load taxis')).finally(() => setLoadingT(false))
    setLoadingA(true); paymentAccounts.list().then(d => setAccs(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingA(false))
  }, [])

  const days = dr.from && dr.to ? Math.round((new Date(dr.to).getTime() - new Date(dr.from).getTime()) / 86400000) + 1 : 0
  const total = (parseFloat(amt || '0') || 0) * days
  const filtered = useMemo(() => accs.filter(a => a.isActive && a.method === method), [accs, method])

  const selTaxiObj = useMemo(() => taxisList.find(t => t._id === selTaxi), [selTaxi, taxisList])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selTaxi) e.selTaxi = 'Select a taxi'
    if (!dr.from || !dr.to) e.dr = 'Select date range'
    if (!amt || parseFloat(amt) <= 0) e.amt = 'Amount must be > 0'
    if (method !== 'cash' && !selAcc) e.selAcc = 'Select an account'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await dailyPayments.record({
        taxiId: selTaxi, dateRangeStart: dr.from, dateRangeEnd: dr.to,
        amountDue: parseFloat(amt), amountPaid: parseFloat(amt),
        paymentMethod: method, paymentAccount: method !== 'cash' && selAcc ? selAcc : undefined,
        notes: nts.trim() || undefined, date: dr.from,
      })
      Alert.alert('Success', `Payment recorded for ${days} day(s)`); nav.goBack()
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.c} edges={['bottom']}>
      <GradientHeader title="Record Payment" subtitle="Add a new daily payment" icon="cash-multiple" />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.sc} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          {/* Taxi */}
          <Text style={styles.fl}>Taxi *</Text>
          {loadingT ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} /> :
            <View style={[styles.pRow, errors.selTaxi && styles.pRowE]}>
              {taxisList.map(t => (
                <TouchableOpacity key={t._id} style={[styles.pItem, selTaxi === t._id && styles.pItemS]}
                  onPress={() => { setSelTaxi(t._id); setAmt(String(t.dailyRate || '')); setErrors(p => ({ ...p, selTaxi: '' })) }}>
                  <Text style={[styles.pText, selTaxi === t._id && styles.pTextS]}>{t.plateNumber} {t.assignedDriver?.name ? `- ${t.assignedDriver.name}` : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>}
          {errors.selTaxi ? <Text style={styles.err}>{errors.selTaxi}</Text> : null}

          {/* Date Range */}
          <NepaliDateRangePicker value={dr} onChange={setDr} showQuickSelect label="Payment dates *" />
          {errors.dr ? <Text style={styles.err}>{errors.dr}</Text> : null}
          {days > 0 && <Text style={styles.dayC}>{days} day{days > 1 ? 's' : ''} selected</Text>}

          {/* Daily Amount */}
          <Text style={styles.fl}>Amount per day (₹) *</Text>
          <TextInput style={[styles.inp, errors.amt && styles.inpE]} value={amt} onChangeText={v => { setAmt(v); setErrors(p => ({ ...p, amt: '' })) }} keyboardType="decimal-pad" placeholder="Auto from taxi rate" placeholderTextColor={colors.textTertiary} />
          {errors.amt ? <Text style={styles.err}>{errors.amt}</Text> : null}
          {days > 0 && <Text style={styles.total}>Total: {fmt(total)}</Text>}

          {/* Method */}
          <Text style={[styles.fl, { marginTop: spacing.xl }]}>Payment method *</Text>
          <View style={styles.mRow}>
            {['cash', 'esewa', 'bank_transfer'].map(m => (
              <TouchableOpacity key={m} style={[styles.mBtn, method === m && styles.mBtnA]} onPress={() => { setMethod(m); setSelAcc('') }}>
                <MaterialCommunityIcons name={m === 'cash' ? 'cash' : m === 'esewa' ? 'wallet' : 'bank'} size={16} color={method === m ? colors.textInverse : colors.textSecondary} />
                <Text style={[styles.mText, method === m && styles.mTextA]}>{m.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Account */}
          {method !== 'cash' && (
            <View>
              <Text style={styles.fl}>Account *</Text>
              {loadingA ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} /> :
                filtered.length === 0 ? <Text style={styles.noAcc}>No {method} accounts. Add one in Accounts screen.</Text> :
                <View style={styles.aRow}>
                  {filtered.map(a => (
                    <TouchableOpacity key={a._id} style={[styles.aBtn, selAcc === a._id && styles.aBtnA]} onPress={() => { setSelAcc(a._id); setErrors(p => ({ ...p, selAcc: '' })) }}>
                      <Text style={[styles.aText, selAcc === a._id && styles.aTextA]}>{a.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              }
              {errors.selAcc ? <Text style={styles.err}>{errors.selAcc}</Text> : null}
            </View>
          )}

          {/* Notes */}
          <Text style={styles.fl}>Notes</Text>
          <TextInput style={[styles.inp, styles.txtA]} value={nts} onChangeText={setNts} placeholder="Optional notes" placeholderTextColor={colors.textTertiary} multiline />

          <GradientButton title={loading ? 'Recording...' : `Record Payment — ${fmt(total)}`} icon="cash-check" loading={loading} onPress={handleSubmit} style={{ marginTop: spacing.xxl }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  h: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomLeftRadius: borderRadius.xxl, borderBottomRightRadius: borderRadius.xxl },
  hT: { fontSize: 20, fontWeight: '700', color: colors.textInverse },
  sc: { padding: spacing.lg, paddingBottom: 120, flexGrow: 1 },
  fl: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  inp: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceSecondary },
  inpE: { borderColor: colors.danger },
  txtA: { minHeight: 80, textAlignVertical: 'top' },
  err: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  pRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pRowE: { borderWidth: 1, borderColor: colors.danger, borderRadius: borderRadius.md, padding: spacing.xs },
  pItem: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pItemS: { backgroundColor: colors.primary, borderColor: colors.primary },
  pText: { fontSize: 13, color: colors.textSecondary },
  pTextS: { color: colors.textInverse, fontWeight: '600' },
  dayC: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  total: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  mRow: { flexDirection: 'row', gap: spacing.sm },
  mBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  mBtnA: { backgroundColor: colors.primary, borderColor: colors.primary },
  mText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  mTextA: { color: colors.textInverse },
  aRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  aBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  aBtnA: { backgroundColor: colors.primary, borderColor: colors.primary },
  aText: { fontSize: 13, color: colors.textSecondary },
  aTextA: { color: colors.textInverse, fontWeight: '600' },
  noAcc: { color: colors.textTertiary, fontSize: 13, fontStyle: 'italic', paddingVertical: spacing.sm },
})
