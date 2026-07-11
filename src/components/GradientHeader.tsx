import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'
import { colors, gradients, spacing, borderRadius, GradientPair, GradientTriple } from '../theme'

interface Props {
  title: string
  subtitle?: string
  icon?: keyof typeof MaterialCommunityIcons.glyphMap
  gradient?: GradientPair | GradientTriple
  style?: ViewStyle
  children?: React.ReactNode
  showLogout?: boolean
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap
  onRightPress?: () => void
}

export function GradientHeader({ title, subtitle, icon, gradient: grad, style, children, showLogout, rightIcon, onRightPress }: Props) {
  const nav = useNavigation()
  const { user, logout } = useAuth()
  const bgGradient = grad ?? gradients.primary
  const canGoBack = nav.canGoBack()

  const orgName = typeof user?.organization === 'object' && user?.organization ? (user.organization as any).name : ''
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : ''
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?'

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout().catch(() => {}) },
    ])
  }

  return (
    <LinearGradient
      colors={bgGradient}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.header, style]}
    >
      <View style={styles.row}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textInverse} />
          </TouchableOpacity>
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{user?.name || 'User'}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {userRole}{orgName ? ` · ${orgName}` : ''}{title ? `  ·  ${title}` : ''}
          </Text>
        </View>

        {children}
        {rightIcon && onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
            <MaterialCommunityIcons name={rightIcon} size={16} color={colors.textInverse} />
          </TouchableOpacity>
        )}
        {showLogout && (
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <MaterialCommunityIcons name="logout" size={16} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 34, height: 34, borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.textInverse },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.textInverse, letterSpacing: -0.3 },
  meta: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
})
