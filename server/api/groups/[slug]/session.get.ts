// GET /api/groups/:slug/session?locale=en
//
// Assembles the full card-stack payload for one prayer session:
//   - demographics            (from campaigns-sever)
//   - day_in_life             (one random day, from campaigns-sever)
//   - pray_more               (shared-library pieces from campaigns-sever, as
//                              rendered HTML, PLUS one locally-generated
//                              prayer.global-style template card)
//
// Tiptap content is rendered to HTML here on the server so the client renders a
// plain string. The locally-generated template card is interleaved into the
// pray_more list.
import { prayFetch, type GroupContentBundle } from '../../../utils/pray'
import { buildPrayerCards } from '../../../content/pg-templates'
import { renderTiptap } from '../../../utils/tiptap-render'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'slug is required' })

  const locale = (getQuery(event).locale as string) || 'en'

  const bundle = await prayFetch<GroupContentBundle>(
    `/api/people-groups/${encodeURIComponent(slug)}/global-content`,
    { query: { locale } }
  )

  const demo = bundle.demographics

  // One locally-generated prayer.global-style card, fed by this group's data.
  const [templateCard] = buildPrayerCards(
    {
      name: demo.name,
      population: demo.population,
      evangelical_pct: demo.evangelical_pct,
      far_from_jesus_pct: demo.far_from_jesus_pct
    },
    1
  )

  // pray_more cards: shared-library pieces (rendered) + the template card.
  const prayMore: Array<{ title: string | null, html: string }> = bundle.pray_more.map(p => ({
    title: null,
    html: renderTiptap(p.content_json)
  }))

  if (templateCard) {
    prayMore.push({
      title: templateCard.title,
      html: `<p>${escapeHtml(templateCard.body)}</p>`
    })
  }

  return {
    demographics: demo,
    day_in_life: bundle.day_in_life
      ? { day_number: bundle.day_in_life.day_number, html: renderTiptap(bundle.day_in_life.content_json) }
      : null,
    pray_more: prayMore
  }
})

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
