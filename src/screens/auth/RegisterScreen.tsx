import React, { useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useToast } from '../../components/Toast'
import { useNavigation } from '@react-navigation/native'
import { auth } from '../../api/endpoints'

export default function RegisterScreen() {
  const toast = useToast()
  const navigation = useNavigation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [orgCode, setOrgCode] = useState('')
  const [loading, setLoading] = useState(false)
  const phoneRef = useRef<TextInput>(null)
  const passRef = useRef<TextInput>(null)

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Error', 'Name, email, and password are required')
      return
    }
    setLoading(true)
    try {
      await auth.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        organizationCode: orgCode.trim() || undefined,
      })
      Alert.alert('Success', 'Registration successful. Please login.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || err?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.title}>TMS</Text>
          <Text style={styles.subtitle}>Create Account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => phoneRef.current?.focus()} blurOnSubmit={false} editable={!loading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" returnKeyType="next" onSubmitEditing={() => phoneRef.current?.focus()} blurOnSubmit={false} editable={!loading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput ref={phoneRef} style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()} blurOnSubmit={false} editable={!loading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput ref={passRef} style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry returnKeyType="next" onSubmitEditing={() => {}} blurOnSubmit={false} editable={!loading} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization Code</Text>
            <TextInput style={styles.input} value={orgCode} onChangeText={setOrgCode} placeholder="Optional org code" autoCapitalize="characters" editable={!loading} />
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkBtn}>
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 32, fontWeight: '700', color: '#3B82F6', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  button: { backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: '#3B82F6', fontSize: 14, fontWeight: '500' },
})
