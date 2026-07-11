import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { users } from '../../../api/endpoints'

export default function SuperAdminDriverForm() {
  const navigation = useNavigation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email.trim()) e.email = 'Email is required'
    if (!password.trim()) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await users.create({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, licenseNumber: licenseNumber.trim() || undefined, password, role: 'driver' })
      Alert.alert('Success', 'Driver created'); navigation.goBack()
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">
          <Text style={styles.label}>Name *</Text>
          <TextInput style={[styles.input, errors.name && styles.inputError]} value={name} onChangeText={(v) => { setName(v); setErrors(prev => ({ ...prev, name: '' })) }} placeholder="Driver name" />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          <Text style={styles.label}>Email *</Text>
          <TextInput style={[styles.input, errors.email && styles.inputError]} value={email} onChangeText={(v) => { setEmail(v); setErrors(prev => ({ ...prev, email: '' })) }} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
          <Text style={styles.label}>License</Text>
          <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="License number" />
          <Text style={styles.label}>Password *</Text>
          <TextInput style={[styles.input, errors.password && styles.inputError]} value={password} onChangeText={(v) => { setPassword(v); setErrors(prev => ({ ...prev, password: '' })) }} placeholder="Password" secureTextEntry />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Driver</Text>}
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
