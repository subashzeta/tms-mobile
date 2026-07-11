import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute } from '@react-navigation/native'
import { users } from '../../api/endpoints'
import type { User } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { colors, spacing } from '../../theme'

export default function SuperAdminManagerDetailScreen() {
  const route = useRoute<any>()
  const { managerId } = route.params ?? {}
  const [manager, setManager] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!managerId) { setError('No manager ID'); setLoading(false); return }
    users.getById(managerId)
      .then(setManager)
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [managerId])

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
  if (!manager) return null

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title={manager.name}
        subtitle={manager.role}
        icon="account-tie"
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <GradientCard title="Manager Information">
          <Row label="Email" value={manager.email ?? 'N/A'} />
          <Row label="Phone" value={manager.phone ?? 'N/A'} />
          <Row label="Role" value={manager.role} />
          <Row label="Organization" value={typeof manager.organization === 'object' && manager.organization ? manager.organization.name : 'N/A'} />
        </GradientCard>
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
