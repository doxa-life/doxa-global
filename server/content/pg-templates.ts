// Location-agnostic prayer prompt templates, adapted from prayer.global's
// stacker for people-group framing. prayer.global generates prompts for
// administrative locations ("the state of X"); these are the concept prompts
// that read naturally for a *people group* instead, fed by the few demographic
// fields campaigns-sever exposes (name, population, evangelical %).
//
// Each session draws a couple of these to round out the card stack alongside
// the group's day-in-life prompt and the shared library pieces. Selection is
// random; templates interpolate {name}, {population}, {believers}, {far_pct}.

export interface TemplateInput {
  name: string
  population: number | null
  evangelical_pct: number | null
  far_from_jesus_pct: number | null
}

export interface PrayerCard {
  title: string
  body: string
}

interface Concept {
  title: string
  templates: string[]
  // Only offer this concept when the data it interpolates is present.
  requires?: Array<'population' | 'believers' | 'far_pct'>
}

const CONCEPTS: Concept[] = [
  {
    title: 'A movement of prayer',
    templates: [
      'Father, stir a passion for prayer among the {name}. Raise up intercessors from within this people who cry out for awakening.',
      'Lord, ignite extraordinary, persistent prayer for the {name} — among believers worldwide and among the few who already follow you here.'
    ]
  },
  {
    title: 'Disciples who make disciples',
    templates: [
      'Jesus, you taught Paul to train Timothy to train faithful others. Teach the {name} who follow you to do the same, generation upon generation.',
      'Lord, raise up disciple-makers among the {name} who pass on everything you commanded, multiplying faith from house to house.'
    ]
  },
  {
    title: 'Simple, reproducing churches',
    templates: [
      'Multiply simple gatherings among the {name} where new believers share life together, Lord. Create spiritual families that reproduce naturally.',
      'Father, plant healthy churches among the {name} so full of joy in the gospel that they cannot help but multiply.'
    ]
  },
  {
    title: 'Bold witnesses',
    templates: [
      'Raise up bold witnesses among the {name}, Lord, who proclaim the gospel in every corner of their world, even facing opposition.',
      'Holy Spirit, give the {name} who believe courage and wisdom in every opportunity to witness to their own people.'
    ]
  },
  {
    title: 'Persons of peace',
    templates: [
      'Father, prepare persons of peace among the {name} — households ready to welcome the gospel and open their homes to it.',
      'Lord, go ahead of every worker among the {name} and ready hearts that will receive the good news and spread it.'
    ]
  },
  {
    title: 'The Word in their hands',
    templates: [
      'Lord, give the {name} the Scriptures in the language of their heart, and help them build their lives on your Word.',
      'Father, let the {name} hear and understand your Word, and help those who believe to actually obey what they read.'
    ]
  },
  {
    title: 'Local leaders',
    templates: [
      'Reveal who carries leadership gifts among the {name}, Father, and help them use those gifts well to shepherd your people.',
      'Lord, raise up shepherds, teachers, and pioneers from within the {name} themselves to lead the church you are building.'
    ]
  },
  {
    title: 'Faith that endures suffering',
    templates: [
      'Prepare the {name} who believe for hardship, Lord, knowing that through many tribulations we enter your kingdom — and give them joy in it.',
      'Jesus, help believers among the {name} find joy even in suffering, trusting that it produces endurance and hope.'
    ]
  },
  {
    title: 'Reliance on God',
    templates: [
      'Holy Spirit, teach the {name} who follow you to depend on you completely for courage and wisdom, not on their own strength.',
      'Lord, let the {name} who believe trust you for every need, knowing you are faithful to provide.'
    ]
  },
  {
    title: 'Love and generosity',
    templates: [
      'Father, fill believers among the {name} with such love and generosity that their neighbors see Christ in them.',
      'Lord, make the {name} who follow you good stewards of their everyday relationships, showing your kindness in ordinary moments.'
    ]
  },
  {
    title: 'Unity among believers',
    templates: [
      'Savior, give a spirit of unity to all who believe among the {name}, that they would be one in Christ and reach many together.',
      'Lord, knit together every believer among the {name}, that the world would know your love by how they love one another.'
    ]
  },
  {
    title: 'The harvest',
    templates: [
      'Lord of the harvest, send out laborers to the {name}, and let many come to faith in Jesus Christ.',
      'Father, open doors for the gospel among the {name} so your Word spreads freely and rapidly.'
    ]
  },
  {
    title: 'A people far from Jesus',
    templates: [
      'Father, {far_pct}% of the {name} are far from Jesus. Soften their hearts and draw them to yourself.',
      'Lord, look on the {name} with mercy — so many have never heard. Let your gospel reach them and transform lives.'
    ],
    requires: ['far_pct']
  },
  {
    title: 'A great people',
    templates: [
      'Jesus, {population} people make up the {name}, and you know every one by name. Let none of them remain without a witness.',
      'Father, among the {population} of the {name}, raise up the first disciples who will carry the gospel to the rest.'
    ],
    requires: ['population']
  },
  {
    title: 'The first believers',
    templates: [
      'Lord, strengthen the small number who already follow you among the {name}. Let them be a seed that yields a great harvest.',
      'Father, guard and grow the believers among the {name}, that they would be salt and light to their own people.'
    ],
    requires: ['believers']
  }
]

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function fillTemplate(template: string, input: TemplateInput): string {
  const believers = input.population != null && input.evangelical_pct != null
    ? Math.round(input.population * (input.evangelical_pct / 100))
    : null
  return template
    .replace(/\{name\}/g, input.name)
    .replace(/\{population\}/g, input.population != null ? formatNumber(input.population) : 'the people')
    .replace(/\{believers\}/g, believers != null ? formatNumber(believers) : 'the few who believe')
    .replace(/\{far_pct\}/g, input.far_from_jesus_pct != null ? String(input.far_from_jesus_pct) : '')
}

function conceptAvailable(concept: Concept, input: TemplateInput): boolean {
  if (!concept.requires) return true
  return concept.requires.every((req) => {
    if (req === 'population') return input.population != null && input.population > 0
    if (req === 'far_pct') return input.far_from_jesus_pct != null
    if (req === 'believers') {
      return input.population != null && input.evangelical_pct != null && input.evangelical_pct > 0
    }
    return true
  })
}

/**
 * Build `count` prayer cards for a people group by picking distinct random
 * concepts and a random template within each, with all variables filled in.
 */
export function buildPrayerCards(input: TemplateInput, count: number): PrayerCard[] {
  const pool = CONCEPTS.filter(c => conceptAvailable(c, input))
  // Fisher–Yates shuffle a copy, then take the first `count`.
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled.slice(0, count).map((concept) => {
    const template = concept.templates[Math.floor(Math.random() * concept.templates.length)]!
    return { title: concept.title, body: fillTemplate(template, input) }
  })
}
