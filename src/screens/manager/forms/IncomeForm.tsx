import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GradientHeader } from '../../../components/GradientHeader'
import { income, taxis } from '../../../api/endpoints'
import type { Taxi, ApiResponse } from '../../../types'
import { GradientButton } from '../../../components/GradientButton'
import { colors, gradients, spacing, borderRadius, typography } from '../../../theme'

export default function IncomeForm() {
  const navigation = useNavigation()
  const [taxisList, setTaxisList] = useState<Taxi[]>([])
  const [selectedTaxi, setSelectedTaxi] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [shift, setShift] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTaxis, setLoadingTaxis] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    taxis.list({ isActive: true }).then(res => setTaxisList((res as ApiResponse<Taxi[]>).data ?? []))
      .catch(() => Alert.alert('Error', 'Failed to load taxis')).finally(() => setLoadingTaxis(false))
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selectedTaxi) e.selectedTaxi = 'Select a taxi'
    if (!amount || parseFloat(amount) <= 0) e.amount = 'Amount must be > 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await income.create({ taxi: selectedTaxi, amount: parseFloat(amount), date, shift: shift.trim() || undefined, notes: notes.trim() || undefined })
      Alert.alert('Success', 'Income recorded'); navigation.goBack()
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader title="Record Income" subtitle="Add income entry" icon="trending-up" gradient={gradients.success} />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Taxi *</Text>
          {loadingTaxis ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} /> : (
            <View style={[styles.pickerRow, errors.selectedTaxi && styles.pickerRowError]}>
              {taxisList.map(t => (
                <TouchableOpacity key={t._id} style={[styles.pickerItem, selectedTaxi === t._id && styles.pickerItemSelected]}
                  onPress={() => { setSelectedTaxi(t._id); setErrors(prev => ({ ...prev, selectedTaxi: '' })) }}>
                  <Text style={[styles.pickerText, selectedTaxi === t._id && styles.pickerTextSelected]}>{t.plateNumber}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.selectedTaxi ? <Text style={styles.errorText}>{errors.selectedTaxi}</Text> : null}

          <Text style={styles.label}>Amount (₹) *</Text>
          <TextInput style={[styles.input, errors.amount && styles.inputError]} value={amount} onChangeText={(v) => { setAmount(v); setErrors(prev => ({ ...prev, amount: '' })) }} keyboardType="decimal-pad" placeholderTextColor={colors.textTertiary} />
          {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

          <Text style={styles.label}>Date</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />

          <Text style={styles.label}>Shift</Text>
          <View style={styles.pickerRow}>
            {['', 'morning', 'evening', 'night'].map(s => (
              <TouchableOpacity key={s} style={[styles.pickerItem, shift === s && styles.pickerItemSelected]} onPress={() => setShift(s)}>
                <Text style={[styles.pickerText, shift === s && styles.pickerTextSelected]}>{s || 'Any'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor={colors.textTertiary} multiline />

          <GradientButton title={loading ? 'Recording...' : 'Record Income'} icon="cash-check" loading={loading} onPress={handleSubmit} gradient={gradients.success} style={{ marginTop: spacing.xxl }} />
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
})
