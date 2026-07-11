export interface User {
  _id: string
  name: string
  email: string
  role: string
  organization?: { _id: string; name: string } | string
  taxi?: { _id: string; plateNumber: string }
  phone?: string
}

export interface LoginData {
  token: string
  organization: { _id: string; name: string; code: string }
  user: User
}

export interface Taxi {
  _id: string
  plateNumber: string
  model: string
  year: number
  color: string
  dailyRate?: number
  isActive: boolean
  assignedDriver?: { _id: string; name: string; phone?: string }
}

export interface Driver {
  _id: string
  name: string
  phone?: string
  email?: string
  licenseNumber?: string
  isActive: boolean
  assignedTaxi?: { _id: string; plateNumber: string; dailyRate: number }
  organization?: { _id: string; name: string }
}

export interface Income {
  _id: string
  taxi?: { _id: string; plateNumber: string; dailyRate: number }
  driver?: { _id: string; name: string }
  date: string
  amount: number
  verifiedAt?: string
  verifiedBy?: { _id: string; name: string }
  notes?: string
}

export interface DailyPayment {
  _id: string
  date: string
  dateRangeEnd?: string
  amountDue: number
  amountPaid: number
  status: string
  taxi?: { _id: string; plateNumber: string; dailyRate: number }
  driver?: { name: string; phone?: string }
  paidAt?: string
  receivedBy?: { name: string }
  paymentMethod?: string
  paymentAccount?: string
  proofImageUrl?: string
  submittedAt?: string
  approvedBy?: { name: string }
  approvalNotes?: string
  notes?: string
}

export interface Expenditure {
  _id: string
  amount: number
  category: string
  date: string
  description?: string
  vendor?: string
  taxi?: { _id: string; plateNumber: string }
  driver?: { _id: string; name: string }
  recordedBy?: { name: string }
  receiptFileUrl?: string
}

export interface LeaveDay {
  _id: string
  date: string
  taxi: { _id: string; plateNumber: string }
  reason?: string
  createdAt?: string
}

export interface Document {
  _id: string
  type: string
  ownerModel: string
  expiryDate?: string
  isExpired: boolean
  documentFileUrl?: string
  notes?: string
  owner?: { _id: string; plateNumber?: string; name?: string }
}

export interface DashboardStats {
  taxis: { total: number; active: number }
  drivers: { total: number }
  income: { total: number; totalCount: number; today: number; todayCount: number; weekly: number; weeklyCount: number }
  expenditure: { total: number }
  dailyPayments: { totalCollected: number; totalDue: number; pendingApprovals: number; grandTotalCollected: number }
  extraPayments: { pendingTotal: number; pendingCount: number }
  documents: { expiringSoon: number }
  leaves: { thisMonth: number }
}

export interface PendingByTaxiItem {
  taxi: { _id: string; plateNumber: string; dailyRate: number }
  driver: { _id: string; name: string; phone?: string }
  totalDays: number
  workingDays: number
  paidDays: number
  pendingDays: number
  leaveDays?: number
  expectedAmount: number
  paidAmount: number
  outstandingAmount: number
  pendingDates: string[]
  bsMonth: string
  bsYear: number
}

export interface ApiResponse<T> {
  data: T
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ExtraPayment {
  _id: string
  taxi?: { _id: string; plateNumber: string }
  driver?: { _id: string; name: string }
  amount: number
  reason?: string
  status: 'pending' | 'paid'
  paymentMethod?: string
  paymentAccount?: string
  notes?: string
  date: string
  recordedBy?: { _id: string; name: string }
  paidAt?: string
}

export interface PaymentAccount {
  _id: string
  label: string
  method: string
  isActive: boolean
}

export interface IncomeStats {
  totalIncome: number
  totalExpenditure: number
  net: number
  totalPayments: number
  todayIncome: number
  weeklyIncome: number
  monthlyIncome: number
}

export interface Notification {
  _id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface Organization {
  _id: string
  name: string
  code: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  isActive: boolean
  reportEmailTo?: string[]
}

export interface CollectionByMethod {
  _id: string
  label: string
  method: string
  total: number
  count: number
}

export interface IncomeStatsData {
  totalIncome: number
  totalExpenditure: number
  net: number
  totalPayments: number
  todayIncome: number
  weeklyIncome: number
  monthlyIncome: number
  chartData?: { date: string; amount: number }[]
}

export interface ChartDataPoint {
  date: string
  amount: number
}

export interface SettingValue {
  key: string
  value: any
}

export interface PaymentLocation {
  latitude: number
  longitude: number
  address?: string
  radius?: number
}

export interface BankQR {
  _id: string
  code: string
  tmsToken: string
  qrImageUrl?: string
  isActive: boolean
}

export interface CalendarPreference {
  calendar: 'english' | 'nepali'
}
