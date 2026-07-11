import React from 'react'
import {
  Text, TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, gradients, spacing, borderRadius, shadow, GradientPair, GradientTriple } from '../theme'

interface Props {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  gradient?: GradientPair | GradientTriple
  icon?: keyof typeof MaterialCommunityIcons.glyphMap
  style?: ViewStyle
  small?: boolean
  outline?: boolean
}

export function GradientButton({
  title, onPress, loading, disabled, gradient: grad,
  icon, style, small, outline,
}: Props) {
  const bgGradient = grad ?? gradients.primary
  const isDisabled = loading || disabled

  if (outline) {
    return (
      <TouchableOpacity
        style={[
          styles.outlineBtn,
          small && styles.outlineBtnSmall,
          isDisabled && styles.disabled,
          style,
        ]}
        onPress={onPress} disabled={isDisabled} activeOpacity={0.7}
      >
        {icon && <MaterialCommunityIcons name={icon} size={small ? 16 : 20} color={colors.primary} />}
        <Text style={[styles.outlineText, small && styles.outlineTextSmall]}>{title}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      style={[styles.wrapper, small && styles.wrapperSmall, isDisabled && styles.disabled, style]}
      onPress={onPress} disabled={isDisabled} activeOpacity={0.8}
    >
      <LinearGradient
        colors={bgGradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.gradient, small && styles.gradientSmall]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <>
            {icon && <MaterialCommunityIcons name={icon} size={small ? 16 : 20} color={colors.textInverse} />}
            <Text style={[styles.text, small && styles.textSmall]}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: borderRadius.md, overflow: 'hidden', ...shadow.gradient },
  wrapperSmall: { borderRadius: borderRadius.sm },
  disabled: { opacity: 0.5 },
  gradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.xxl, gap: spacing.sm,
  },
  gradientSmall: { paddingVertical: 10, paddingHorizontal: spacing.lg },
  text: { color: colors.textInverse, fontSize: 15, fontWeight: '700' },
  textSmall: { fontSize: 13 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.xxl, gap: spacing.sm,
    borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  outlineBtnSmall: { paddingVertical: 10, paddingHorizontal: spacing.lg },
  outlineText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  outlineTextSmall: { fontSize: 13 },
})
