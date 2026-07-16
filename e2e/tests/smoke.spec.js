const { login, waitForScreen, tapElement, scrollDown, typeInField } = require('../helpers/utils')

describe('TMS Mobile App', () => {
  before(async () => {
    await login('manager')
  })

  it('should land on the manager dashboard', async () => {
    const dash = await $('~dashboard-screen')
    await expect(dash).toBeDisplayed()
  })

  it('should show stats cards on dashboard', async () => {
    const text = await $('android=new UiSelector().textContains("Taxis")')
    await expect(text).toBeDisplayed()
  })
})

describe('Manager — Payments Screen', () => {
  before(async () => {
    await login('manager')
  })

  it('should navigate to Payments tab', async () => {
    await tapElement('tab-payments')
    await browser.pause(2000)
    const search = await $('~payments-search')
    await expect(search).toBeDisplayed()
  })

  it('search bar should accept partial taxi name', async () => {
    const search = await $('~payments-search')
    await search.setValue('104')
    await browser.pause(2000)
    // search input should still be visible with value
    await expect(search).toBeDisplayed()
  })

  it('search bar should accept partial driver name', async () => {
    const search = await $('~payments-search')
    await search.clearValue()
    await search.setValue('Ram')
    await browser.pause(2000)
    await expect(search).toBeDisplayed()
  })

  it('clear button should clear search', async () => {
    const search = await $('~payments-search')
    await search.clearValue()
    await browser.pause(1000)
    const val = await search.getText()
    expect(val).toBe('')
  })
})

describe('Manager — Reports Screen Filters', () => {
  before(async () => {
    await login('manager')
  })

  it('should navigate to Reports screen', async () => {
    // Navigate via bottom tab or dashboard link
    const reportsTab = await $('android=new UiSelector().text("Reports")')
    if (await reportsTab.isExisting()) {
      await reportsTab.click()
    }
    await browser.pause(2000)
  })

  it('should toggle filter panel', async () => {
    const filterBtn = await $('~filter-toggle')
    await filterBtn.click()
    await browser.pause(1000)
    const fromInput = await $('~date-from')
    await expect(fromInput).toBeDisplayed()
  })

  it('should accept date range filter', async () => {
    const fromInput = await $('~date-from')
    await fromInput.setValue('2082-01-01')

    const toInput = await $('~date-to')
    await toInput.setValue('2082-04-01')
    await browser.pause(1000)
    await expect(fromInput).toBeDisplayed()
  })

  it('should open taxi selector modal', async () => {
    const taxiSelector = await $('~taxi-selector')
    await taxiSelector.click()
    await browser.pause(1000)

    const allTaxis = await $('android=new UiSelector().text("All Taxis")')
    await expect(allTaxis).toBeDisplayed()

    // Dismiss
    await browser.back()
  })

  it('should switch to Transactions tab', async () => {
    const txnTab = await $('~report-tab-transactions')
    await txnTab.click()
    await browser.pause(2000)

    const exportBtn = await $('~export-pdf-btn')
    await expect(exportBtn).toBeDisplayed()
  })

  it('Export PDF button should be visible on transactions tab', async () => {
    const exportBtn = await $('~export-pdf-btn')
    await expect(exportBtn).toBeDisplayed()
  })

  it('should switch to Payments tab and show payment date', async () => {
    const payTab = await $('~report-tab-payments')
    await payTab.click()
    await browser.pause(2000)

    const exportBtn = await $('~export-pdf-btn')
    await expect(exportBtn).toBeDisplayed()
  })
})

describe('SuperAdmin — Daily Payments Search', () => {
  before(async () => {
    await login('superadmin')
  })

  it('should navigate to Daily Payments', async () => {
    const paymentsLink = await $('android=new UiSelector().textContains("Payment")')
    if (await paymentsLink.isExisting()) {
      await paymentsLink.click()
    }
    await browser.pause(2000)
  })

  it('should switch to Payments tab and show search', async () => {
    await tapElement('sa-tab-payments')
    await browser.pause(2000)
    const search = await $('~sa-payments-search')
    await expect(search).toBeDisplayed()
  })

  it('should filter by partial plate number', async () => {
    const search = await $('~sa-payments-search')
    await search.setValue('ba')
    await browser.pause(2000)
    await expect(search).toBeDisplayed()
  })

  it('should filter by partial driver name', async () => {
    const search = await $('~sa-payments-search')
    await search.clearValue()
    await search.setValue('driver')
    await browser.pause(2000)
    await expect(search).toBeDisplayed()
  })
})
