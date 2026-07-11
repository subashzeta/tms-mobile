import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { Animated, StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, borderRadius, shadow } from '../theme'

type ToastType = 'success' | 'error' | 'info'

interface ToastMsg {
  id: number
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  show: (type: ToastType, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue>({ show: () => {}, success: () => {}, error: () => {}, info: () => {} })
export const useToast = () => useContext(ToastContext)

const cfg: Record<ToastType, { bg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; border: string }> = {
  success: { bg: '#ECFDF5', icon: 'check-circle', color: '#059669', border: '#A7F3D0' },
  error:   { bg: '#FEF2F2', icon: 'close-circle', color: '#DC2626', border: '#FECACA' },
  info:    { bg: '#EFF6FF', icon: 'information', color: '#3B82F6', border: '#BFDBFE' },
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const insets = useSafeAreaInsets()

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((type: ToastType, title: string, message?: string) => {
    const id = nextId++
    setToasts(prev => [...prev.slice(-2), { id, type, title, message }])
    setTimeout(() => remove(id), 3500)
  }, [remove])

  const value: ToastContextValue = {
    show,
    success: (t, m) => show('success', t, m),
    error: (t, m) => show('error', t, m),
    info: (t, m) => show('info', t, m),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={[styles.layer, { top: insets.top + 8 }]} pointerEvents="box-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMsg; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current
  const c = cfg[toast.type]

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start()
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -10, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss())
    }, 3200)
  }, [])

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }], backgroundColor: c.bg, borderLeftColor: c.border }]}>
      <TouchableOpacity activeOpacity={0.9} style={styles.inner} onPress={onDismiss}>
        <View style={[styles.iconBox, { backgroundColor: c.color + '18' }]}>
          <MaterialCommunityIcons name={c.icon} size={20} color={c.color} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: c.color }]} numberOfLines={1}>{toast.title}</Text>
          {toast.message ? <Text style={styles.msg} numberOfLines={2}>{toast.message}</Text> : null}
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, zIndex: 9999, alignItems: 'center', gap: 6, paddingHorizontal: 16 },
  card: { width: '100%', borderRadius: borderRadius.md, borderLeftWidth: 3, ...shadow.md },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  textCol: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  msg: { fontSize: 11, color: colors.textSecondary, marginTop: 1, lineHeight: 16 },
})
