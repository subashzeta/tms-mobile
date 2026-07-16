const { resolve } = require('path')

exports.config = {
  runner: 'local',
  port: 4723,
  hostname: '127.0.0.1',
  path: '/',

  specs: [
    './e2e/tests/**/*.spec.js'
  ],
  maxInstances: 1,

  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:appPackage': 'com.tms.mobile',
    'appium:appActivity': 'com.tms.mobile.MainActivity',
    'appium:noReset': false,
    'appium:newCommandTimeout': 300,
    'appium:autoGrantPermissions': true,
  }],

  logLevel: 'info',
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: [
    ['appium', {
      args: { relaxedSecurity: true },
      command: 'appium'
    }]
  ],

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
    retries: 1
  },

  onPrepare: function () {
    console.log('=== TMS Mobile E2E Tests ===')
  }
}
