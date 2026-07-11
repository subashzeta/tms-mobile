import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GradientHeader } from '../../../components/GradientHeader'
import { taxis } from '../../../api/endpoints'

export default function TaxiForm() {
  const navigation = useNavigation()
  const [plateNumber, setPlateNumber] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [color, setColor] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!plateNumber.trim()) e.plateNumber = 'Plate number is required'
    if (!model.trim()) e.model = 'Model is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await taxis.create({
        plateNumber: plateNumber.trim().toUpperCase(),
        model: model.trim(),
        year: year ? parseInt(year) : undefined,
        color: color.trim() || undefined,
        dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
      })
      Alert.alert('Success', 'Taxi created successfully')
      navigation.goBack()
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to create taxi')
    } finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader title="Add Taxi" subtitle="Register a new vehicle" icon="car" />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">
          <Text style={styles.label}>Plate Number *</Text>
          <TextInput style={[styles.input, errors.plateNumber && styles.inputError]} value={plateNumber} onChangeText={(v) => { setPlateNumber(v); setErrors(prev => ({ ...prev, plateNumber: '' })) }} placeholder="e.g. BA 1 KA 1234" autoCapitalize="characters" />
          {errors.plateNumber ? <Text style={styles.errorText}>{errors.plateNumber}</Text> : null}

          <Text style={styles.label}>Model *</Text>
          <TextInput style={[styles.input, errors.model && styles.inputError]} value={model} onChangeText={(v) => { setModel(v); setErrors(prev => ({ ...prev, model: '' })) }} placeholder="e.g. Toyota Prius" />
          {errors.model ? <Text style={styles.errorText}>{errors.model}</Text> : null}

          <Text style={styles.label}>Year</Text>
          <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="e.g. 2020" keyboardType="number-pad" />

          <Text style={styles.label}>Color</Text>
          <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="e.g. White" />

          <Text style={styles.label}>Daily Rate (₹)</Text>
          <TextInput style={styles.input} value={dailyRate} onChangeText={setDailyRate} placeholder="e.g. 1500" keyboardType="decimal-pad" />

          <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Taxi</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 16, gap: 8, paddingBottom: 120, flexGrow: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15, color: '#111827' },
  inputError: { borderColor: '#DC2626' },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 2 },
  submitBtn: { backgroundColor: '#3B82F6', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
