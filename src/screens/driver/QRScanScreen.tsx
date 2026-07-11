import React, { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { dailyPayments } from '../../api/endpoints'

export default function QRScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (!scanning || loading) return
    setScanning(false)
    setLoading(true)
    try {
      let parsed: any
      try { parsed = JSON.parse(data) } catch { parsed = { tmsToken: data } }
      const result = await dailyPayments.record({
        taxiId: parsed.taxiId || parsed.tmsToken,
        amountDue: parsed.amount || 0,
        amountPaid: parsed.amount || 0,
        paymentMethod: 'esewa',
        date: new Date().toISOString().split('T')[0],
      })
      Alert.alert('Success', `Payment recorded: ₹${result?.amountPaid || 0}`)
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to process QR')
    } finally {
      setLoading(false)
      setScanning(true)
    }
  }, [scanning, loading])

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}><Text style={styles.text}>Requesting camera permission...</Text></View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="camera-off" size={48} color="#9CA3AF" />
          <Text style={styles.text}>Camera access is required</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Scan QR Code</Text>
      </View>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}
        </View>
      </CameraView>
      {!scanning && !loading && (
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanning(true)}>
          <Text style={styles.rescanText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 32, gap: 12 },
  text: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#111827' },
  heading: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#fff', borderRadius: 16, backgroundColor: 'transparent' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  button: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rescanBtn: { position: 'absolute', bottom: 60, left: 40, right: 40, backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  rescanText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
