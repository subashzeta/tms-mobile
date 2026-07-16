import React, { useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useToast } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'
import { colors, gradients, spacing, borderRadius, shadow, typography } from '../theme'

export default function LoginScreen() {
  const toast = useToast()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const passRef = useRef<TextInput>(null)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Error', 'Please enter email and password')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || err?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bgTop}>
        <View style={styles.logoArea}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="car-side" size={36} color={colors.textInverse} />
          </View>
          <Text style={styles.appName}>TMS</Text>
          <Text style={styles.tagline}>Taxi Management System</Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.welcome}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to your account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="email-outline" size={16} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput testID="email-input" style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email" placeholderTextColor={colors.textTertiary} autoCapitalize="none" autoCorrect={false} returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()} blurOnSubmit={false} editable={!loading} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="lock-outline" size={16} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput testID="password-input" ref={passRef} style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={colors.textTertiary} secureTextEntry returnKeyType="done" onSubmitEditing={handleLogin} editable={!loading} />
            </View>
          </View>

          <TouchableOpacity testID="login-button" style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
              {loading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.buttonText}>Sign In</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgTop: { paddingTop: 70, paddingBottom: 50, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  logoArea: { alignItems: 'center' },
  logo: { width: 68, height: 68, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  appName: { fontSize: 32, fontWeight: '800', color: colors.textInverse, letterSpacing: -1 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xxl, paddingTop: -20 },
  form: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxl, marginTop: -24, ...shadow.lg },
  welcome: { fontSize: 22, fontWeight: '700', color: colors.text },
  formSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xl, marginTop: 3 },
  inputGroup: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceSecondary, paddingHorizontal: spacing.md },
  inputIcon: { marginRight: spacing.xs },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.text },
  button: { marginTop: spacing.md, borderRadius: borderRadius.sm, overflow: 'hidden', ...shadow.gradient },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: { paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: colors.textInverse, fontSize: 15, fontWeight: '700' },
})
