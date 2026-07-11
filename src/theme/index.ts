import { ViewStyle, TextStyle } from 'react-native'

export const colors = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDark: '#3730A3',
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  accent: '#06B6D4',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.4)',
}

export type GradientPair = readonly [string, string]
export type GradientTriple = readonly [string, string, string]

export const gradients = {
  primary: ['#4F46E5', '#6366F1'] as GradientPair,
  primaryDark: ['#3730A3', '#4F46E5'] as GradientPair,
  secondary: ['#0EA5E9', '#38BDF8'] as GradientPair,
  accent: ['#06B6D4', '#22D3EE'] as GradientPair,
  success: ['#059669', '#10B981'] as GradientPair,
  warning: ['#D97706', '#F59E0B'] as GradientPair,
  danger: ['#DC2626', '#EF4444'] as GradientPair,
  purple: ['#7C3AED', '#8B5CF6'] as GradientPair,
  pink: ['#EC4899', '#F472B6'] as GradientPair,
  card: ['#FFFFFF', '#F8FAFC'] as GradientPair,
  header: ['#4F46E5', '#6366F1', '#0EA5E9'] as GradientTriple,
  sunset: ['#4F46E5', '#7C3AED', '#EC4899'] as GradientTriple,
  dashboard: ['#4F46E5', '#6366F1'] as GradientPair,
  tabActive: ['#4F46E5', '#6366F1'] as GradientPair,
}

export const spacing = {
  xs: 3,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  xxxl: 28,
}

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
}

export const shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  gradient: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
}

export const typography = {
  h1: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 } as TextStyle,
  h2: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 } as TextStyle,
  h3: { fontSize: 16, fontWeight: '700', color: colors.text } as TextStyle,
  h4: { fontSize: 14, fontWeight: '600', color: colors.text } as TextStyle,
  body: { fontSize: 13, fontWeight: '400', color: colors.text } as TextStyle,
  bodySmall: { fontSize: 11, fontWeight: '400', color: colors.textSecondary } as TextStyle,
  caption: { fontSize: 10, fontWeight: '500', color: colors.textTertiary, letterSpacing: 0.3 } as TextStyle,
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.2 } as TextStyle,
  currency: { fontSize: 18, fontWeight: '800', color: colors.text } as TextStyle,
}
