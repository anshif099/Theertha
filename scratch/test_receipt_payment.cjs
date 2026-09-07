// Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const fs = require('node:fs')
const assert = require('node:assert/strict')

;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      sessionStorage.setItem('theertha-temple-session', JSON.stringify({ id: 'payment-test', name: 'Test Temple' }))
      if (!localStorage.getItem('payment-test-db')) {
        const first = { id: 'r1', receiptNo: 'RC-TEST-1', templeId: 'payment-test', templeName: 'Test Temple', counterId: 'c1', dbDate: '2026-05-22', bookingDate: '2026-05-22', date: '22 May 2026', devoteeName: 'Arjun', mobile: '111', total: 150, paymentStatus: 'Unpaid', items: [{ name: 'Archana', amount: 50, qty: 3 }] }
        const second = { ...first, id: 'r2', receiptNo: 'RC-TEST-2', devoteeName: 'Meera', total: 200 }
        localStorage.setItem('payment-test-db', JSON.stringify({ registeredTemples: { 'payment-test': { receipts: { '2026-05-22': { r1: first, r2: second } }, devotees: { '111': { receipts: { r1: { receiptNo: first.receiptNo, total: 50, paymentStatus: 'Unpaid' } } }, '222': { receipts: { r1: { receiptNo: first.receiptNo, total: 100, paymentStatus: 'Unpaid' } } } } } } }))
      }
      window.paymentMock = {
        ref: (_db, path = '') => path,
        get: async path => {
          const db = JSON.parse(localStorage.getItem('payment-test-db'))
          const value = path.split('/').filter(Boolean).reduce((value, key) => value?.[key], db)
          return { exists: () => value != null, val: () => value || null }
        },
        update: async (_path, changes) => {
          if (sessionStorage.getItem('fail-payment')) throw new Error('Test server rejected payment')
          const db = JSON.parse(localStorage.getItem('payment-test-db'))
          for (const [path, value] of Object.entries(changes)) {
            const parts = path.split('/')
            let node = db
            for (const key of parts.slice(0, -1)) node = node[key] ||= {}
            node[parts.at(-1)] = value
          }
          localStorage.setItem('payment-test-db', JSON.stringify(db))
        },
      }
    })
    const store = fs.readFileSync('src/lib/settingsStore.js', 'utf8')
    const names = [...store.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map(match => match[1])
    await page.route('**/src/lib/settingsStore.js*', route => {
      const bodies = {
        loadAllReceipts: "return Object.values(JSON.parse(localStorage.getItem('payment-test-db')).registeredTemples['payment-test'].receipts).flatMap(Object.values)",
        loadStars: "return [{id:'star',name:'Ashwathi'}]",
      }
      return route.fulfill({ contentType: 'text/javascript', body: names.map(name => `export async function ${name}(){${bodies[name] || 'return []'}}`).join('\n') })
    })
    await page.route('**/src/lib/receiptPayments.js*', route => {
      const source = fs.readFileSync('src/lib/receiptPayments.js', 'utf8')
        .replace("import { get, ref, update } from 'firebase/database'", 'const {get,ref,update} = window.paymentMock')
        .replace("import { realtimeDb } from './firebase.js'", 'const realtimeDb = {}')
      return route.fulfill({ contentType: 'text/javascript', body: source })
    })
    await page.goto('http://localhost:5173/theertha/temple/booking')
    const row = page.locator('tr').filter({ hasText: 'RC-TEST-1' })
    await row.getByRole('button', { name: 'Edit payment' }).click()
    const dialog = page.getByRole('dialog', { name: 'Receipt payment' })
    await dialog.getByRole('button', { name: 'Save as paid', exact: true }).waitFor()
    await dialog.getByLabel('Payment method', { exact: true }).selectOption('UPI')
    const paidOn = await dialog.getByLabel('Payment received on').inputValue()
    await dialog.getByRole('button', { name: 'Save & generate paid bill' }).click()
    await page.waitForURL('**/receipt-preview')
    const database = await page.evaluate(() => JSON.parse(localStorage.getItem('payment-test-db')))
    const paid = database.registeredTemples['payment-test'].receipts['2026-05-22'].r1
    assert.equal(paid.paymentStatus, 'Paid')
    assert.equal(paid.paidOn, paidOn)
    assert.equal(paid.paymentMethod, 'UPI')
    assert.equal(paid.bookingDate, '2026-05-22')
    assert.equal(database.publicReceipts.r1.paymentStatus, 'Paid')
    assert.equal(database.publicReceipts['RC-TEST-1'].paidOn, paidOn)
    assert.equal(database.registeredTemples['payment-test'].devotees['111'].receipts.r1.total, 50)
    assert.equal(database.registeredTemples['payment-test'].devotees['222'].receipts.r1.paymentStatus, 'Paid')
    await page.getByText(`Payment received: ${paidOn}`, { exact: true }).waitFor()
    // A retry must keep the first settlement date/method.
    const retry = await page.evaluate(async () => {
      const service = await import('/theertha/src/lib/receiptPayments.js')
      return service.markReceiptPaid('payment-test', { id: 'r1' }, { paymentMethod: 'Cash', paidOn: '2026-01-01' })
    })
    assert.equal(retry.paymentMethod, 'UPI')
    assert.equal(retry.paidOn, paidOn)
    await page.goto('http://localhost:5173/theertha/temple/accounts')
    await page.getByText('\u20b9150 collected', { exact: true }).waitFor()
    await page.goto('http://localhost:5173/theertha/temple/booking')
    const paidRow = page.locator('tr').filter({ hasText: 'RC-TEST-1' })
    await paidRow.getByRole('button', { name: 'Paid bill', exact: true }).waitFor()
    assert.equal(await paidRow.getByRole('button', { name: 'Edit payment' }).count(), 0)
    await page.getByRole('button', { name: /^Unpaid Bookings \(/ }).click()
    assert.equal(await paidRow.count(), 0)
    assert.equal(await page.locator('tr').filter({ hasText: 'RC-TEST-2' }).count(), 1)
    const denied = await page.evaluate(async () => {
      const service = await import('/theertha/src/lib/receiptPayments.js')
      try { await service.markReceiptPaid('another-temple', { id: 'r2' }, { paymentMethod: 'Cash', paidOn: service.localPaymentDate() }); return false }
      catch { return true }
    })
    assert.equal(denied, true)
    await page.evaluate(() => sessionStorage.setItem('fail-payment', 'yes'))
    await page.locator('tr').filter({ hasText: 'RC-TEST-2' }).getByRole('button', { name: 'Edit payment' }).click()
    await dialog.getByRole('button', { name: 'Save as paid', exact: true }).click()
    await dialog.getByRole('alert').waitFor()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('payment-test-db')).registeredTemples['payment-test'].receipts['2026-05-22'].r2.paymentStatus), 'Unpaid')
    assert.deepEqual(errors, [])
    console.log('PASS: payment update, dated paid bill, atomic mirrors and history, unchanged booking date/person totals, retry, accounting on paid day, failure stays unpaid')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
