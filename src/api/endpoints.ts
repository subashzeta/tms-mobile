import client from './client'

// Note: The API returns res.data.data for all endpoints

export const auth = {
  login: (email: string, password: string) =>
    client.post('/auth/login', { email, password }).then(r => r.data.data),
  register: (data: any) =>
    client.post('/auth/register', data).then(r => r.data.data),
  logout: () =>
    client.post('/auth/logout').then(r => r.data),
  me: () =>
    client.get('/auth/me').then(r => r.data.data),
  refreshToken: (refreshToken: string) =>
    client.post('/auth/refresh', { refreshToken }).then(r => r.data.data),
}

export const users = {
  getAll: (params?: any) =>
    client.get('/users', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  getById: (id: string) =>
    client.get(`/users/${id}`).then(r => r.data.data),
  create: (data: any) =>
    client.post('/users', data).then(r => r.data.data),
  update: (id: string, data: any) =>
    client.patch(`/users/${id}`, data).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/users/${id}`).then(r => r.data),
  getDrivers: (params?: any) =>
    client.get('/users/drivers', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  getManagers: (params?: any) =>
    client.get('/users/managers', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  getEmployees: (params?: any) =>
    client.get('/users/employees', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
}

export const taxis = {
  list: (params?: any) =>
    client.get('/taxis', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  get: (id: string) =>
    client.get(`/taxis/${id}`).then(r => r.data.data),
  create: (data: any) =>
    client.post('/taxis', data).then(r => r.data.data),
  update: (id: string, data: any) =>
    client.patch(`/taxis/${id}`, data).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/taxis/${id}`).then(r => r.data),
  assignDriver: (taxiId: string, driverId: string) =>
    client.post(`/taxis/${taxiId}/assign-driver`, { driverId }).then(r => r.data.data),
}

export const income = {
  list: (params?: any) =>
    client.get('/income', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  getById: (id: string) =>
    client.get(`/income/${id}`).then(r => r.data.data),
  create: (data: any) =>
    client.post('/income', data).then(r => r.data.data),
  verify: (id: string) =>
    client.patch(`/income/${id}/verify`).then(r => r.data.data),
  unverify: (id: string) =>
    client.patch(`/income/${id}/unverify`).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/income/${id}`).then(r => r.data),
  getStats: (params?: any) =>
    client.get('/income/stats', { params }).then(r => r.data.data),
  getChartData: (period: string, params?: any) =>
    client.get('/income/chart', { params: { period, ...params } }).then(r => r.data.data),
}

export const expenditure = {
  list: (params?: any) =>
    client.get('/expenditures', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  getById: (id: string) =>
    client.get(`/expenditures/${id}`).then(r => r.data.data),
  create: (data: any) =>
    client.post('/expenditures', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }).then(r => r.data.data),
  update: (id: string, data: any) =>
    client.patch(`/expenditures/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/expenditures/${id}`).then(r => r.data),
  approve: (id: string) =>
    client.patch(`/expenditures/${id}/approve`).then(r => r.data.data),
}

export const dailyPayments = {
  list: (params?: any) =>
    client.get('/daily-payments', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  getById: (id: string) =>
    client.get(`/daily-payments/${id}`).then(r => r.data.data),
  record: (data: any) =>
    client.post('/daily-payments', data).then(r => r.data.data),
  update: (id: string, data: any) =>
    client.patch(`/daily-payments/${id}`, data).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/daily-payments/${id}`).then(r => r.data),
  recordPayment: (id: string, amountPaid: number, notes?: string) =>
    client.patch(`/daily-payments/${id}/pay`, { amountPaid, notes }).then(r => r.data.data),
  getPendingByTaxi: (params?: any) =>
    client.get('/daily-payments/pending-by-taxi', { params }).then(r => r.data.data),
  getPendingApprovals: (params?: any) =>
    client.get('/daily-payments/pending-approvals', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  approve: (id: string, notes?: string) =>
    client.patch(`/daily-payments/${id}/approve`, { notes }).then(r => r.data.data),
  reject: (id: string, reason: string) =>
    client.patch(`/daily-payments/${id}/reject`, { reason }).then(r => r.data.data),
  markAsPaid: (id: string, data: any) =>
    client.patch(`/daily-payments/${id}/mark-paid`, data).then(r => r.data.data),
  recordRange: (data: any) =>
    client.post('/daily-payments/record-range', data).then(r => r.data.data), // FormData
  getCalendar: (params?: any) =>
    client.get('/daily-payments/calendar', { params }).then(r => r.data.data),
  getExpectedIncome: (year: number, month: number) =>
    client.get('/daily-payments/expected-income', { params: { year, month } }).then(r => r.data.data),
  submitPayment: (data: any) =>
    client.post('/daily-payments/submit', data).then(r => r.data.data), // FormData
  getPaidDates: (params?: any) =>
    client.get('/daily-payments/paid-dates', { params }).then(r => r.data.data),
  setTaxiRate: (taxiId: string, dailyRate: number) =>
    client.patch(`/daily-payments/taxis/${taxiId}/rate`, { dailyRate }).then(r => r.data.data),
}

export const extraPayments = {
  list: (params?: any) =>
    client.get('/extra-payments', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  getById: (id: string) =>
    client.get(`/extra-payments/${id}`).then(r => r.data.data),
  create: (data: any) =>
    client.post('/extra-payments', data).then(r => r.data.data),
  update: (id: string, data: any) =>
    client.patch(`/extra-payments/${id}`, data).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/extra-payments/${id}`).then(r => r.data),
  markAsPaid: (id: string, data: any) =>
    client.patch(`/extra-payments/${id}/mark-paid`, data).then(r => r.data.data),
  getSummary: (params?: any) =>
    client.get('/extra-payments/summary', { params }).then(r => r.data.data),
}

export const paymentAccounts = {
  list: () =>
    client.get('/daily-payments/accounts').then(r => r.data.data),
  create: (label: string, method: string) =>
    client.post('/daily-payments/accounts', { label, method }).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/daily-payments/accounts/${id}`).then(r => r.data),
}

export const documents = {
  list: (params?: any) =>
    client.get('/documents', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  getById: (id: string) =>
    client.get(`/documents/${id}`).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/documents/${id}`).then(r => r.data),
  getExpiring: (days?: number) =>
    client.get('/documents/expiring', { params: { days } }).then(r => r.data.data),
  // Upload uses FormData
  upload: (data: any) =>
    client.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data),
}

export const leaves = {
  list: (params?: any) =>
    client.get('/leaves', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  create: (date: string, reason?: string, taxiId?: string, driverId?: string) =>
    client.post('/leaves', { date, reason, taxiId, driverId }).then(r => r.data.data),
  batchCreate: (dates: any[], taxiId?: string, driverId?: string) =>
    client.post('/leaves/batch', { dates, taxiId, driverId }).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/leaves/${id}`).then(r => r.data),
  check: (date: string) =>
    client.get('/leaves/check', { params: { date } }).then(r => r.data.data),
}

export const dashboard = {
  stats: (params?: any) =>
    client.get('/dashboard/stats', { params }).then(r => r.data.data),
  getManagerStats: () =>
    client.get('/dashboard/manager/stats').then(r => r.data.data),
  getDriverStats: () =>
    client.get('/dashboard/driver/stats').then(r => r.data.data),
  getCollectionsByMethod: (params?: any) =>
    client.get('/dashboard/collections-by-method', { params }).then(r => r.data.data),
  getDriverPaymentSummary: (params?: any) =>
    client.get('/dashboard/driver-summary', { params }).then(r => r.data.data),
}

export const settings = {
  getPaymentLocation: () =>
    client.get('/settings/payment-location').then(r => r.data.data),
  setPaymentLocation: (data: any) =>
    client.post('/settings/payment-location', data).then(r => r.data.data),
  getBankQR: () =>
    client.get('/settings/bank-qr').then(r => r.data.data),
  uploadBankQR: (data: any) =>
    client.post('/settings/bank-qr', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data),
  validateBankQRToken: (tmsToken: string, latitude?: number, longitude?: number) =>
    client.post('/settings/bank-qr/validate', { tmsToken, latitude, longitude }).then(r => r.data.data),
  getCalendarPreference: () =>
    client.get('/settings/calendar-preference').then(r => r.data.data),
  setCalendarPreference: (calendar: 'english' | 'nepali') =>
    client.post('/settings/calendar-preference', { calendar }).then(r => r.data.data),
}

export const organizations = {
  list: (params?: any) =>
    client.get('/organizations', { params }).then(r => ({ data: r.data.data, pagination: r.data.pagination })),
  getById: (id: string) =>
    client.get(`/organizations/${id}`).then(r => r.data.data),
  create: (data: any) =>
    client.post('/organizations', data).then(r => r.data.data),
  update: (id: string, data: any) =>
    client.patch(`/organizations/${id}`, data).then(r => r.data.data),
  delete: (id: string) =>
    client.delete(`/organizations/${id}`).then(r => r.data),
  addReportEmail: (id: string, email: string) =>
    client.post(`/organizations/${id}/report-email`, { email }).then(r => r.data.data),
  removeReportEmail: (id: string, email: string) =>
    client.delete(`/organizations/${id}/report-email/${encodeURIComponent(email)}`).then(r => r.data),
  resetTaxis: () => client.post('/organizations/reset/taxis').then(r => r.data),
  resetDrivers: () => client.post('/organizations/reset/drivers').then(r => r.data),
  resetPayments: () => client.post('/organizations/reset/payments').then(r => r.data),
}

export const reports = {
  getSummary: (params?: any) =>
    client.get('/reports/summary', { params }).then(r => r.data.data),
  getIncomeReport: (params?: any) =>
    client.get('/reports/income', { params }).then(r => r.data.data),
  getPaymentCalendar: (params?: any) =>
    client.get('/reports/payment-calendar', { params }).then(r => r.data.data),
  getPendingUptoDate: (params?: any) =>
    client.get('/reports/pending-upto-date', { params }).then(r => r.data.data),
  getExportData: (params?: any) =>
    client.get('/reports/export-data', { params }).then(r => r.data.data),
  getTaxiReport: (params?: any) =>
    client.get('/reports/taxi-report', { params }).then(r => r.data.data),
}
