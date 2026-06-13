// Shared client-side types for the prayer flow.

export interface ValueLabel {
  value: string
  label: string
  description?: string
}

export interface Demographics {
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

export interface NextGroup {
  slug: string
  people_group_id: number
  name: string
}

export interface SessionBundle {
  demographics: Demographics
  day_in_life: { day_number: number, html: string } | null
  pray_more: Array<{ title: string | null, html: string }>
}
