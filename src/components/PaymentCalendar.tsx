import React, { useState, useMemo, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { dailyPayments } from '../api/endpoints'

interface CalendarDay {
  date: number
  fullDate: string
  isCurrentMonth: boolean
  status?: 'paid' | 'partial' | 'pending' | 'leave' | 'unallocated' | 'overdue'
}

interface PaymentCalendarProps {
  year: number
  month: number
  onMonthChange?: (year: number, month: number) => void
  onDayPress?: (day: CalendarDay, selectedDates: string[]) => void
  selectedDates?: string[]
  taxiId?: string
  driverId?: string
  multiSelect?: boolean
  showLegend?: boolean
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function pad(n: number) { return n < 10 ? '0' + n : String(n) }

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  paid: { bg: '#D1FAE5', text: '#065F46', dot: '#059669' },
  partial: { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  pending: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
  leave: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  unallocated: { bg: '#F3F4F6', text: '#9CA3AF', dot: '#9CA3AF' },
  overdue: { bg: '#FEF2F2', text: '#991B1B', dot: '#DC2626' },
}

export function PaymentCalendar({
  year, month, onMonthChange, onDayPress, selectedDates: externalSelected,
  taxiId, driverId, multiSelect = false, showLegend = true,
}: PaymentCalendarProps) {
  const [internalSelected, setInternalSelected] = useState<string[]>([])
  const [paidDates, setPaidDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const selected = externalSelected ?? internalSelected

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const startDate = `${year}-${pad(month)}-01`
  const endDate = `${year}-${pad(month)}-${pad(daysInMonth)}`

  useEffect(() => {
    loadPaidDates()
  }, [year, month, taxiId, driverId])

  const loadPaidDates = async () => {
    setLoading(true)
    try {
      const params: any = { from: startDate, to: endDate }
      if (taxiId) params.taxiId = taxiId
      if (driverId) params.driverId = driverId
      const result = await dailyPayments.getPaidDates(params)
      setPaidDates(Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [])
    } catch {
      setPaidDates([])
    } finally { setLoading(false) }
  }

  const toggleDate = (fullDate: string) => {
    if (!multiSelect && !onDayPress) return
    let newSelected: string[]
    if (multiSelect) {
      if (selected.includes(fullDate)) {
        newSelected = selected.filter(d => d !== fullDate)
      } else {
        newSelected = [...selected, fullDate].sort()
      }
    } else {
      newSelected = selected[0] === fullDate ? [] : [fullDate]
    }
    setInternalSelected(newSelected)
    const day = calendarDays.find(d => d?.fullDate === fullDate)
    if (day) onDayPress?.(day, newSelected)
  }

  const calendarDays: (CalendarDay | null)[] = useMemo(() => {
    const days: (CalendarDay | null)[] = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const fullDate = `${year}-${pad(month)}-${pad(d)}`
      const isPaid = paidDates.includes(fullDate)
      days.push({
        date: d,
        fullDate,
        isCurrentMonth: true,
        status: isPaid ? 'paid' : 'pending',
      })
    }
    return days
  }, [year, month, firstDay, daysInMonth, paidDates])

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

  const paidCount = calendarDays.filter(d => d?.status === 'paid').length
  const pendingCount = calendarDays.filter(d => d?.status === 'pending').length

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
        <TouchableOpacity onPress={loadPaidDates} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      ) : null}

      <View style={styles.dayRow}>
        {DAYS.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.dayCell} />
          const isSelected = selected.includes(day.fullDate)
          const colors = day.status ? statusColors[day.status] : null
          return (
            <TouchableOpacity
              key={day.fullDate}
              style={[
                styles.dayCell,
                day.status === 'paid' && styles.dayPaid,
                day.status === 'pending' && styles.dayPending,
                isSelected && styles.daySelected,
              ]}
              onPress={() => toggleDate(day.fullDate)}
            >
              <Text style={[
                styles.dayText,
                day.status === 'paid' && styles.dayTextPaid,
                day.status === 'pending' && styles.dayTextPending,
                isSelected && styles.dayTextSelected,
              ]}>
                {day.date}
              </Text>
              <View style={[
                styles.dayDot,
                day.status === 'paid' && { backgroundColor: '#059669' },
                day.status === 'pending' && { backgroundColor: '#DC2626' },
              ]} />
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#059669' }]} />
          <Text style={styles.summaryText}>Paid: {paidCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.summaryText}>Pending: {pendingCount}</Text>
        </View>
        {selected.length > 0 && (
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="checkbox-marked" size={14} color="#3B82F6" />
            <Text style={styles.summaryText}>Selected: {selected.length}</Text>
          </View>
        )}
      </View>

      {showLegend && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
            <Text style={styles.legendText}>Paid</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.legendText}>Pending</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
            <Text style={styles.legendText}>Partial</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Leave</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
            <Text style={styles.legendText}>Unallocated</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  arrowBtn: { padding: 4 },
  refreshBtn: { padding: 4, marginLeft: 4 },
  monthYear: { fontSize: 16, fontWeight: '700', color: '#111827' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6 },
  loadingText: { fontSize: 12, color: '#6B7280' },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', height: 44, justifyContent: 'center', alignItems: 'center',
    borderRadius: 8,
  },
  dayPaid: { backgroundColor: '#D1FAE5' },
  dayPending: { backgroundColor: '#FEE2E2' },
  daySelected: { borderWidth: 2, borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  dayText: { fontSize: 13, color: '#374151' },
  dayTextPaid: { color: '#065F46', fontWeight: '600' },
  dayTextPending: { color: '#991B1B', fontWeight: '600' },
  dayTextSelected: { color: '#1D4ED8', fontWeight: '700' },
  dayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#6B7280' },
})
