import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { income } from '../../api/endpoints'
import type { Income, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientButton } from '../../components/GradientButton'
import { colors, spacing, typography } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN') }

export default function SuperAdminIncomeScreen() {
  const navigation = useNavigation<any>()
  const { data, loading, error, refresh } = useApi<ApiResponse<Income[]>>(() => income.list(), [])
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  const handleVerify = useCallback(async (id: string, verified: boolean) => {
    setActionLoading(id)
    try { if (verified) { await income.unverify(id); Alert.alert('Unverified') } else { await income.verify(id); Alert.alert('Verified') }; refresh() }
    catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
    finally { setActionLoading(null) }
  }, [refresh])

  if (loading && !data) return (
    <SafeAreaView style={styles.container}><View style={styles.list}><View style={styles.skeleton} /><View style={styles.skeleton} /></View></SafeAreaView>
  )
  if (error) return (
    <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>
  )

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Income" icon="trending-up" />
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const verified = !!item.verifiedAt
          return (
            <GradientCard
              title={item.taxi?.plateNumber ?? 'N/A'}
              value={formatCurrency(item.amount)}
              valueColor={colors.success}
              subtitle={item.driver?.name}
              stats={[
                { label: 'Date', value: formatDate(item.date) },
                { label: 'Status', value: verified ? 'Verified' : 'Pending', color: verified ? colors.success : colors.warning },
              ]}
            >
              {actionLoading === item._id ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.sm }} />
              ) : (
                <View style={styles.cardAction}>
                  <GradientButton
                    title={verified ? 'Unverify' : 'Verify'}
                    onPress={() => handleVerify(item._id, verified)}
                    small
                    gradient={verified ? ['#D97706', '#F59E0B'] : ['#059669', '#10B981']}
                  />
                </View>
              )}
            </GradientCard>
          )
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No income records</Text></View>}
        ListHeaderComponent={
          <TouchableOpacity style={styles.statsBanner} onPress={() => navigation.navigate('SAIncomeStats')}>
            <MaterialCommunityIcons name="chart-bar" size={20} color={colors.primary} /><Text style={styles.statsBannerText}>View Income Stats</Text><MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.textTertiary, fontSize: 14 },
  list: { padding: spacing.lg },
  skeleton: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight },
  cardAction: { marginTop: spacing.sm, alignSelf: 'flex-end' },
  statsBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight, gap: 8 },
  statsBannerText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.primary },
})
