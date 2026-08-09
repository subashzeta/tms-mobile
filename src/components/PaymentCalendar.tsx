import React, { useState, useMemo, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { reports } from '../api/endpoints'

interface TaxiEntry {
  taxiId: string
  plateNumber: string
  color: string
  driverName?: string
}

interface CalendarData {
  calendar: Record<string, TaxiEntry[]>
  leaves?: Record<string, TaxiEntry[]>
  pending?: Record<string, TaxiEntry[]>
  taxis: (TaxiEntry & { driverName: string })[]
}

interface PaymentCalendarProps {
  year: number
  month: number
  onMonthChange?: (year: number, month: number) => void
  showLegend?: boolean
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

function pad(n: number) { return n < 10 ? '0' + n : String(n) }

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`
}

export function PaymentCalendar({
  year, month, onMonthChange, showLegend = true,
}: PaymentCalendarProps) {
  const [calData, setCalData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showTaxiLegend, setShowTaxiLegend] = useState(false)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const todayStr = useMemo(() => {
    const d = new Date()
    return toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }, [])

  useEffect(() => {
    loadCalendarData()
  }, [year, month])

  const loadCalendarData = async () => {
    setLoading(true)
    try {
      const data = await reports.getPaymentCalendar({ month, year })
      setCalData(data)
    } catch {
      setCalData(null)
    } finally {
      setLoading(false)
    }
  }

  const days = useMemo(() => {
    const result: { dateStr: string; day: number; entries: TaxiEntry[]; isToday: boolean; isPast: boolean; isFuture: boolean }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateStr(year, month, d)
      const isFuture = dateStr > todayStr
      const isPast = dateStr < todayStr
      result.push({
        dateStr,
        day: d,
        entries: calData?.calendar?.[dateStr] || [],
        isToday: dateStr === todayStr,
        isPast,
        isFuture,
      })
    }
    return result
  }, [daysInMonth, year, month, calData, todayStr])

  const selectedEntries = selectedDate ? calData?.calendar?.[selectedDate] || [] : []
  const selectedLeaves = selectedDate ? calData?.leaves?.[selectedDate] || [] : []
  const selectedPending = selectedDate ? calData?.pending?.[selectedDate] || [] : []
  const allTaxis = calData?.taxis || []

  const totalTaxis = allTaxis.length
  const daysWithPayments = Object.keys(calData?.calendar || {}).length

  if (loading && !calData) {
    return (
      <View style={styles.loadingCentered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    )
  }

  const goPrev = () => {
    const newMonth = month === 1 ? 12 : month - 1
    const newYear = month === 1 ? year - 1 : year
    onMonthChange?.(newYear, newMonth)
  }

  const goNext = () => {
    const newMonth = month === 12 ? 1 : month + 1
    const newYear = month === 12 ? year + 1 : year
    onMonthChange?.(newYear, newMonth)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrev} style={styles.arrowBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.monthYear}>{MONTHS[month - 1]} {year}</Text>
        <TouchableOpacity onPress={goNext} style={styles.arrowBtn}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={loadCalendarData} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      <View style={styles.dayRow}>
        {DAYS.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
      </View>

      <View style={styles.daysGrid}>
        {Array.from({ length: firstDay }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}
        {days.map((day) => {
          const isSelected = selectedDate === day.dateStr
          const paidEntries = calData?.calendar?.[day.dateStr] || []
          const leaveEntries = calData?.leaves?.[day.dateStr] || []
          const pendingEntries = calData?.pending?.[day.dateStr] || []
          const hasPayments = paidEntries.length > 0
          const hasLeave = leaveEntries.length > 0
          const hasPending = pendingEntries.length > 0
          const isToday = day.isToday
          const isFuture = day.isFuture
          const isPast = day.isPast

          let bgColor = '#fff'
          if (isToday) bgColor = '#EFF6FF'
          else if (hasLeave) bgColor = '#FEE2E2'
          else if (hasPending) bgColor = '#FEF3C7'
          else if (hasPayments) bgColor = '#D1FAE5'
          else if (isPast) bgColor = '#FEF2F2'

          const dotColor = hasLeave ? '#DC2626' : hasPending ? '#D97706' : undefined

          return (
            <TouchableOpacity
              key={day.dateStr}
              style={[
                styles.dayCell,
                { backgroundColor: bgColor },
                isToday && styles.dayToday,
                isSelected && styles.daySelected,
              ]}
              onPress={() => setSelectedDate(isSelected ? null : day.dateStr)}
              disabled={isFuture}
            >
              <Text style={[
                styles.dayText,
                isToday && styles.dayTextToday,
                isFuture && styles.dayTextFuture,
                (hasPayments || hasLeave || hasPending) && styles.dayTextPaid,
                hasLeave && styles.dayTextLeave,
              ]}>
                {day.day}
              </Text>
              {(hasPayments || hasLeave || hasPending) && (
                <View style={styles.dotsRow}>
                  {paidEntries.slice(0, 2).map((e) => (
                    <View key={e.taxiId} style={[styles.dayDot, { backgroundColor: e.color }]} />
                  ))}
                  {hasLeave && <View style={[styles.dayDot, { backgroundColor: '#DC2626' }]} />}
                  {hasPending && <View style={[styles.dayDot, { backgroundColor: '#D97706' }]} />}
                  {(paidEntries.length + (hasLeave ? 1 : 0) + (hasPending ? 1 : 0)) > 3 && (
                    <Text style={styles.dayDotMore}>+</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {selectedDate && (
        <View style={styles.selectedPanel}>
          <Text style={styles.selectedDate}>{selectedDate}</Text>
          {selectedEntries.length === 0 && selectedLeaves.length === 0 && selectedPending.length === 0 ? (
            <Text style={styles.noEntries}>No records for this date</Text>
          ) : (
            <>
              {selectedEntries.map((e) => (
                <View key={e.taxiId} style={styles.entryRow}>
                  <View style={[styles.entryDot, { backgroundColor: e.color }]} />
                  <Text style={styles.entryPlate}>{e.plateNumber}</Text>
                  <Text style={styles.entryTag}>paid</Text>
                </View>
              ))}
              {selectedLeaves.map((e) => (
                <View key={`l-${e.taxiId}`} style={styles.entryRow}>
                  <View style={[styles.entryDot, { backgroundColor: '#DC2626' }]} />
                  <Text style={styles.entryPlate}>{e.plateNumber}</Text>
                  <Text style={styles.entryTagLeave}>leave</Text>
                </View>
              ))}
              {selectedPending.map((e) => (
                <View key={`pd-${e.taxiId}`} style={styles.entryRow}>
                  <View style={[styles.entryDot, { backgroundColor: '#D97706' }]} />
                  <Text style={styles.entryPlate}>{e.plateNumber}</Text>
                  <Text style={styles.entryTagPending}>pending</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#059669' }]} />
          <Text style={styles.summaryText}>Paid: {daysWithPayments}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.summaryText}>Leave: {Object.keys(calData?.leaves || {}).length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#D97706' }]} />
          <Text style={styles.summaryText}>Pending: {Object.keys(calData?.pending || {}).length}</Text>
        </View>
        {totalTaxis > 0 && (
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="car" size={12} color="#6B7280" />
            <Text style={styles.summaryText}>Taxis: {totalTaxis}</Text>
          </View>
        )}
      </View>

      {showLegend && allTaxis.length > 0 && (
        <>
          <TouchableOpacity
            onPress={() => setShowTaxiLegend(!showTaxiLegend)}
            style={styles.legendToggle}
          >
            <MaterialCommunityIcons name="information-outline" size={14} color="#3B82F6" />
            <Text style={styles.legendToggleText}>
              {showTaxiLegend ? 'Hide' : 'Show'} taxi colors ({allTaxis.length})
            </Text>
          </TouchableOpacity>

          {showTaxiLegend && (
            <View style={styles.legend}>
              {allTaxis.map((t) => (
                <View key={t.taxiId} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: t.color }]} />
                  <Text style={styles.legendText}>{t.plateNumber}</Text>
                  {t.driverName ? <Text style={styles.legendDriver}>({t.driverName})</Text> : null}
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <View style={styles.legendSimple}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#059669' }]} /><Text style={styles.legendText}>Paid</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} /><Text style={styles.legendText}>Leave</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#D97706' }]} /><Text style={styles.legendText}>Pending</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#3B82F6' }]} /><Text style={styles.legendText}>Today</Text></View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  arrowBtn: { padding: 4 },
  refreshBtn: { padding: 4, marginLeft: 4 },
  monthYear: { fontSize: 16, fontWeight: '700', color: '#111827' },
  loadingCentered: { padding: 40, alignItems: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6 },
  loadingText: { fontSize: 12, color: '#6B7280' },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', height: 48, justifyContent: 'center', alignItems: 'center',
    borderRadius: 8, position: 'relative',
  },
  dayToday: { borderWidth: 2, borderColor: '#3B82F6' },
  daySelected: { borderWidth: 2, borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  dayText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  dayTextToday: { color: '#1D4ED8', fontWeight: '800' },
  dayTextFuture: { color: '#D1D5DB' },
  dayTextPaid: { fontWeight: '700', color: '#065F46' },
  dayTextLeave: { color: '#DC2626' },
  entryTag: { fontSize: 10, color: '#059669', marginLeft: 'auto' },
  entryTagLeave: { fontSize: 10, color: '#DC2626', marginLeft: 'auto' },
  entryTagPending: { fontSize: 10, color: '#D97706', marginLeft: 'auto' },
  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 2, alignItems: 'center' },
  dayDot: { width: 5, height: 5, borderRadius: 2.5 },
  dayDotMore: { fontSize: 7, color: '#9CA3AF' },
  selectedPanel: { marginTop: 12, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  selectedDate: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 8 },
  noEntries: { fontSize: 12, color: '#9CA3AF' },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  entryDot: { width: 10, height: 10, borderRadius: 5 },
  entryPlate: { fontSize: 13, fontWeight: '600', color: '#111827' },
  entryDriver: { fontSize: 11, color: '#6B7280' },
  summaryRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  legendSimple: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  legendToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingVertical: 4 },
  legendToggleText: { fontSize: 12, color: '#3B82F6', fontWeight: '500' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280' },
  legendDriver: { fontSize: 10, color: '#9CA3AF' },
})
