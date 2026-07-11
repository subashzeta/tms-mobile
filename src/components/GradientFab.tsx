import React from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, gradients, borderRadius, shadow } from '../theme'

interface Props {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap
  onPress: () => void
  bottom?: number
}

export function GradientFab({ icon = 'plus', onPress, bottom = 80 }: Props) {
  return (
    <TouchableOpacity style={[styles.wrapper, { bottom }]} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.fab}
      >
        <MaterialCommunityIcons name={icon} size={24} color={colors.textInverse} />
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute', right: 20,
    ...shadow.gradient,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
})
