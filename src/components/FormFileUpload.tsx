import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useToast } from './Toast'
import { colors, spacing, borderRadius } from '../theme'

interface Props {
  label?: string
  value: string | null
  onChange: (uri: string | null) => void
  mediaTypes?: 'images' | 'all'
}

export function FormFileUpload({ label = 'Attach Proof', value, onChange, mediaTypes = 'images' }: Props) {
  const toast = useToast()
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      toast.error('Permission needed', 'Allow photo access to attach files')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypes === 'images' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      toast.error('Permission needed', 'Allow camera access to take photos')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri)
    }
  }

  if (value) {
    return (
      <View style={s.preview}>
        <Image source={{ uri: value }} style={s.previewImg} />
        <TouchableOpacity style={s.removeBtn} onPress={() => onChange(null)}>
          <MaterialCommunityIcons name="close-circle" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        <TouchableOpacity style={s.pickBtn} onPress={pickImage}>
          <MaterialCommunityIcons name="image-plus" size={18} color={colors.primary} />
          <Text style={s.pickText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.pickBtn} onPress={takePhoto}>
          <MaterialCommunityIcons name="camera" size={18} color={colors.primary} />
          <Text style={s.pickText}>Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { marginTop: spacing.sm },
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 12, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.surfaceSecondary },
  pickText: { fontSize: 12, fontWeight: '500', color: colors.primary },
  preview: { position: 'relative', marginTop: spacing.sm },
  previewImg: { width: '100%', height: 120, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceSecondary },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.surface, borderRadius: 12 },
})
