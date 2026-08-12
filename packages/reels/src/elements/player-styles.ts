import { css } from 'lit'

export const playerStyles = css`
  :host {
    display: contents;
  }
  dialog {
    width: 100vw;
    height: 100dvh;
    max-width: 100vw;
    max-height: 100dvh;
    margin: 0;
    padding: 0;
    border: none;
    background: var(--flip-reel-surface, var(--flip-reel-neutral-950, #0a0a0a));
    color: var(--flip-reel-on-surface, #ffffff);
    overflow: hidden;
  }
  dialog[open] {
    animation: flip-reel-dialog-in var(--flip-reel-modal-open, 250ms)
      var(--flip-reel-ease-emphasized, cubic-bezier(0.22, 1, 0.36, 1));
  }
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.92);
  }
  dialog[open]::backdrop {
    animation: flip-reel-backdrop-in var(--flip-reel-modal-open, 250ms)
      var(--flip-reel-ease-emphasized, cubic-bezier(0.22, 1, 0.36, 1));
  }
  @keyframes flip-reel-dialog-in {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes flip-reel-backdrop-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    dialog[open],
    dialog[open]::backdrop {
      animation: none;
    }
  }
  .stage {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .stage {
    --reel-clear: calc(max(1rem, env(safe-area-inset-top)) + 4rem);
    --reel-h: min(85dvh, calc(100dvh - 10rem), calc((100vw - 10rem) * 16 / 9));
    --reel-w: calc(var(--reel-h) * 9 / 16);
  }
  .bg-desktop {
    display: none;
  }
  @media (min-width: 1024px) {
    .bg-desktop {
      display: block;
    }
  }
  .topbar {
    position: absolute;
    inset-inline: 0;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: max(16px, env(safe-area-inset-top)) 16px 16px;
    background: none;
    pointer-events: none;
  }
  @media (min-width: 768px) {
    .topbar {
      justify-content: space-between;
      padding: max(16px, env(safe-area-inset-top)) 24px 16px;
    }
  }
  .topbar > * {
    pointer-events: auto;
  }
  .topbar .control svg {
    width: 20px;
    height: 20px;
  }
  .brand {
    display: none;
    align-items: center;
    gap: 8px;
    color: var(--flip-reel-on-surface, #ffffff);
  }
  .brand-logo {
    display: block;
    height: 34px;
    width: auto;
  }
  .brand-mark {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    line-height: 28px;
    font-weight: 600;
  }
  .brand-mark svg {
    width: 24px;
    height: 24px;
  }
  @media (min-width: 768px) {
    .brand {
      display: flex;
      width: 160px;
      flex-shrink: 0;
    }
    .back-mobile {
      display: none;
    }
  }
  .menu-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    justify-content: center;
  }
  .menu-wrap > * {
    width: 100%;
    max-width: 672px;
  }
  .close-wrap {
    display: none;
  }
  .close-desktop {
    display: inline-flex;
  }
  @media (min-width: 768px) {
    .close-wrap {
      display: flex;
      width: 160px;
      justify-content: flex-end;
      flex-shrink: 0;
    }
  }
  .scroller {
    position: absolute;
    inset: 0;
    z-index: 10;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-snap-type: y mandatory;
    overscroll-behavior: contain;
    scrollbar-width: none;
    scroll-padding-top: 0;
  }
  @media (min-width: 768px) {
    .scroller {
      scroll-padding-top: var(--reel-clear);
    }
  }
  .scroller::-webkit-scrollbar {
    display: none;
  }
  .scroller::before,
  .scroller::after {
    content: '';
    display: block;
    height: 0;
  }
  @media (min-width: 768px) {
    .scroller::before {
      height: var(--reel-clear);
    }
    .scroller::after {
      height: max(1rem, calc(100dvh - var(--reel-clear) - var(--reel-h)));
    }
  }
  .reel {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100dvh;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    will-change: opacity;
  }
  @media (min-width: 768px) {
    .reel {
      height: var(--reel-h);
    }
    .reel + .reel {
      margin-top: 3rem;
    }
  }
  .frame {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
  }
  @media (min-width: 768px) {
    .frame {
      width: var(--reel-w);
      height: 100%;
      border-radius: var(--flip-reel-radius-card, 16px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }
  }
  video.media,
  img.media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000000;
  }
  img.poster {
    position: absolute;
    inset: 0;
    z-index: 5;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    transition: opacity 180ms ease;
  }
  img.poster.faded {
    opacity: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    img.poster {
      transition-duration: 1ms;
    }
  }
  .mute {
    display: none;
    position: absolute;
    right: 12px;
    top: 12px;
    z-index: 20;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 9999px;
    background: var(--flip-reel-alpha-black-60, rgba(23, 23, 23, 0.6));
    color: var(--flip-reel-on-surface, #ffffff);
    cursor: pointer;
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    transition:
      opacity 0.3s ease,
      background-color 0.2s ease;
  }
  .mute svg {
    width: 16px;
    height: 16px;
  }
  @media (min-width: 768px) {
    .mute {
      display: inline-flex;
      opacity: 0;
    }
    .frame:hover .mute {
      opacity: 1;
    }
  }
  .mute:hover {
    background: var(--flip-reel-control-bg, rgba(23, 23, 23, 0.8));
  }
  .mute:focus-visible {
    outline: none;
    opacity: 1;
    box-shadow: 0 0 0 2px var(--flip-reel-on-surface, #ffffff);
  }
  .nav {
    display: none;
    position: absolute;
    inset-block: 0;
    right: calc(50% + var(--reel-w) / 2 + 16px);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    z-index: 40;
    pointer-events: none;
  }
  .nav > * {
    pointer-events: auto;
  }
  @media (min-width: 768px) {
    .nav {
      display: flex;
    }
  }
  .actions {
    position: absolute;
    right: 12px;
    bottom: calc(env(safe-area-inset-bottom) + 48px);
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  @media (min-width: 768px) {
    .actions {
      top: 0;
      bottom: 0;
      right: auto;
      left: calc(50% + var(--reel-w) / 2 + 16px);
      justify-content: center;
    }
  }
  .control.liked {
    color: var(--flip-reel-like, var(--flip-reel-accent, hsl(358 85% 52%)));
    transform: scale(1.1);
  }
  .control.liked svg {
    fill: currentColor;
  }
  .actions .control:hover {
    background: var(--flip-reel-control-bg, rgba(23, 23, 23, 0.8));
  }
  .actions .control:not(.liked):hover {
    transform: scale(1.05);
  }
  .like-burst {
    position: absolute;
    inset: 0;
    z-index: 15;
    display: grid;
    place-items: center;
    pointer-events: none;
  }
  .like-burst svg {
    width: 96px;
    height: 96px;
    color: var(--flip-reel-like, var(--flip-reel-accent, hsl(358 85% 52%)));
    fill: currentColor;
    filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.45));
    animation: flip-reel-like-pop 700ms
      var(--flip-reel-ease-emphasized, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
  }
  @keyframes flip-reel-like-pop {
    0% {
      opacity: 0;
      transform: scale(0.4);
    }
    15% {
      opacity: 1;
      transform: scale(1.15);
    }
    40% {
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .like-burst svg {
      animation-duration: 1ms;
    }
  }
  .caption {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 64px 16px max(16px, env(safe-area-inset-bottom));
    background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0));
    pointer-events: none;
  }
  .title {
    margin: 0;
    padding-right: 64px;
    font-size: 24px;
    line-height: 32px;
    font-weight: 700;
    color: var(--flip-reel-on-surface, #ffffff);
  }
  .byline {
    margin: 0;
    padding-right: 64px;
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
    color: var(--flip-reel-alpha-white-85, rgba(255, 255, 255, 0.85));
  }
  @media (min-width: 768px) {
    .title,
    .byline {
      padding-right: 0;
    }
  }
  .readmore {
    pointer-events: auto;
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    cursor: pointer;
    border-radius: var(--flip-reel-radius-pill, 9999px);
    padding: 6px 14px;
    font: inherit;
    font-size: 12px;
    line-height: 16px;
    font-weight: 600;
    color: var(--flip-reel-on-surface, #ffffff);
    text-decoration: none;
    background: var(--flip-reel-alpha-white-15, rgba(255, 255, 255, 0.15));
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    transition: background-color 0.15s ease;
  }
  .readmore:hover {
    background: var(--flip-reel-alpha-white-25, rgba(255, 255, 255, 0.25));
  }
  .readmore:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--flip-reel-on-surface, #ffffff);
  }
  .readmore svg {
    width: 14px;
    height: 14px;
  }
  .progress {
    pointer-events: auto;
  }
  .play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    z-index: 15;
    border: none;
    background: transparent;
    cursor: pointer;
  }
  .play-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border: none;
    border-radius: 9999px;
    color: var(--flip-reel-on-surface, #ffffff);
    background: var(--flip-reel-control-bg, rgba(23, 23, 23, 0.8));
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    transition: background-color 0.2s ease;
  }
  .play-overlay:hover .play-circle {
    background: var(--flip-reel-control-bg-hover, rgba(23, 23, 23, 0.95));
  }
  .play-circle svg {
    width: 36px;
    height: 36px;
    transform: translateX(2px);
  }
  .overlay-mute {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border: none;
    border-radius: 9999px;
    color: var(--flip-reel-on-surface, #ffffff);
    background: var(--flip-reel-control-bg, rgba(23, 23, 23, 0.8));
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    cursor: pointer;
  }
  .overlay-mute svg {
    width: 24px;
    height: 24px;
  }
  @media (min-width: 768px) {
    .overlay-mute {
      display: none;
    }
  }
  .ad-overlay {
    position: absolute;
    inset: 0;
    z-index: 35;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--flip-reel-surface, var(--flip-reel-neutral-950, #0a0a0a));
    animation: flip-reel-ad-in 280ms
      var(--flip-reel-ease-emphasized, cubic-bezier(0.22, 1, 0.36, 1));
  }
  .ad-frame {
    position: relative;
    width: 100%;
    height: 100dvh;
    overflow: hidden;
  }
  @media (min-width: 768px) {
    .ad-frame {
      width: var(--reel-w);
      height: var(--reel-h);
      border-radius: var(--flip-reel-radius-card, 16px);
    }
  }
  @keyframes flip-reel-ad-in {
    from {
      opacity: 0;
      transform: scale(1.02);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ad-overlay {
      animation: none;
    }
  }
`
