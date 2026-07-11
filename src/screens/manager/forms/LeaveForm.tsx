import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GradientHeader } from '../../../components/GradientHeader'
import { leaves, taxis } from '../../../api/endpoints'
import type { Taxi, ApiResponse } from '../../../types'
import NepaliDateRangePicker, { DateRange } from '../../../components/NepaliDateRangePicker'
import { GradientButton } from '../../../components/GradientButton'
import { colors, gradients, spacing, borderRadius, typography } from '../../../theme'

export default function LeaveForm() {
  const nav = useNavigation()
  const route = useRoute<any>()
  const preselectedTaxi = route.params?.taxiId || ''
  const [taxisList, setTaxisList] = useState<Taxi[]>([])
  const [selTaxi, setSelTaxi] = useState<string>(preselectedTaxi)
  const [dr, setDr] = useState<DateRange>({ from: '', to: '' })
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingT, setLoadingT] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    taxis.list().then(r => {
      const list: Taxi[] = Array.isArray(r) ? r : (r as any)?.data ?? []
      setTaxisList(list)
      if (preselectedTaxi) {
        const t = list.find((x: Taxi) => x._id === preselectedTaxi)
        if (t?.assignedDriver?._id) {
          setErrors(p => ({ ...p, driver: '' }))
        }
      }
    }).catch(() => Alert.alert('Error', 'Failed to load taxis')).finally(() => setLoadingT(false))
  }, [])

  const selectedTaxiObj = taxisList.find(t => t._id === selTaxi)
  const driverName = selectedTaxiObj?.assignedDriver?.name || ''
  const driverId = selectedTaxiObj?.assignedDriver?._id || ''

  const days = dr.from && dr.to ? Math.round((new Date(dr.to).getTime() - new Date(dr.from).getTime()) / 86400000) + 1 : 0

  const validate = () => {
    const e: Record<string, string> = {}
    if (!selTaxi) e.selTaxi = 'Select a taxi'
    if (!driverId) e.driver = 'No driver assigned to this taxi'
    if (!dr.from) e.dr = 'Select date range'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (days > 1) {
        const dates: any[] = []
        const d = new Date(dr.from)
        while (d <= new Date(dr.to)) {
          dates.push({ date: d.toISOString().split('T')[0], reason: reason.trim() || undefined })
          d.setDate(d.getDate() + 1)
        }
        await leaves.batchCreate(dates, selTaxi, driverId)
      } else {
        await leaves.create(dr.from, reason.trim() || undefined, selTaxi, driverId)
      }
      Alert.alert('Success', `Leave recorded for ${days > 1 ? `${days} days` : dr.from}`); nav.goBack()
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <SafeAreaView style={styles.c} edges={['bottom']}>
      <GradientHeader title="Mark Leave" subtitle="Record a leave day" icon="calendar-remove" gradient={gradients.pink} />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.sc} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <Text style={styles.fl}>Taxi *</Text>
          {loadingT ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} /> :
            <View style={[styles.pRow, errors.selTaxi && styles.pRowE]}>
              {taxisList.filter(t => t.isActive).map(t => (
                <TouchableOpacity key={t._id} style={[styles.pItem, selTaxi === t._id && styles.pItemS]}
                  onPress={() => { setSelTaxi(t._id); setErrors(p => ({ ...p, selTaxi: '', driver: '' })) }}>
                  <Text style={[styles.pText, selTaxi === t._id && styles.pTextS]}>{t.plateNumber}</Text>
                  {t.assignedDriver?.name ? <Text style={[styles.pDriver, selTaxi === t._id && styles.pDriverS]}>{t.assignedDriver.name}</Text> : <Text style={[styles.pNoDriver, selTaxi === t._id && styles.pDriverS]}>No driver</Text>}
                </TouchableOpacity>
              ))}
              {taxisList.filter(t => t.isActive).length === 0 && <Text style={styles.empty}>No active taxis</Text>}
            </View>}
          {errors.selTaxi ? <Text style={styles.err}>{errors.selTaxi}</Text> : null}

          {selTaxi && (
            <View style={styles.driverInfo}>
              {driverName ? (
                <>
                  <MaterialCommunityIcons name="account-check" size={16} color={colors.success} />
                  <Text style={styles.driverInfoText}>Driver: <Text style={styles.driverName}>{driverName}</Text></Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="account-alert" size={16} color={colors.danger} />
                  <Text style={[styles.driverInfoText, { color: colors.danger }]}>No driver assigned to this taxi</Text>
                </>
              )}
            </View>
          )}
          {errors.driver ? <Text style={styles.err}>{errors.driver}</Text> : null}

          <NepaliDateRangePicker value={dr} onChange={setDr} showQuickSelect label="Leave dates *" />
          {errors.dr ? <Text style={styles.err}>{errors.dr}</Text> : null}
          {days > 0 && <Text style={styles.dayC}>{days} day{days > 1 ? 's' : ''}</Text>}

          <Text style={styles.fl}>Reason</Text>
          <TextInput style={[styles.inp, styles.txtA]} value={reason} onChangeText={setReason} placeholder="e.g. Public holiday, maintenance" placeholderTextColor={colors.textTertiary} multiline />

          <GradientButton title={loading ? 'Recording...' : `Mark Leave${days > 0 ? ` (${days} day${days > 1 ? 's' : ''})` : ''}`} icon="calendar-check" loading={loading} onPress={handleSubmit} gradient={gradients.pink} style={{ marginTop: spacing.xxl }} />
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
  txtA: { minHeight: 80, textAlignVertical: 'top' },
  err: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  pRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pRowE: { borderWidth: 1, borderColor: colors.danger, borderRadius: borderRadius.md, padding: spacing.xs },
  pItem: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pItemS: { backgroundColor: colors.primary, borderColor: colors.primary },
  pText: { fontSize: 13, color: colors.textSecondary },
  pTextS: { color: colors.textInverse, fontWeight: '600' },
  pDriver: { fontSize: 10, color: colors.textTertiary, marginTop: 1 },
  pNoDriver: { fontSize: 10, color: colors.danger, marginTop: 1 },
  pDriverS: { color: 'rgba(255,255,255,0.7)' },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceSecondary, padding: spacing.md, borderRadius: borderRadius.sm, marginTop: spacing.sm },
  driverInfoText: { fontSize: 13, color: colors.textSecondary },
  driverName: { fontWeight: '700', color: colors.text },
  dayC: { fontSize: 13, color: colors.pink, fontWeight: '600', marginTop: spacing.xs },
  empty: { color: colors.textTertiary, fontSize: 13, fontStyle: 'italic' },
})
