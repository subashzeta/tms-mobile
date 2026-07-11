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
import { users } from '../../api/endpoints'
import type { Driver } from '../../types'

export default function DriverDetailScreen() {
  const route = useRoute<any>()
  const { driverId } = route.params ?? {}
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!driverId) {
      setError('No driver ID provided')
      setLoading(false)
      return
    }
    users.getById(driverId)
      .then(setDriver)
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load driver'))
      .finally(() => setLoading(false))
  }, [driverId])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientHeader title="Driver Details" icon="account" />
        <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientHeader title="Driver Details" icon="account" />
        <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
      </SafeAreaView>
    )
  }

  if (!driver) return null

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader title={driver.name} subtitle={driver.email} icon="account" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.status}>{driver.isActive ? 'Active' : 'Inactive'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <Row label="Email" value={driver.email ?? 'N/A'} />
          <Row label="Phone" value={driver.phone ?? 'N/A'} />
          <Row label="License" value={driver.licenseNumber ?? 'N/A'} />
          {driver.assignedTaxi && (
            <Row label="Assigned Taxi" value={driver.assignedTaxi.plateNumber} />
          )}
        </View>
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
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  status: { fontSize: 13, fontWeight: '600' },
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
