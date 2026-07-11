import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GradientHeader } from '../../../components/GradientHeader'
import { extraPayments, taxis } from '../../../api/endpoints'
import type { Taxi, ApiResponse } from '../../../types'
import { GradientButton } from '../../../components/GradientButton'
import { colors, gradients, spacing, borderRadius, typography } from '../../../theme'

export default function ExtraPaymentForm() {
  const navigation = useNavigation()
  const route = useRoute<any>()
  const preselectedTaxi = route.params?.taxiId || ''
  const [taxisList, setTaxisList] = useState<Taxi[]>([])
  const [selectedTaxi, setSelectedTaxi] = useState<string>(preselectedTaxi)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTaxis, setLoadingTaxis] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    taxis.list().then(res => setTaxisList((res as ApiResponse<Taxi[]>).data ?? []))
      .catch(() => Alert.alert('Error', 'Failed to load taxis')).finally(() => setLoadingTaxis(false))
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedTaxi) e.selectedTaxi = 'Please select a taxi'
    if (!amount || parseFloat(amount) <= 0) e.amount = 'Amount must be greater than 0'
    if (!reason.trim()) e.reason = 'Please enter a reason'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await extraPayments.create({ taxi: selectedTaxi, amount: parseFloat(amount), paymentDate: date, reason: reason.trim() || undefined, notes: notes.trim() || undefined })
      Alert.alert('Success', 'Extra payment recorded successfully'); navigation.goBack()
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to record extra payment') }
    finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader title="Extra Payment" subtitle="Additional payment for drivers" icon="cash-plus" gradient={gradients.warning} />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Taxi *</Text>
          {loadingTaxis ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} /> : (
            <View style={[styles.pickerRow, errors.selectedTaxi ? styles.pickerRowError : null]}>
              {taxisList.filter(t => t.isActive).map(t => (
                <TouchableOpacity key={t._id} style={[styles.pickerItem, selectedTaxi === t._id && styles.pickerItemSelected]}
                  onPress={() => { setSelectedTaxi(t._id); setErrors(prev => ({ ...prev, selectedTaxi: '' })) }}>
                  <Text style={[styles.pickerText, selectedTaxi === t._id && styles.pickerTextSelected]}>{t.plateNumber}</Text>
                </TouchableOpacity>
              ))}
              {taxisList.filter(t => t.isActive).length === 0 && <Text style={styles.emptyText}>No active taxis available</Text>}
            </View>
          )}
          {errors.selectedTaxi ? <Text style={styles.errorText}>{errors.selectedTaxi}</Text> : null}

          <Text style={styles.label}>Amount (₹) *</Text>
          <TextInput style={[styles.input, errors.amount ? styles.inputError : null]} value={amount} onChangeText={(v) => { setAmount(v); setErrors(prev => ({ ...prev, amount: '' })) }} placeholder="e.g. 1000" placeholderTextColor={colors.textTertiary} keyboardType="decimal-pad" />
          {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

          <Text style={styles.label}>Date</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />

          <Text style={styles.label}>Reason *</Text>
          <TextInput style={[styles.input, errors.reason ? styles.inputError : null]} value={reason} onChangeText={(v) => { setReason(v); setErrors(prev => ({ ...prev, reason: '' })) }} placeholder="e.g. Overtime, Incentive" placeholderTextColor={colors.textTertiary} />
          {errors.reason ? <Text style={styles.errorText}>{errors.reason}</Text> : null}

          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor={colors.textTertiary} multiline numberOfLines={3} />

          <GradientButton title={loading ? 'Recording...' : 'Record Extra Payment'} icon="cash-plus" loading={loading} onPress={handleSubmit} gradient={gradients.warning} style={{ marginTop: spacing.xxl }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 120, flexGrow: 1 },
  label: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceSecondary },
  inputError: { borderColor: colors.danger },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pickerRowError: { borderWidth: 1, borderColor: colors.danger, borderRadius: borderRadius.md, padding: spacing.xs },
  pickerItem: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pickerItemSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pickerText: { fontSize: 13, color: colors.textSecondary },
  pickerTextSelected: { color: colors.textInverse, fontWeight: '600' },
  emptyText: { color: colors.textTertiary, fontSize: 13, fontStyle: 'italic' },
})
