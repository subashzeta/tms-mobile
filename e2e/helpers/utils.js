const CREDENTIALS = {
  manager: { email: 'manager@tms.com', password: 'Manager@123' },
  superadmin: { email: 'admin@tms.com', password: 'Admin@123' },
  driver: { email: 'driver@tms.com', password: 'Driver@123' },
}

async function login(role = 'manager') {
  const cred = CREDENTIALS[role] || CREDENTIALS.manager

  const emailInput = await $('~email-input')
  await emailInput.waitForDisplayed({ timeout: 10000 })
  await emailInput.setValue(cred.email)

  const passInput = await $('~password-input')
  await passInput.setValue(cred.password)

  const loginBtn = await $('~login-button')
  await loginBtn.click()

  await browser.waitUntil(async () => {
    const dash = await $('~dashboard-screen')
    return await dash.isExisting()
  }, { timeout: 30000, timeoutMsg: 'Dashboard did not load after login' })
}

async function waitForScreen(testId, timeout = 15000) {
  const el = await $(`~${testId}`)
  await el.waitForDisplayed({ timeout })
  return el
}

async function tapElement(testId) {
  const el = await $(`~${testId}`)
  await el.waitForClickable({ timeout: 10000 })
  await el.click()
}

async function scrollDown() {
  const { width, height } = await browser.getWindowRect()
  await browser.performActions([{
    type: 'pointer',
    id: 'finger1',
    parameters: { pointerType: 'touch' },
    actions: [
      { type: 'pointerMove', duration: 0, x: Math.round(width / 2), y: Math.round(height * 0.6) },
      { type: 'pointerDown', button: 0 },
      { type: 'pointerMove', duration: 400, x: Math.round(width / 2), y: Math.round(height * 0.3) },
      { type: 'pointerUp', button: 0 }
    ]
  }])
  await browser.releaseActions()
}

async function typeInField(testId, text) {
  const el = await $(`~${testId}`)
  await el.waitForDisplayed({ timeout: 10000 })
  await el.clearValue()
  await el.setValue(text)
}

module.exports = { login, waitForScreen, tapElement, scrollDown, typeInField, CREDENTIALS }
