import { mount } from '@flipatic/flip-reel'
import { demoFeed, createHouseAdAdapter } from '@flipatic/flip-reel-demo-shared'

const target = document.querySelector<HTMLElement>('#reels')

if (target) {
  mount(target, {
    feed: demoFeed,
    locale: 'en',
    brand: 'FlipReel',
    brandLogo: '/brand/flip-reel-logo.svg',
    rail: { maxVisible: 10, scrollBy: 4 },
    player: {
      loop: true,
      autoplayMuted: true,
      showReadMore: true,
      restartOnRevisit: ({ durationMs }) => durationMs >= 30_000,
      prefetch: ({ saveData, effectiveType, downlink }) => {
        if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
          return 0
        }

        if (effectiveType === '3g') {
          return 1
        }

        return downlink !== null && downlink > 5 ? 3 : 2
      },
    },
    ads: { enabled: true, every: 4, durationMs: 5000, skippableAfterFirstView: true },
    interactions: { like: true, share: true },
    adapters: { ad: createHouseAdAdapter() },
    callbacks: {
      onShare: (storyId) => console.info('[demo] share', storyId),
      onReadMore: (storyId, link) => console.info('[demo] read more', storyId, link),
    },
  })
}
