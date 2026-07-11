import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, borderRadius, shadow, typography } from '../theme'

interface StatItem {
  label: string
  value: string
  textStyle?: 'default' | 'secondary' | 'danger' | 'warning'
}
interface StatusBadge { label: string; type: 'success' | 'danger' | 'warning' }
interface MobileCardProps {
  primary: { label: string; value: string }
  subtitle?: string
  stats: StatItem[]
  amount?: { collected?: number; outstanding?: number }
  info?: { label: string; value: string | React.ReactNode }[]
  actions?: React.ReactNode
  onPress?: () => void
  status?: StatusBadge
}

export function MobileCard({ primary, subtitle, stats: statList, amount, info, actions, onPress, status }: MobileCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View
  return (
    <Wrapper onPress={onPress} activeOpacity={0.7} style={styles.card}>
      <View style={styles.inner}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.primaryValue} numberOfLines={1}>{primary.value}</Text>
            {status && (
              <View style={[styles.statusBadge, status.type === 'success' && styles.statusSuccess, status.type === 'danger' && styles.statusDanger, status.type === 'warning' && styles.statusWarning]}>
                <Text style={styles.statusText}>{status.label}</Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
          <View style={styles.statsRow}>
            {statList.map((stat, i) => (
              <Text key={i} style={[styles.stat, stat.textStyle === 'secondary' && styles.statSecondary, stat.textStyle === 'danger' && styles.statDanger]}>
                {stat.label}: <Text style={styles.statValue}>{stat.value}</Text>
              </Text>
            ))}
          </View>
        </View>
        {amount && (amount.collected !== undefined || amount.outstanding !== undefined) && (
          <View style={styles.amountColumn}>
            {amount.collected !== undefined && <><Text style={styles.amountLabel}>Collected</Text><Text style={styles.amountCollected}>{formatCurrency(amount.collected)}</Text></>}
            {amount.outstanding !== undefined && amount.outstanding > 0 && <><Text style={styles.amountLabel}>Outstanding</Text><Text style={styles.amountOutstanding}>{formatCurrency(amount.outstanding)}</Text></>}
          </View>
        )}
      </View>
      {actions && <View style={styles.actionsRow}>{actions}</View>}
    </Wrapper>
  )
}

function formatCurrency(amount: number) { return '₹ ' + amount.toLocaleString('en-IN') }

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden', marginBottom: spacing.sm, ...shadow.sm },
  inner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  content: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  primaryValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusSuccess: { backgroundColor: colors.successLight },
  statusDanger: { backgroundColor: colors.dangerLight },
  statusWarning: { backgroundColor: colors.warningLight },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: colors.text },
  subtitle: { ...typography.bodySmall, marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  stat: { fontSize: 11, color: colors.textTertiary },
  statValue: { color: colors.text, fontWeight: '500' },
  statSecondary: { color: colors.success, fontWeight: '600' },
  statDanger: { color: colors.danger, fontWeight: '600' },
  amountColumn: { alignItems: 'flex-end', flexShrink: 0 },
  amountLabel: { fontSize: 9, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  amountCollected: { fontSize: 12, fontWeight: '600', color: colors.success },
  amountOutstanding: { fontSize: 14, fontWeight: '700', color: colors.danger },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
})
