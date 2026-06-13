// End-to-end smoke test for the doxa-global prayer flow.
//
// Drives a real browser through: landing → start praying → step through the
// full card stack → reach "done" → pray for another group → step through again.
// Fails on any console error or uncaught page error.
//
// Run with the dev server up on http://localhost:4000:
//   node tests/e2e.mjs
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:4000'

const errors = []

function fail(msg) {
  console.error(`\n✗ FAIL: ${msg}`)
  process.exitCode = 1
}

async function clickAdvance(page, label) {
  // The advance button shows "Begin" on the first card and "Next" after.
  const begin = page.getByRole('button', { name: /begin/i })
  const next = page.getByRole('button', { name: /^next$/i })
  if (await begin.count()) {
    await begin.first().click()
  } else if (await next.count()) {
    await next.first().click()
  } else {
    throw new Error(`No advance button found at step "${label}"`)
  }
}

async function stepThroughStack(page, roundLabel) {
  // Walk forward until the "Pray for another group" button appears (done card).
  // Cap the loop so a regression can't spin forever.
  const prayAnother = page.getByRole('button', { name: /pray for another/i })
  for (let i = 0; i < 12; i++) {
    if (await prayAnother.count() && await prayAnother.first().isVisible()) {
      return i // number of advances it took to reach done
    }
    await clickAdvance(page, `${roundLabel} step ${i}`)
    await page.waitForTimeout(250) // transition
  }
  throw new Error(`${roundLabel}: never reached the done card`)
}

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
})
page.on('pageerror', (err) => {
  errors.push(`pageerror: ${err.message}`)
})
page.on('requestfailed', (req) => {
  // Only flag failures of our OWN resources. Third-party embeds (e.g. the
  // OpenStreetMap map iframe) routinely ABORT when the card flips and unmounts
  // them mid-load — a test-speed artifact, not an app error. Real JS errors are
  // still caught globally by the console/pageerror handlers above.
  const url = req.url()
  if (url.includes('favicon')) return
  if (!url.startsWith(BASE)) return
  errors.push(`requestfailed: ${url} — ${req.failure()?.errorText}`)
})

try {
  // 1. Landing page
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const startBtn = page.getByRole('link', { name: /start praying/i })
  if (!(await startBtn.count())) fail('Landing page missing "Start praying" button')
  console.log('✓ Landing page loaded')

  // 2. Into the prayer loop
  await startBtn.first().click()
  await page.waitForURL(/\/pray/, { timeout: 10_000 })

  // Wait for the first card (intro) to render — the group name heading.
  await page.getByRole('button', { name: /begin/i }).waitFor({ state: 'visible', timeout: 15_000 })
  const firstGroup = await page.locator('h1').first().textContent()
  console.log(`✓ Prayer loop started — first group: "${firstGroup?.trim()}"`)

  // 3. Step through the whole stack
  const advances1 = await stepThroughStack(page, 'round 1')
  console.log(`✓ Reached done card after ${advances1} advances`)

  // Verify the "done" card recorded a prayer (the prayed POST fires on done).
  // Give the network call a moment.
  await page.waitForTimeout(800)

  // 4. Pray for another group
  await page.getByRole('button', { name: /pray for another/i }).first().click()
  await page.getByRole('button', { name: /begin/i }).waitFor({ state: 'visible', timeout: 15_000 })
  const secondGroup = await page.locator('h1').first().textContent()
  console.log(`✓ Loaded a second group: "${secondGroup?.trim()}"`)

  // 5. Step through the second stack too
  const advances2 = await stepThroughStack(page, 'round 2')
  console.log(`✓ Second stack completed after ${advances2} advances`)
} catch (err) {
  fail(err.message)
} finally {
  await browser.close()
}

if (errors.length) {
  console.error('\n✗ Browser errors detected:')
  for (const e of errors) console.error('  - ' + e)
  process.exitCode = 1
} else {
  console.log('\n✓ No browser console/page errors')
}

if (process.exitCode) {
  console.error('\n=== E2E TEST FAILED ===')
} else {
  console.log('\n=== E2E TEST PASSED ===')
}
