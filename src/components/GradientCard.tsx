import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, gradients, spacing, borderRadius, shadow, typography, GradientPair, GradientTriple } from '../theme'

interface Stat {
  label: string
  value: string
  color?: string
}

interface Props {
  title?: string
  subtitle?: string
  value?: string
  valueColor?: string
  icon?: keyof typeof MaterialCommunityIcons.glyphMap
  iconColor?: string
  gradient?: GradientPair | GradientTriple
  stats?: Stat[]
  children?: React.ReactNode
  onPress?: () => void
  style?: ViewStyle
  compact?: boolean
}

export function GradientCard({
  title, subtitle, value, valueColor, icon, iconColor,
  gradient: grad, stats, children, onPress, style, compact,
}: Props) {
  const Wrapper = onPress ? TouchableOpacity : View
  const bgGradient = grad ?? gradients.card
  const iconBg = iconColor ?? colors.primaryLight

  return (
    <Wrapper onPress={onPress} activeOpacity={0.7} style={[styles.wrapper, style]}>
      <LinearGradient colors={bgGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.content}>
          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: iconBg + '15' }]}>
              <MaterialCommunityIcons name={icon} size={compact ? 16 : 18} color={iconBg} />
            </View>
          )}
          <View style={styles.textWrap}>
            {title && <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
          </View>
          {value && (
            <Text style={[styles.value, { color: valueColor ?? colors.text }, compact && styles.valueCompact]}>
              {value}
            </Text>
          )}
        </View>
        {stats && stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <View key={i} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
        {children}
      </LinearGradient>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.sm },
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.sm,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 34, height: 34, borderRadius: borderRadius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: colors.text },
  titleCompact: { fontSize: 12 },
  subtitle: { fontSize: 10, color: colors.textTertiary, marginTop: 1 },
  value: { fontSize: 15, fontWeight: '700' },
  valueCompact: { fontSize: 14 },
  statsRow: {
    flexDirection: 'row', marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.borderLight, gap: spacing.lg,
  },
  stat: { flex: 1 },
  statValue: { fontSize: 13, fontWeight: '600', marginBottom: 1 },
  statLabel: { fontSize: 10, color: colors.textTertiary },
})
