import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { income } from '../../api/endpoints'
import type { Income as IncomeType, ApiResponse } from '../../types'
import { GradientHeader } from '../../components/GradientHeader'
import { GradientCard } from '../../components/GradientCard'
import { GradientButton } from '../../components/GradientButton'
import { colors, spacing } from '../../theme'

function formatCurrency(n: number) { return '₹ ' + n.toLocaleString('en-IN') }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN') }

export default function IncomeScreen() {
  const navigation = useNavigation<any>()
  const { data, loading, error, refresh } = useApi<ApiResponse<IncomeType[]>>(() => income.list(), [])
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { if (!loading) setRefreshing(false) }, [loading])
  const onRefresh = useCallback(() => { setRefreshing(true); refresh() }, [refresh])

  const handleVerify = useCallback(async (id: string, verified: boolean) => {
    setActionLoading(id)
    try {
      if (verified) { await income.unverify(id); Alert.alert('Unverified', 'Income unverified') }
      else { await income.verify(id); Alert.alert('Verified', 'Income verified') }
      refresh()
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || err.message) }
    finally { setActionLoading(null) }
  }, [refresh])

  if (loading && !data) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>
  if (error) return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>

  const items = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title="Income" subtitle="Recorded income from taxis" icon="trending-up" />
      <FlatList
        data={items} keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <GradientButton title="View Income Stats" icon="chart-bar" outline onPress={() => navigation.navigate('IncomeStats')} style={{ marginBottom: spacing.md }} />
        }
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No income records found</Text></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => {
          const verified = !!item.verifiedAt
          return (
            <GradientCard icon="trending-up" iconColor={colors.success}
              title={item.taxi?.plateNumber ?? 'N/A'} subtitle={item.driver?.name || ''}
              value={formatCurrency(item.amount)} valueColor={colors.success}
              stats={[
                { label: 'Date', value: formatDate(item.date), color: colors.textSecondary },
                { label: 'Status', value: verified ? 'Verified' : 'Pending', color: verified ? colors.success : colors.warning },
              ]}>
              {actionLoading === item._id ? <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.sm }} /> : (
                <TouchableOpacity style={[styles.verifyBtn, verified && styles.unverifyBtn]} onPress={() => handleVerify(item._id, verified)}>
                  <Text style={styles.actionBtnText}>{verified ? 'Unverify' : 'Verify'}</Text>
                </TouchableOpacity>
              )}
            </GradientCard>
          )
        }} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: colors.danger, fontSize: 14 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  emptyText: { color: colors.textTertiary, fontSize: 14 },
  list: { padding: spacing.lg },
  verifyBtn: { backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: spacing.sm },
  unverifyBtn: { backgroundColor: colors.warning },
  actionBtnText: { color: colors.textInverse, fontSize: 13, fontWeight: '600' },
})
