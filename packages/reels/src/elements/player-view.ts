import { html, nothing, type TemplateResult } from 'lit'
import { keyed } from 'lit/directives/keyed.js'
import {
  hasSlowConnection,
  isVideoStory,
  prefersSaveData,
  type AdAdapter,
  type Category,
  type PlayerState,
  type ResolvedConfig,
  type Story,
  type VideoStory,
} from '@flipatic/flip-reel-core'
import type { Messages } from '../i18n/i18n'
import { brandMark, icon } from '../icons/icons'

export interface PlayerHandlers {
  close: () => void
  setCategory: (id: string) => void
  prev: () => void
  next: () => void
  togglePause: () => void
  toggleMute: () => void
  toggleLike: (storyId: string) => void
  onMediaTap: (storyId: string, event: Event) => void
  share: (storyId: string) => void
  readMore: () => void
  onVideoLoaded: (event: Event) => void
  onVideoTime: (event: Event) => void
  onVideoEnded: (event: Event) => void
  onSeek: (fraction: number) => void
  onAdImpression: () => void
  onAdNoFill: () => void
  onAdSkip: () => void
}

export interface PlayerViewContext {
  state: PlayerState
  messages: Messages
  config: ResolvedConfig
  categories: Category[]
  brandName: string
  brandLogo: string | null
  adapter?: AdAdapter
  activeStory: Story | null
  activePoster?: string
  prefetch: number
  readyVideoIds: ReadonlySet<string>
  burst?: { storyId: string; seq: number }
  handlers: PlayerHandlers
}

function videoPreload(index: number, activeIndex: number, prefetch: number) {
  if (prefersSaveData() || hasSlowConnection()) {
    return 'none'
  }

  const distance = index - activeIndex
  if (Math.abs(distance) > prefetch) {
    return 'none'
  }

  return distance > 0 ? 'auto' : 'metadata'
}

function renderTopbar(ctx: PlayerViewContext): TemplateResult {
  const { messages, categories, state, handlers } = ctx
  return html`<div class="topbar">
    <div class="brand">
      ${ctx.brandLogo
        ? html`<img class="brand-logo" src="${ctx.brandLogo}" alt="${ctx.brandName}" />`
        : html`<span class="brand-mark">${brandMark()}<span>${ctx.brandName}</span></span>`}
    </div>
    <button
      class="control back-mobile"
      type="button"
      aria-label="${messages.back}"
      @click="${handlers.close}"
    >
      ${icon('arrow-left')}
    </button>
    <div class="menu-wrap">
      <flip-reel-category-menu
        .categories="${categories}"
        .active="${state.categoryId}"
        @category-change="${(event: CustomEvent<{ id: string }>) =>
          handlers.setCategory(event.detail.id)}"
      ></flip-reel-category-menu>
    </div>
    <div class="close-wrap">
      <button
        class="control close-desktop"
        type="button"
        aria-label="${messages.close}"
        @click="${handlers.close}"
      >
        ${icon('x')}
      </button>
    </div>
  </div>`
}

function renderCaption(story: Story, ctx: PlayerViewContext): TemplateResult {
  const { messages, config, handlers } = ctx
  const byline = [story.brand, story.date].filter(Boolean).join(' · ')
  const showReadMore = config.player.showReadMore && Boolean(story.link)
  return html`<div class="caption">
    <h2 class="title">${story.title}</h2>
    ${byline ? html`<p class="byline">${byline}</p>` : nothing}
    ${showReadMore
      ? html`<a
          class="readmore"
          href="${story.link ?? '#'}"
          target="_blank"
          rel="noopener"
          @click="${handlers.readMore}"
        >
          ${story.readMoreLabel ?? messages.readMore}${icon('external-link')}
        </a>`
      : nothing}
    <div class="progress">
      <flip-reel-progress-bar
        @seek="${(event: CustomEvent<number>) => handlers.onSeek(event.detail)}"
      ></flip-reel-progress-bar>
    </div>
  </div>`
}

function renderMute(ctx: PlayerViewContext): TemplateResult {
  const { state, messages, handlers } = ctx
  return html`<button
    class="mute"
    type="button"
    aria-label="${state.muted ? messages.unmute : messages.mute}"
    aria-pressed="${!state.muted}"
    @click="${(event: Event) => {
      event.stopPropagation()
      handlers.toggleMute()
    }}"
  >
    ${icon(state.muted ? 'volume-x' : 'volume-2')}
  </button>`
}

function renderPauseOverlay(ctx: PlayerViewContext): TemplateResult {
  const { state, messages, handlers } = ctx
  return html`<div class="play-overlay" role="button" @click="${handlers.togglePause}">
    <button
      class="overlay-mute"
      type="button"
      aria-label="${state.muted ? messages.unmute : messages.mute}"
      aria-pressed="${!state.muted}"
      @click="${(event: Event) => {
        event.stopPropagation()
        handlers.toggleMute()
      }}"
    >
      ${icon(state.muted ? 'volume-x' : 'volume-2')}
    </button>
    <button
      class="play-circle"
      type="button"
      aria-label="${messages.play}"
      @click="${(event: Event) => {
        event.stopPropagation()
        handlers.togglePause()
      }}"
    >
      ${icon('play-fill')}
    </button>
  </div>`
}

function renderVideo(story: VideoStory, index: number, ctx: PlayerViewContext): TemplateResult {
  const { state, handlers } = ctx

  return html`<video
      class="media"
      data-index="${index}"
      data-story-id="${story.id}"
      src="${story.video}#t=0.001"
      poster="${story.poster ?? nothing}"
      playsinline
      preload="${videoPreload(index, state.activeIndex, ctx.prefetch)}"
      ?muted="${state.muted}"
      @click="${(event: Event) => handlers.onMediaTap(story.id, event)}"
      @loadeddata="${handlers.onVideoLoaded}"
      @timeupdate="${handlers.onVideoTime}"
      @ended="${handlers.onVideoEnded}"
    ></video>
    ${story.poster
      ? html`<img
          class="poster ${ctx.readyVideoIds.has(story.id) ? 'faded' : ''}"
          src="${story.poster}"
          alt=""
          decoding="async"
          loading="lazy"
        />`
      : nothing}`
}

function renderReel(story: Story, index: number, ctx: PlayerViewContext): TemplateResult {
  const { state, handlers } = ctx
  const active = state.activeIndex === index && !state.ad.active
  const media = isVideoStory(story)
    ? renderVideo(story, index, ctx)
    : html`<img
        class="media"
        src="${story.type === 'image' ? story.image : ''}"
        alt="${story.title}"
        @click="${(event: Event) => handlers.onMediaTap(story.id, event)}"
      />`
  return html`<section class="reel" data-index="${index}">
    <div class="frame">
      ${media} ${active ? renderMute(ctx) : nothing} ${renderCaption(story, ctx)}
      ${active && state.paused ? renderPauseOverlay(ctx) : nothing}
      ${active && ctx.burst?.storyId === story.id
        ? keyed(
            ctx.burst.seq,
            html`<div class="like-burst" aria-hidden="true">${icon('heart', true)}</div>`,
          )
        : nothing}
    </div>
    ${state.ad.active ? nothing : renderActions(story, ctx)}
  </section>`
}

function renderAdOverlay(ctx: PlayerViewContext): TemplateResult {
  const { state, messages, config, handlers } = ctx
  return html`<div class="ad-overlay">
    <div class="ad-frame">
      <flip-reel-ad-slide
        .adapter="${ctx.adapter}"
        .messages="${messages}"
        .locale="${config.locale}"
        .index="${state.ad.index}"
        .active="${true}"
        .skippable="${state.ad.skippable}"
        .remainingMs="${state.ad.remainingMs}"
        .noFillTimeoutMs="${config.ads.noFillTimeoutMs}"
        @ad-impression="${handlers.onAdImpression}"
        @ad-nofill="${handlers.onAdNoFill}"
        @ad-skip="${handlers.onAdSkip}"
      ></flip-reel-ad-slide>
    </div>
  </div>`
}

function renderActions(story: Story, ctx: PlayerViewContext): TemplateResult | typeof nothing {
  const { messages, config, state, handlers } = ctx
  if (!config.interactions.like && !config.interactions.share) return nothing
  const liked = state.likedIds.has(story.id)
  return html`<div class="actions">
    ${config.interactions.like
      ? html`<button
          class="control ${liked ? 'liked' : ''}"
          type="button"
          aria-pressed="${liked}"
          aria-label="${messages.like}"
          @click="${() => handlers.toggleLike(story.id)}"
        >
          ${icon('heart', liked)}
        </button>`
      : nothing}
    ${config.interactions.share
      ? html`<button
          class="control"
          type="button"
          aria-label="${messages.share}"
          @click="${() => handlers.share(story.id)}"
        >
          ${icon('send')}
        </button>`
      : nothing}
  </div>`
}

function renderNav(ctx: PlayerViewContext): TemplateResult | typeof nothing {
  const { state, messages, handlers } = ctx
  if (state.ad.active) return nothing
  const atStart = state.activeIndex <= 0
  const atEnd = state.activeIndex >= state.stories.length - 1
  return html`<div class="nav">
    <button
      class="control"
      type="button"
      ?disabled="${atStart}"
      aria-label="${messages.previous}"
      @click="${handlers.prev}"
    >
      ${icon('arrow-up')}
    </button>
    <button
      class="control"
      type="button"
      ?disabled="${atEnd}"
      aria-label="${messages.next}"
      @click="${handlers.next}"
    >
      ${icon('arrow-down')}
    </button>
  </div>`
}

export function renderStage(ctx: PlayerViewContext): TemplateResult {
  return html`<div class="stage">
    <flip-reel-blurred-background
      class="bg-desktop"
      .poster="${ctx.activePoster}"
    ></flip-reel-blurred-background>
    ${renderTopbar(ctx)} ${renderNav(ctx)}
    <div class="scroller">
      ${ctx.state.stories.map((story, index) => renderReel(story, index, ctx))}
    </div>
    ${ctx.state.ad.active ? renderAdOverlay(ctx) : nothing}
  </div>`
}
