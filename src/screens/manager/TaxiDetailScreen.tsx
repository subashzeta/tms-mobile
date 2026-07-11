import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute } from '@react-navigation/native'
import { GradientHeader } from '../../components/GradientHeader'
import { taxis } from '../../api/endpoints'
import type { Taxi } from '../../types'

function formatCurrency(n: number) {
  return '₹ ' + n.toLocaleString('en-IN')
}

export default function TaxiDetailScreen() {
  const route = useRoute<any>()
  const { taxiId } = route.params ?? {}
  const [taxi, setTaxi] = useState<Taxi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taxiId) {
      setError('No taxi ID provided')
      setLoading(false)
      return
    }
    taxis.get(taxiId)
      .then(setTaxi)
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load taxi'))
      .finally(() => setLoading(false))
  }, [taxiId])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientHeader title="Taxi Details" icon="car" />
        <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientHeader title="Taxi Details" icon="car" />
        <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
      </SafeAreaView>
    )
  }

  if (!taxi) return null

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader title={taxi.plateNumber} subtitle={taxi.model} icon="car" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.plate}>{taxi.plateNumber}</Text>
          <Text style={styles.status}>{taxi.isActive ? 'Active' : 'Inactive'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle Information</Text>
          <Row label="Model" value={taxi.model} />
          <Row label="Year" value={String(taxi.year ?? 'N/A')} />
          <Row label="Color" value={taxi.color ?? 'N/A'} />
          <Row label="Daily Rate" value={taxi.dailyRate ? formatCurrency(taxi.dailyRate) : 'N/A'} />
        </View>

        {taxi.assignedDriver && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Driver</Text>
            <Row label="Name" value={taxi.assignedDriver.name} />
            {taxi.assignedDriver.phone && <Row label="Phone" value={taxi.assignedDriver.phone} />}
          </View>
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#DC2626', fontSize: 14 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plate: { fontSize: 22, fontWeight: '700', color: '#111827' },
  status: { fontSize: 13, color: '#059669', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#111827', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 16 },
})
