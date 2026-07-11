import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute } from '@react-navigation/native'
import { taxis } from '../../api/endpoints'
import type { Taxi } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, spacing } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }

export default function SuperAdminTaxiDetailScreen() {
  const route = useRoute<any>()
  const { taxiId } = route.params ?? {}
  const [taxi, setTaxi] = useState<Taxi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taxiId) { setError('No taxi ID'); setLoading(false); return }
    taxis.get(taxiId)
      .then(setTaxi)
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [taxiId])

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
    </SafeAreaView>
  )
  if (error) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
    </SafeAreaView>
  )
  if (!taxi) return null

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title={taxi.plateNumber}
        subtitle={taxi.isActive ? 'Active' : 'Inactive'}
        icon="car"
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <GradientCard title="Vehicle Information">
          <Row label="Model" value={taxi.model} />
          <Row label="Year" value={String(taxi.year ?? 'N/A')} />
          <Row label="Color" value={taxi.color ?? 'N/A'} />
          <Row label="Daily Rate" value={taxi.dailyRate ? formatCurrency(taxi.dailyRate) : 'N/A'} />
        </GradientCard>
        {taxi.assignedDriver && (
          <GradientCard title="Assigned Driver">
            <Row label="Name" value={taxi.assignedDriver.name} />
            {taxi.assignedDriver.phone && <Row label="Phone" value={taxi.assignedDriver.phone} />}
          </GradientCard>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: 14 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLabel: { fontSize: 14, color: colors.textTertiary },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 16 },
})
