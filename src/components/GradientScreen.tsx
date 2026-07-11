import React from 'react'
import {
  View, ScrollView, RefreshControl, StyleSheet, ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, gradients, spacing, GradientPair, GradientTriple } from '../theme'

interface Props {
  children: React.ReactNode
  gradient?: GradientPair | GradientTriple
  scroll?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  style?: ViewStyle
  contentStyle?: ViewStyle
}

export function GradientScreen({
  children, gradient, scroll, refreshing, onRefresh, style, contentStyle,
}: Props) {
  const bgGradient = gradient ?? gradients.primary

  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? (
        <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
      ) : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fixedContent, contentStyle]}>{children}</View>
  )

  return (
    <SafeAreaView style={[styles.container, style]}>
      <LinearGradient colors={bgGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBg}>
        <View style={styles.overlay} />
      </LinearGradient>
      {content}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gradientBg: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100, flexGrow: 1 },
  fixedContent: { flex: 1, padding: spacing.lg },
})
