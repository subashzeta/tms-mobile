import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { GradientHeader } from '../../../components/GradientHeader'
import { expenditure, taxis, paymentAccounts } from '../../../api/endpoints'
import type { Taxi, PaymentAccount, ApiResponse } from '../../../types'
import NepaliDateRangePicker, { DateRange } from '../../../components/NepaliDateRangePicker'
import { GradientButton } from '../../../components/GradientButton'
import { colors, gradients, spacing, borderRadius, typography } from '../../../theme'

const CATEGORIES = ['fuel', 'repair', 'maintenance', 'other']
const catIcons: Record<string, string> = { fuel: 'fuel', repair: 'wrench', maintenance: 'tools', other: 'dots-horizontal' }

export default function ExpenditureForm() {
  const nav = useNavigation()
  const route = useRoute<any>()
  const preselectedTaxi = route.params?.taxiId || ''
  const [taxisList, setTaxisList] = useState<Taxi[]>([])
  const [selTaxi, setSelTaxi] = useState<string>(preselectedTaxi)
  const [cat, setCat] = useState('fuel')
  const [amt, setAmt] = useState('')
  const [dr, setDr] = useState<DateRange>({ from: '', to: '' })
  const [vendor, setVendor] = useState('')
  const [desc, setDesc] = useState('')
  const [nts, setNts] = useState('')
  const [method, setMethod] = useState('cash')
  const [accs, setAccs] = useState<PaymentAccount[]>([])
  const [selAcc, setSelAcc] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingT, setLoadingT] = useState(true)
  const [loadingA, setLoadingA] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    taxis.list().then(r => setTaxisList((r as ApiResponse<Taxi[]>).data ?? [])).catch(() => Alert.alert('Error', 'Failed to load taxis')).finally(() => setLoadingT(false))
    setLoadingA(true); paymentAccounts.list().then(d => setAccs(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingA(false))
  }, [])

  const filtered = useMemo(() => accs.filter(a => a.isActive && a.method === method), [accs, method])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selTaxi) e.selTaxi = 'Select a taxi'
    if (!amt || parseFloat(amt) <= 0) e.amt = 'Amount must be > 0'
    if (!dr.from) e.dr = 'Select date'
    if (method !== 'cash' && !selAcc) e.selAcc = 'Select an account'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await expenditure.create({
        taxi: selTaxi, category: cat, amount: parseFloat(amt), date: dr.from,
        vendor: vendor.trim() || undefined, description: desc.trim() || undefined,
        paymentMethod: method, paymentAccount: method !== 'cash' && selAcc ? selAcc : undefined,
      })
      Alert.alert('Success', 'Expense recorded'); nav.goBack()
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.c} edges={['bottom']}>
      <GradientHeader title="Record Expense" subtitle="Track expenditure" icon="cash-remove" gradient={gradients.danger} />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.sc} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <Text style={styles.fl}>Taxi *</Text>
          {loadingT ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} /> :
            <View style={[styles.pRow, errors.selTaxi && styles.pRowE]}>
              {taxisList.filter(t => t.isActive).map(t => (
                <TouchableOpacity key={t._id} style={[styles.pItem, selTaxi === t._id && styles.pItemS]}
                  onPress={() => { setSelTaxi(t._id); setErrors(p => ({ ...p, selTaxi: '' })) }}>
                  <Text style={[styles.pText, selTaxi === t._id && styles.pTextS]}>{t.plateNumber}</Text>
                </TouchableOpacity>
              ))}
              {taxisList.filter(t => t.isActive).length === 0 && <Text style={styles.noAcc}>No active taxis</Text>}
            </View>}
          {errors.selTaxi ? <Text style={styles.err}>{errors.selTaxi}</Text> : null}

          <Text style={styles.fl}>Category *</Text>
          <View style={styles.pRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[styles.pItem, cat === c && styles.pItemS]} onPress={() => setCat(c)}>
                <MaterialCommunityIcons name={(catIcons[c] || 'circle') as any} size={14} color={cat === c ? colors.textInverse : colors.textSecondary} />
                <Text style={[styles.pText, cat === c && styles.pTextS]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fl}>Amount (₹) *</Text>
          <TextInput style={[styles.inp, errors.amt && styles.inpE]} value={amt} onChangeText={v => { setAmt(v); setErrors(p => ({ ...p, amt: '' })) }} placeholder="e.g. 1500" placeholderTextColor={colors.textTertiary} keyboardType="decimal-pad" />
          {errors.amt ? <Text style={styles.err}>{errors.amt}</Text> : null}

          <NepaliDateRangePicker value={dr} onChange={setDr} showQuickSelect={false} label="Date *" />
          {errors.dr ? <Text style={styles.err}>{errors.dr}</Text> : null}

          <Text style={styles.fl}>Payment method</Text>
          <View style={styles.mRow}>
            {['cash', 'esewa', 'bank_transfer'].map(m => (
              <TouchableOpacity key={m} style={[styles.mBtn, method === m && styles.mBtnA]} onPress={() => { setMethod(m); setSelAcc('') }}>
                <MaterialCommunityIcons name={m === 'cash' ? 'cash' : m === 'esewa' ? 'wallet' : 'bank'} size={16} color={method === m ? colors.textInverse : colors.textSecondary} />
                <Text style={[styles.mText, method === m && styles.mTextA]}>{m.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {method !== 'cash' && (
            <View>
              <Text style={styles.fl}>Account</Text>
              {loadingA ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} /> :
                filtered.length === 0 ? <Text style={styles.noAcc}>No {method} accounts.</Text> :
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

          <Text style={styles.fl}>Vendor</Text>
          <TextInput style={styles.inp} value={vendor} onChangeText={setVendor} placeholder="Vendor name" placeholderTextColor={colors.textTertiary} />

          <Text style={styles.fl}>Description</Text>
          <TextInput style={[styles.inp, styles.txtA]} value={desc} onChangeText={setDesc} placeholder="Optional description" placeholderTextColor={colors.textTertiary} multiline />

          <Text style={styles.fl}>Notes</Text>
          <TextInput style={[styles.inp, styles.txtA]} value={nts} onChangeText={setNts} placeholder="Optional notes" placeholderTextColor={colors.textTertiary} multiline />

          <GradientButton title={loading ? 'Recording...' : 'Record Expense'} icon="cash-remove" loading={loading} onPress={handleSubmit} gradient={gradients.danger} style={{ marginTop: spacing.xxl }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  sc: { padding: spacing.lg, paddingBottom: 120, flexGrow: 1 },
  fl: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  inp: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceSecondary },
  inpE: { borderColor: colors.danger },
  txtA: { minHeight: 80, textAlignVertical: 'top' },
  err: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  pRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pRowE: { borderWidth: 1, borderColor: colors.danger, borderRadius: borderRadius.md, padding: spacing.xs },
  pItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pItemS: { backgroundColor: colors.primary, borderColor: colors.primary },
  pText: { fontSize: 13, color: colors.textSecondary },
  pTextS: { color: colors.textInverse, fontWeight: '600' },
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
