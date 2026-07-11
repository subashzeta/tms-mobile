import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { settings } from '../../api/endpoints'
import type { SettingValue, PaymentLocation, BankQR, CalendarPreference } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientButton } from '../../components/GradientButton'
import { colors, spacing, borderRadius, typography } from '../../theme'
import * as ImagePicker from 'expo-image-picker'

export default function SuperAdminSettingsScreen() {
  const { data: pref, refresh: refreshPref } = useApi<CalendarPreference>(() => settings.getCalendarPreference(), [])
  const { data: location, refresh: refreshLoc } = useApi<PaymentLocation>(() => settings.getPaymentLocation(), [])
  const { data: bankQR, refresh: refreshQR } = useApi<BankQR>(() => settings.getBankQR(), [])
  const [refreshing, setRefreshing] = useState(false)
  const [calendar, setCalendar] = useState<'english' | 'nepali'>('english')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (pref?.calendar) setCalendar(pref.calendar) }, [pref])
  useEffect(() => { if (location) { setLat(String(location.latitude || '')); setLng(String(location.longitude || '')) } }, [location])
  useEffect(() => { if (!refreshing) return; Promise.all([refreshPref(), refreshLoc(), refreshQR()]).finally(() => setRefreshing(false)) }, [refreshing])

  const handleSaveCalendar = async () => {
    setSaving(true)
    try { await settings.setCalendarPreference(calendar); Alert.alert('Saved', 'Calendar preference updated') }
    catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
    finally { setSaving(false) }
  }

  const handleSaveLocation = async () => {
    if (!lat || !lng) { Alert.alert('Error', 'Latitude and longitude required'); return }
    setSaving(true)
    try { await settings.setPaymentLocation({ latitude: parseFloat(lat), longitude: parseFloat(lng) }); Alert.alert('Saved', 'Payment location updated') }
    catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
    finally { setSaving(false) }
  }

  const handleUploadQR = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Permission needed'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (!result.canceled && result.assets[0]) {
      setUploading(true)
      try {
        const form = new FormData()
        form.append('file', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'qr.jpg' } as any)
        await settings.uploadBankQR(form)
        Alert.alert('Success', 'Bank QR uploaded'); refreshQR()
      } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
      finally { setUploading(false) }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Settings" icon="cog" />
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} colors={[colors.primary]} />}>
        <GradientCard title="Calendar Preference">
          <View style={styles.toggleRow}>
            {(['english', 'nepali'] as const).map(c => (
              <TouchableOpacity key={c} style={[styles.toggleBtn, calendar === c && styles.toggleActive]} onPress={() => setCalendar(c)}>
                <Text style={[styles.toggleText, calendar === c && styles.toggleTextActive]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <GradientButton title={saving ? 'Saving...' : 'Save'} onPress={handleSaveCalendar} loading={saving} small />
        </GradientCard>

        <GradientCard title="Payment Location (GPS)">
          <TextInput style={styles.input} value={lat} onChangeText={setLat} placeholder="Latitude" keyboardType="decimal-pad" />
          <TextInput style={styles.input} value={lng} onChangeText={setLng} placeholder="Longitude" keyboardType="decimal-pad" />
          <GradientButton title={saving ? 'Saving...' : 'Set Location'} onPress={handleSaveLocation} loading={saving} small />
        </GradientCard>

        <GradientCard title="Bank QR Code">
          {bankQR?.qrImageUrl && <Text style={styles.info}>QR Code uploaded ✓</Text>}
          <GradientButton
            title={bankQR ? 'Update QR Code' : 'Upload QR Code'}
            onPress={handleUploadQR}
            loading={uploading}
            small
            gradient={[colors.purple, colors.purple]}
          />
        </GradientCard>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  toggleTextActive: { color: colors.textInverse },
  input: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: 12, fontSize: 15, color: colors.text, marginBottom: spacing.sm },
  info: { fontSize: 13, color: colors.success, fontWeight: '500', marginBottom: spacing.sm },
})
