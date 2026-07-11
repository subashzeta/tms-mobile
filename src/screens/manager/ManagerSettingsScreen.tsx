import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useApi } from '../../hooks/useApi'
import { taxis, users, dailyPayments } from '../../api/endpoints'
import { GradientHeader } from '../../components/GradientHeader'
import { colors, spacing, borderRadius } from '../../theme'

function fmt(n: number | null | undefined) { if (n == null) return '₹ 0'; return '₹ ' + n.toLocaleString('en-IN') }

type Section = 'rates' | 'taxis' | 'drivers' | 'accounts'

export default function ManagerSettingsScreen() {
  const [section, setSection] = useState<Section>('rates')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const [rateModal, setRateModal] = useState<any>(null)
  const [rateValue, setRateValue] = useState('')

  const [taxiModal, setTaxiModal] = useState<any>(null)
  const [taxiPlate, setTaxiPlate] = useState('')
  const [taxiModel, setTaxiModel] = useState('')
  const [taxiYear, setTaxiYear] = useState('')
  const [taxiColor, setTaxiColor] = useState('')

  const [driverModal, setDriverModal] = useState<any>(null)
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [driverAddress, setDriverAddress] = useState('')
  const [driverLicense, setDriverLicense] = useState('')

  const { data: taxisData, loading: tLoading, refresh: refreshT } = useApi<any>(() => taxis.list({ limit: 200 }), [])
  const { data: driversData, loading: dLoading, refresh: refreshD } = useApi<any>(() => users.getDrivers({ limit: 200 }), [])
  const { data: accountsData, loading: aLoading, refresh: refreshA } = useApi<any>(() => dailyPayments.getPendingApprovals().catch(() => ({ data: [] })), [])

  const taxiList: any[] = useMemo(() => Array.isArray(taxisData?.data) ? taxisData.data : Array.isArray(taxisData) ? taxisData : [], [taxisData])
  const driverList: any[] = useMemo(() => {
    const raw = driversData?.data
    return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
  }, [driversData])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    Promise.all([refreshT(), refreshD()]).finally(() => setRefreshing(false))
  }, [])

  const handleSetRate = useCallback(async () => {
    if (!rateModal || !rateValue) return
    setLoading('rate')
    try {
      await dailyPayments.setTaxiRate(rateModal._id, parseFloat(rateValue))
      setRateModal(null); refreshT()
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed') }
    finally { setLoading(null) }
  }, [rateModal, rateValue])

  const handleSaveTaxi = useCallback(async () => {
    if (!taxiModal) return
    setLoading('taxi')
    try {
      await taxis.update(taxiModal._id, {
        plateNumber: taxiPlate || undefined,
        model: taxiModel || undefined,
        year: taxiYear ? parseInt(taxiYear) : undefined,
        color: taxiColor || undefined,
      })
      setTaxiModal(null); refreshT()
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed') }
    finally { setLoading(null) }
  }, [taxiModal, taxiPlate, taxiModel, taxiYear, taxiColor])

  const handleSaveDriver = useCallback(async () => {
    if (!driverModal) return
    setLoading('driver')
    try {
      await users.update(driverModal._id, {
        name: driverName || undefined,
        phone: driverPhone || undefined,
        address: driverAddress || undefined,
        licenseNumber: driverLicense || undefined,
      })
      setDriverModal(null); refreshD()
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed') }
    finally { setLoading(null) }
  }, [driverModal, driverName, driverPhone, driverAddress, driverLicense])

  const sections: { key: Section; label: string; icon: string; color: string }[] = [
    { key: 'rates', label: 'Taxi Rates', icon: 'cash-multiple', color: colors.success },
    { key: 'taxis', label: 'Taxis', icon: 'car-cog', color: colors.primary },
    { key: 'drivers', label: 'Drivers', icon: 'account-cog', color: colors.info },
  ]

  return (
    <SafeAreaView style={styles.c}>
      <GradientHeader title="Settings" subtitle="Manage taxis, rates & drivers" icon="cog" />
      <ScrollView contentContainerStyle={styles.sc} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        <View style={styles.sectionRow}>
          {sections.map(s => (
            <TouchableOpacity key={s.key} style={[styles.sectionBtn, section === s.key && { backgroundColor: s.color }]}
              onPress={() => setSection(s.key)}>
              <MaterialCommunityIcons name={s.icon as any} size={16} color={section === s.key ? colors.textInverse : colors.textTertiary} />
              <Text style={[styles.sectionBtnT, section === s.key && { color: colors.textInverse }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {section === 'rates' && (
          <>
            <Text style={styles.sectionTitle}>Taxi Daily Rates</Text>
            {tLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ padding: 40 }} /> :
              taxiList.filter(t => t.isActive).map((taxi: any) => (
                <TouchableOpacity key={taxi._id} style={styles.listRow} onPress={() => { setRateModal(taxi); setRateValue(String(taxi.dailyRate || '')) }}>
                  <View style={[styles.listIcon, { backgroundColor: colors.successLight }]}>
                    <MaterialCommunityIcons name="car" size={18} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{taxi.plateNumber}</Text>
                    <Text style={styles.listSub}>{taxi.model}{taxi.assignedDriver?.name ? ` · ${taxi.assignedDriver.name}` : ''}</Text>
                  </View>
                  <View style={styles.listRight}>
                    <Text style={styles.listValue}>{fmt(taxi.dailyRate)}/d</Text>
                    <MaterialCommunityIcons name="pencil" size={14} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))
            }
          </>
        )}

        {section === 'taxis' && (
          <>
            <Text style={styles.sectionTitle}>Edit Taxi Info</Text>
            {tLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ padding: 40 }} /> :
              taxiList.map((taxi: any) => (
                <TouchableOpacity key={taxi._id} style={styles.listRow} onPress={() => {
                  setTaxiModal(taxi); setTaxiPlate(taxi.plateNumber || ''); setTaxiModel(taxi.model || '')
                  setTaxiYear(String(taxi.year || '')); setTaxiColor(taxi.color || '')
                }}>
                  <View style={[styles.listIcon, { backgroundColor: colors.primaryLight + '15' }]}>
                    <MaterialCommunityIcons name="car" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{taxi.plateNumber}</Text>
                    <Text style={styles.listSub}>{taxi.model}{taxi.year ? ` · ${taxi.year}` : ''}{taxi.color ? ` · ${taxi.color}` : ''}</Text>
                    <Text style={styles.listSub}>{taxi.assignedDriver?.name || 'No driver'}</Text>
                  </View>
                  <View style={styles.listRight}>
                    <View style={[styles.listBadge, { backgroundColor: taxi.isActive ? colors.successLight : colors.dangerLight }]}>
                      <Text style={[styles.listBadgeT, { color: taxi.isActive ? colors.success : colors.danger }]}>{taxi.isActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                    <MaterialCommunityIcons name="pencil" size={14} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))
            }
          </>
        )}

        {section === 'drivers' && (
          <>
            <Text style={styles.sectionTitle}>Edit Driver Info</Text>
            {dLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ padding: 40 }} /> :
              driverList.map((driver: any) => (
                <TouchableOpacity key={driver._id} style={styles.listRow} onPress={() => {
                  setDriverModal(driver); setDriverName(driver.name || ''); setDriverPhone(driver.phone || '')
                  setDriverAddress(driver.address || ''); setDriverLicense(driver.licenseNumber || '')
                }}>
                  <View style={[styles.listIcon, { backgroundColor: colors.infoLight }]}>
                    <MaterialCommunityIcons name="account" size={18} color={colors.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{driver.name}</Text>
                    <Text style={styles.listSub}>{driver.phone || 'No phone'}</Text>
                    {driver.licenseNumber ? <Text style={styles.listSub}>License: {driver.licenseNumber}</Text> : null}
                  </View>
                  <View style={styles.listRight}>
                    <View style={[styles.listBadge, { backgroundColor: driver.isActive !== false ? colors.successLight : colors.dangerLight }]}>
                      <Text style={[styles.listBadgeT, { color: driver.isActive !== false ? colors.success : colors.danger }]}>{driver.isActive !== false ? 'Active' : 'Inactive'}</Text>
                    </View>
                    <MaterialCommunityIcons name="pencil" size={14} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))
            }
          </>
        )}
      </ScrollView>

      <Modal visible={!!rateModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mO}>
          <View style={styles.mM}>
            <View style={styles.mHeader}><MaterialCommunityIcons name="cash-multiple" size={22} color={colors.success} /><Text style={styles.mT}>Set Daily Rate</Text></View>
            <Text style={styles.mSub}>{rateModal?.plateNumber} · {rateModal?.assignedDriver?.name || 'No driver'}</Text>
            <Text style={styles.mL}>Daily Rate (NPR)</Text>
            <TextInput style={styles.mI} value={rateValue} onChangeText={setRateValue} keyboardType="numeric" placeholder="Enter rate" />
            <View style={styles.mAct}>
              <TouchableOpacity style={styles.canB} onPress={() => setRateModal(null)}><Text style={styles.canBT}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveB} onPress={handleSetRate}>
                {loading === 'rate' ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.saveBT}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!taxiModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mO}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.mM}>
              <View style={styles.mHeader}><MaterialCommunityIcons name="car-cog" size={22} color={colors.primary} /><Text style={styles.mT}>Edit Taxi</Text></View>
              <Text style={styles.mL}>Plate Number</Text>
              <TextInput style={styles.mI} value={taxiPlate} onChangeText={setTaxiPlate} placeholder="Plate number" />
              <Text style={styles.mL}>Model</Text>
              <TextInput style={styles.mI} value={taxiModel} onChangeText={setTaxiModel} placeholder="Car model" />
              <Text style={styles.mL}>Year</Text>
              <TextInput style={styles.mI} value={taxiYear} onChangeText={setTaxiYear} keyboardType="numeric" placeholder="Year" />
              <Text style={styles.mL}>Color</Text>
              <TextInput style={styles.mI} value={taxiColor} onChangeText={setTaxiColor} placeholder="Color" />
              <View style={styles.mAct}>
                <TouchableOpacity style={styles.canB} onPress={() => setTaxiModal(null)}><Text style={styles.canBT}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveB} onPress={handleSaveTaxi}>
                  {loading === 'taxi' ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.saveBT}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!driverModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mO}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.mM}>
              <View style={styles.mHeader}><MaterialCommunityIcons name="account-cog" size={22} color={colors.info} /><Text style={styles.mT}>Edit Driver</Text></View>
              <Text style={styles.mL}>Name</Text>
              <TextInput style={styles.mI} value={driverName} onChangeText={setDriverName} placeholder="Driver name" />
              <Text style={styles.mL}>Phone</Text>
              <TextInput style={styles.mI} value={driverPhone} onChangeText={setDriverPhone} keyboardType="phone-pad" placeholder="Phone number" />
              <Text style={styles.mL}>Address</Text>
              <TextInput style={styles.mI} value={driverAddress} onChangeText={setDriverAddress} placeholder="Address" />
              <Text style={styles.mL}>License Number</Text>
              <TextInput style={styles.mI} value={driverLicense} onChangeText={setDriverLicense} placeholder="License number" />
              <View style={styles.mAct}>
                <TouchableOpacity style={styles.canB} onPress={() => setDriverModal(null)}><Text style={styles.canBT}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveB} onPress={handleSaveDriver}>
                  {loading === 'driver' ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.saveBT}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  sc: { padding: spacing.lg, paddingBottom: 100 },
  sectionRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },
  sectionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
  sectionBtnT: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.borderLight },
  listIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  listTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  listSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  listRight: { alignItems: 'flex-end', gap: 4 },
  listValue: { fontSize: 14, fontWeight: '700', color: colors.success },
  listBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.sm },
  listBadgeT: { fontSize: 10, fontWeight: '600' },
  mO: { flex: 1, justifyContent: 'center', backgroundColor: colors.overlay, padding: spacing.xxl },
  mM: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxl },
  mHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  mT: { fontSize: 18, fontWeight: '700', color: colors.text },
  mSub: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg },
  mL: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  mI: { borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 15, color: colors.text, backgroundColor: colors.surfaceSecondary },
  mAct: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  canB: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  canBT: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  saveB: { flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: borderRadius.md, alignItems: 'center' },
  saveBT: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
})
