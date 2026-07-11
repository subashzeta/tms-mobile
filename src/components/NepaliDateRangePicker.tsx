import React, { useState, useMemo, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import NepaliDate from 'nepali-date-converter'
import { colors, spacing, borderRadius, shadow, typography } from '../theme'

const BS_MONTHS = ['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Aswin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra']
const AD_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(year: number, month: number): number {
  let count = 0
  while (true) {
    try { const d = new NepaliDate(year, month, count + 1); if (d.getMonth() !== month) break; count++ }
    catch { break }
  }
  return count
}

function adStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function bsStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parseAD(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export type CalendarMode = 'nepali' | 'english'

export interface DateRange {
  from: string
  to: string
}

interface DayInfo {
  bsYear: number
  bsMonth: number
  bsDate: number
  adYear: number
  adMonth: number
  adDate: number
  adStr: string
  bsStr: string
  dayOfWeek: number
  isToday: boolean
  isFuture: boolean
  isPaid: boolean
  isMarked: boolean
  isUnallocated: boolean
  isBeforeAssign: boolean
  inRange: boolean
  isRangeStart: boolean
  isRangeEnd: boolean
}

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
  paidDates?: string[]
  markedDates?: string[]
  unallocatedDates?: string[]
  assignDate?: string
  maxDate?: string
  showQuickSelect?: boolean
  label?: string
}

export default function NepaliDateRangePicker({
  value, onChange, paidDates = [], markedDates = [], unallocatedDates = [],
  assignDate, maxDate, showQuickSelect = true, label,
}: Props) {
  const today = useMemo(() => new NepaliDate(), [])
  const todayBS = today.getBS()
  const [calMode, setCalMode] = useState<CalendarMode>('nepali')
  const [bsYear, setBsYear] = useState(todayBS.year)
  const [bsMonth, setBsMonth] = useState(todayBS.month)
  const [adYear, setAdYear] = useState(todayBS.year - 57)
  const [adMonth, setAdMonth] = useState(todayBS.month + 2)
  const [selectPhase, setSelectPhase] = useState<'from' | 'to'>(!value.from ? 'from' : !value.to ? 'to' : 'from')
  const [tempRange, setTempRange] = useState<DateRange>(value)
  const [showCalendar, setShowCalendar] = useState(false)

  const yesterday = new NepaliDate()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayAD = yesterday.getAD()
  const maxDateStr = maxDate || adStr(yesterdayAD.year, yesterdayAD.month, yesterdayAD.date)

  const paidSet = useMemo(() => new Set(paidDates), [paidDates])
  const markedSet = useMemo(() => new Set(markedDates), [markedDates])
  const unallocSet = useMemo(() => new Set(unallocatedDates), [unallocatedDates])
  const assignDateStr = assignDate || '2000-01-01'

  const daysInMonth = useMemo(() => getDaysInMonth(bsYear, bsMonth), [bsYear, bsMonth])
  const firstDay = useMemo(() => new NepaliDate(bsYear, bsMonth, 1).getDay(), [bsYear, bsMonth])

  const days: DayInfo[] = useMemo(() => {
    const result: DayInfo[] = []
    const nowBS = todayBS
    for (let d = 1; d <= daysInMonth; d++) {
      const nd = new NepaliDate(bsYear, bsMonth, d)
      const ad = nd.getAD()
      const adS = adStr(ad.year, ad.month, ad.date)
      const isFuture = adS > maxDateStr
      const inRange = tempRange.from && tempRange.to ? adS >= tempRange.from && adS <= tempRange.to : false
      result.push({
        bsYear, bsMonth, bsDate: d,
        adYear: ad.year, adMonth: ad.month, adDate: ad.date,
        adStr: adS, bsStr: bsStr(bsYear, bsMonth, d),
        dayOfWeek: nd.getDay(),
        isToday: bsYear === nowBS.year && bsMonth === nowBS.month && d === nowBS.date,
        isFuture,
        isPaid: paidSet.has(adS),
        isMarked: markedSet.has(adS),
        isUnallocated: unallocSet.has(adS),
        isBeforeAssign: adS < assignDateStr,
        inRange,
        isRangeStart: adS === tempRange.from,
        isRangeEnd: adS === tempRange.to,
      })
    }
    return result
  }, [bsYear, bsMonth, daysInMonth, paidSet, markedSet, unallocSet, tempRange, maxDateStr, assignDateStr])

  const handleDayPress = useCallback((day: DayInfo) => {
    if (day.isFuture || day.isBeforeAssign || day.isPaid || day.isMarked) return
    if (selectPhase === 'from') {
      const newRange = { from: day.adStr, to: '' }
      setTempRange(newRange)
      setSelectPhase('to')
    } else {
      let from = tempRange.from
      let to = day.adStr
      if (day.adStr < from) { from = day.adStr; to = tempRange.from || day.adStr }
      const newRange = { from, to }
      setTempRange(newRange)
      setSelectPhase('from')
      onChange(newRange)
    }
  }, [selectPhase, tempRange, onChange])

  const handleQuickSelect = useCallback((daysCount: number) => {
    const dates: string[] = []
    const cursor = new Date()
    cursor.setDate(cursor.getDate() - 1)
    while (dates.length < daysCount && cursor >= new Date('2020-01-01')) {
      const s = adStr(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
      if (!paidSet.has(s) && !markedSet.has(s) && !unallocSet.has(s)) {
        dates.push(s)
      } else if (dates.length > 0) {
        break
      }
      cursor.setDate(cursor.getDate() - 1)
    }
    if (dates.length > 0) {
      const from = dates[dates.length - 1]
      const to = dates[0]
      const newRange = { from, to }
      setTempRange(newRange)
      setSelectPhase('from')
      onChange(newRange)
    }
  }, [paidSet, markedSet, unallocSet, onChange])

  const daysInRange = useMemo(() => {
    if (!tempRange.from || !tempRange.to) return 0
    const f = parseAD(tempRange.from)
    const t = parseAD(tempRange.to)
    if (!f || !t) return 0
    return Math.round((t.getTime() - f.getTime()) / (86400000)) + 1
  }, [tempRange])

  const navigateMonth = useCallback((dir: number) => {
    let newY = bsYear, newM = bsMonth + dir
    if (newM < 0) { newY--; newM = 11 }
    if (newM > 11) { newY++; newM = 0 }
    setBsYear(newY); setBsMonth(newM)
  }, [bsYear, bsMonth])

  const getDayColor = useCallback((day: DayInfo) => {
    if (day.isRangeStart || day.isRangeEnd) return colors.textInverse
    if (day.isFuture || day.isBeforeAssign) return colors.textTertiary
    if (day.inRange) return colors.primary
    return colors.text
  }, [])

  const getDayBg = useCallback((day: DayInfo) => {
    if (day.isRangeStart || day.isRangeEnd) return colors.primary
    if (day.inRange) return colors.primaryLight + '20'
    if (day.isToday) return colors.infoLight
    return 'transparent'
  }, [])

  const getStatusColor = useCallback((day: DayInfo) => {
    if (day.isPaid) return colors.success
    if (day.isMarked) return colors.pink
    if (day.isUnallocated) return colors.textTertiary
    return null
  }, [])

  const toBS = useCallback((ad: string) => {
    const d = parseAD(ad)
    if (!d) return ad
    const nd = new NepaliDate(d)
    const b = nd.getBS()
    return `${b.year} ${BS_MONTHS[b.month]} ${b.date}`
  }, [])

  const selectedLabel = useMemo(() => {
    if (!tempRange.from) return 'Select start date'
    if (!tempRange.to) return 'Select end date'
    const f = parseAD(tempRange.from)
    const t = parseAD(tempRange.to)
    const label = calMode === 'nepali'
      ? `${toBS(tempRange.from)} → ${toBS(tempRange.to)}`
      : `${formatDate(f!)} → ${formatDate(t!)}`
    return `${label} (${daysInRange} day${daysInRange > 1 ? 's' : ''})`
  }, [tempRange, calMode, daysInRange])

  if (!showCalendar) {
    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCalendar(true)}>
          <MaterialCommunityIcons name="calendar-range" size={18} color={colors.primary} />
          <Text style={[styles.pickerText, !tempRange.from && styles.pickerPlaceholder]}>
            {tempRange.from ? selectedLabel : 'Select date range'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
        {tempRange.from && daysInRange > 0 && (
          <Text style={styles.daysBadge}>{daysInRange} day{daysInRange > 1 ? 's' : ''}</Text>
        )}
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.calContainer}>
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.calTitle}>{BS_MONTHS[bsMonth]} {bsYear}</Text>
          <TouchableOpacity onPress={() => setCalMode(calMode === 'nepali' ? 'english' : 'nepali')} style={[styles.navBtn, { paddingHorizontal: 8 }]}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.primary }}>{calMode === 'nepali' ? 'AD' : 'BS'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {showQuickSelect && (
          <View style={styles.quickRow}>
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <TouchableOpacity key={n} style={styles.quickBtn} onPress={() => handleQuickSelect(n)}>
                <Text style={styles.quickBtnText}>{n}d</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.dayNamesRow}>
          {DAY_NAMES.map(d => <Text key={d} style={styles.dayName}>{d}</Text>)}
        </View>

        <View style={styles.daysGrid}>
          {Array.from({ length: firstDay }).map((_, i) => <View key={`e${i}`} style={styles.dayCell} />)}
          {days.map((day, i) => {
            const statusColor = getStatusColor(day)
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayCell, { backgroundColor: getDayBg(day) }]}
                onPress={() => handleDayPress(day)}
                disabled={day.isFuture || day.isBeforeAssign}
              >
                <Text style={[styles.dayText, { color: getDayColor(day), fontWeight: day.isToday ? '800' : '500' }]}>
                  {day.bsDate}
                </Text>
                <Text style={[styles.adDayText, { color: day.isFuture || day.isBeforeAssign ? colors.textTertiary : colors.textTertiary }]}>
                  {day.adDate}
                </Text>
                {statusColor && <View style={[styles.statusDot, { backgroundColor: statusColor }]} />}
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.selectedRange}>{selectedLabel}</Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Paid</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>Pending</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.pink }]} /><Text style={styles.legendText}>Leave</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.textTertiary }]} /><Text style={styles.legendText}>Unalloc</Text></View>
          </View>
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowCalendar(false)}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  pickerButton: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, gap: spacing.sm,
  },
  pickerText: { flex: 1, fontSize: 14, color: colors.text },
  pickerPlaceholder: { color: colors.textTertiary },
  daysBadge: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  calContainer: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, ...shadow.md, marginTop: spacing.sm },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  navBtn: { padding: spacing.sm },
  calTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  quickRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  quickBtn: { flex: 1, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.primaryLight + '15', alignItems: 'center' },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  dayNamesRow: { flexDirection: 'row', marginBottom: spacing.xs },
  dayName: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.textTertiary },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: borderRadius.sm, position: 'relative' },
  dayText: { fontSize: 14 },
  adDayText: { fontSize: 8, marginTop: 1 },
  statusDot: { position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: 2.5 },
  footer: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.md },
  selectedRange: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  legend: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.textSecondary },
  footerActions: { flexDirection: 'row', justifyContent: 'center' },
  doneBtn: { paddingVertical: 8, paddingHorizontal: 32, backgroundColor: colors.primary, borderRadius: borderRadius.sm },
  doneBtnText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
})
