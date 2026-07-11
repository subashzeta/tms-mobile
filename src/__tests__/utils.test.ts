describe('formatCurrency', () => {
  const fn = (n: number | null | undefined) => {
    if (n == null) return '₹ 0'
    return '₹ ' + n.toLocaleString('en-IN')
  }

  it('returns ₹ 0 for null', () => expect(fn(null)).toBe('₹ 0'))
  it('returns ₹ 0 for undefined', () => expect(fn(undefined)).toBe('₹ 0'))
  it('formats positive numbers', () => { expect(fn(5000)).toContain('₹'); expect(fn(5000)).toContain('5') })
  it('formats zero', () => expect(fn(0)).toBe('₹ 0'))
  it('formats large numbers', () => { expect(fn(100000)).toContain('1,00,000') })
})

describe('formatDate', () => {
  const fn = (d: string | null | undefined) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-IN')
  }

  it('returns N/A for null', () => expect(fn(null)).toBe('N/A'))
  it('returns N/A for undefined', () => expect(fn(undefined)).toBe('N/A'))
  it('returns N/A for empty string', () => expect(fn('')).toBe('N/A'))
  it('formats valid date', () => expect(fn('2024-01-15')).toBe('15/1/2024'))
})

describe('safeArray extraction', () => {
  const extract = (data: any): any[] => {
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
  }

  it('extracts .data array', () => expect(extract({ data: [1, 2] })).toEqual([1, 2]))
  it('passes through plain array', () => expect(extract([1, 2])).toEqual([1, 2]))
  it('returns [] for null', () => expect(extract(null)).toEqual([]))
  it('returns [] for undefined', () => expect(extract(undefined)).toEqual([]))
  it('returns [] for empty object', () => expect(extract({})).toEqual([]))
})
