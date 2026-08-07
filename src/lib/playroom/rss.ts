import type { PlayroomFeedConfig } from '../config/types'

export interface FeedItem {
  title: string
  source: string
  kind: 'feed' | 'fact' | 'greeting'
}

function parseFeedXml(xml: string, source: string, maxItems: number): FeedItem[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const nodes = [
    ...doc.querySelectorAll('item'),
    ...doc.querySelectorAll('entry'),
  ]

  return nodes
    .slice(0, maxItems)
    .flatMap((item) => {
      const title = item.querySelector('title')?.textContent?.trim()
      if (!title) return []
      return [
        {
          title,
          source,
          kind: 'feed' as const,
        },
      ]
    })
}

async function fetchFeedXml(url: string): Promise<string | null> {
  const proxy = import.meta.env.VITE_RSS_PROXY as string | undefined

  if (proxy) {
    const res = await fetch(`${proxy}${encodeURIComponent(url)}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.text()
  }

  try {
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const payload = (await res.json()) as { contents?: string }
    return payload.contents ?? null
  } catch {
    return null
  }
}

export async function fetchFeedItems(feed: PlayroomFeedConfig): Promise<FeedItem[]> {
  const xml = await fetchFeedXml(feed.url)
  if (!xml) return []

  const label = feed.label ?? 'News'
  const maxItems = feed.maxItems ?? 6
  return parseFeedXml(xml, label, maxItems)
}

export function staticSpotlightItems(
  facts: string[] = [],
  greetings: string[] = [],
): FeedItem[] {
  return [
    ...greetings.map((title) => ({ title, source: 'Playroom', kind: 'greeting' as const })),
    ...facts.map((title) => ({ title, source: 'Did you know?', kind: 'fact' as const })),
  ]
}

export function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
