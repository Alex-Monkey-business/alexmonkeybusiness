// Isolated UI QA: all backend requests are intercepted; no real account or data writes.
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import assert from 'node:assert/strict'
const backend = new URL('https://portfolio-demo.supabase.co')
const storageKey = `sb-${backend.hostname.split('.')[0]}-auth-token`
const app = process.env.BEACH_URL ?? 'http://127.0.0.1:5198'
const out = 'public/assets/larvik-beach'
mkdirSync(out, { recursive: true })
const people = ['Alex Eksempel', 'Ola Nordmann', 'Kari Hansen', 'Per Berg', 'Ingrid Solheim', 'Jonas Lie', 'Maria Aas'].map((name, i) => ({ id: `p${i}`, name, email: `spiller${i}@example.com`, role: i ? 'player' : 'admin', active: true, avatar_url: null, phone: null }))
const season = { id: 'season1', name: 'Høsten 2026', starts_on: '2026-01-01', ends_on: '2027-12-31', kind: 'indoor', default_location: 'Grenland Folkehøgskole', default_capacity: 6, default_min_players: 4, default_cost: 60000, notice: null }
const sessions = [process.env.QA_UI_RECENT ? -.5 : -7, 3, 10].map((days, i) => ({ id: `s${i}`, season_id: season.id, starts_at: new Date(Date.now() + days * 86400000).toISOString(), duration_min: 120, location: 'Grenland Folkehøgskole', cost: 60000, status: i ? 'planned' : 'held', capacity: 6, min_players: 4, note: null }))
let attendance = people.slice(0, 6).flatMap((p, i) => [0, 1].map(n => ({ session_id: `s${n}`, profile_id: p.id, going: true, updated_at: new Date(Date.now() - (20 - i) * 60000).toISOString() })))
let fail = '', empty = false
const data = {
  settings: { id: true, signup_window_days: 14, billing_day: 1, vipps_number: '12345678', vipps_display_name: 'Testgjengen', group_name: 'Larvik Beach Volley' },
  profiles: people, seasons: [season], sessions,
  season_stats: people.map((p, i) => ({ profile_id: p.id, season_id: season.id, sessions: 7-i, games: 12, wins: 8-i, points_for: 130, points_against: 100, points_diff: 30 })),
  balances: [{ profile_id: 'p0', invoiced_open: 30000, uninvoiced: 10000, claimed: 0 }],
  invoices: [{ id: 'invoice1', profile_id: 'p0', amount: 30000, period: '2026-08-01', status: 'open' }],
  public_upcoming_sessions: [{ ...sessions[1], kind: 'indoor', going_count: 6 }],
}
const browser = await chromium.launch()
const errors = [], results = []
async function context(auth, width) {
  const c = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' })
  await c.route(`${backend.origin}/**`, async route => {
    const url = new URL(route.request().url()), table = url.pathname.split('/').pop()
    if (fail === table) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Kunne ikke hente data. Prøv igjen.' }) })
    if (table === 'set_attendance') {
      const b = route.request().postDataJSON()
      attendance = attendance.filter(a => !(a.profile_id === 'p0' && a.session_id === b.p_session))
      attendance.push({ session_id: b.p_session, profile_id: 'p0', going: b.p_going, updated_at: new Date().toISOString() })
      return route.fulfill({ json: attendance.at(-1) })
    }
    let value = table === 'attendance' ? attendance : table === 'user' ? people[0] : data[table] ?? []
    if (empty && table === 'seasons') value = []
    if (Array.isArray(value)) {
      for (const [key, condition] of url.searchParams) {
        if (condition.startsWith('eq.')) value = value.filter(v => String(v[key]) === condition.slice(3))
        if (condition.startsWith('lt.')) value = value.filter(v => String(v[key]) < condition.slice(3))
        if (condition.startsWith('gte.')) value = value.filter(v => String(v[key]) >= condition.slice(4))
      }
      if (route.request().headers().accept?.includes('vnd.pgrst.object')) value = value[0] ?? null
    }
    return route.fulfill({ json: value })
  })
  if (auth) await c.addInitScript(({storageKey}) => {
    localStorage.setItem(storageKey, JSON.stringify({ access_token: 'qa-fixture-token', refresh_token: 'qa-fixture-refresh', token_type: 'bearer', expires_at: Math.floor(Date.now()/1000)+3600, user: { id: 'p0', email: 'spiller0@example.com', aud: 'authenticated', role: 'authenticated' } }))
  }, {storageKey})
  return c
}
try {
  const c = await context(true, 390), p = await c.newPage()
  for (const [name, route] of [['spill','/spill'],['betaling','/spill/betaling'],['statistikk','/spill/statistikk']]) {
    await p.goto(app+route); await p.locator('h1').first().waitFor(); await p.waitForTimeout(1600)
    await p.screenshot({path: `${out}/${name}.jpg`, type:'jpeg', quality:85})
    console.log(name, (await p.locator('main').innerText()).slice(0,600))
  }
  await c.close()
} finally { await browser.close() }
