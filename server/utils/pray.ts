// Thin client for campaigns-sever (pray.doxa.life). All calls go server-to-server
// with the shared FORM_API_KEY so the key never reaches the browser.

export function prayConfig() {
  const config = useRuntimeConfig()
  const baseUrl = String(config.prayBaseUrl || '').replace(/\/$/, '')
  const apiKey = String(config.formApiKey || '')
  if (!baseUrl || !apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'campaigns-sever integration not configured' })
  }
  return { baseUrl, apiKey }
}

export async function prayFetch<T>(path: string, opts: { method?: 'GET' | 'POST', body?: Record<string, unknown>, query?: Record<string, unknown> } = {}): Promise<T> {
  const { baseUrl, apiKey } = prayConfig()
  return await $fetch(`${baseUrl}${path}`, {
    method: opts.method ?? 'GET',
    query: opts.query,
    body: opts.body,
    headers: { 'X-API-Key': apiKey },
    timeout: 15_000
  }) as T
}

export interface GlobalGroup {
  id: number
  slug: string
  name: string
}

export interface ValueLabel {
  value: string
  label: string
  description?: string
}

export interface GroupDemographics {
  id: number
  slug: string
  name: string
  image_url: string | null
  picture_credit: Array<{ text: string, link?: string | null }> | null
  description: string | null
  population: number | null
  evangelical_pct: number | null
  far_from_jesus_pct: number | null
  country: ValueLabel | null
  language: ValueLabel | null
  religion: ValueLabel | null
  status: ValueLabel | null
  churches: ValueLabel | null
  latitude: number | null
  longitude: number | null
}

export interface GroupContentBundle {
  demographics: GroupDemographics
  day_in_life: { day_number: number, content_json: unknown } | null
  pray_more: Array<{ content_json: unknown }>
}
