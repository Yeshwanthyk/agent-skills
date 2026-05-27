---
name: ui-skills
description: Opinionated constraints for building better interfaces with agents.
---

# UI Skills

When invoked, apply these opinionated constraints for building better interfaces.

## How to use

- `/ui-skills`  
  Apply these constraints to any UI work in this conversation.

- `/ui-skills <file>`  
  Review the file against all constraints below and output:
  - violations (quote the exact line/snippet)
  - why it matters (1 short sentence)
  - a concrete fix (code-level suggestion)

## Stack

- MUST use Tailwind CSS defaults unless custom values already exist or are explicitly requested
- MUST use `motion/react` (formerly `framer-motion`) when JavaScript animation is required
- SHOULD use `tw-animate-css` for entrance and micro-animations in Tailwind CSS
- MUST use `cn` utility (`clsx` + `tailwind-merge`) for class logic

## Components

- MUST use accessible component primitives for anything with keyboard or focus behavior (`Base UI`, `React Aria`, `Radix`)
- MUST use the project's existing component primitives first
- NEVER mix primitive systems within the same interaction surface
- SHOULD prefer [`Base UI`](https://base-ui.com/react/components) for new primitives if compatible with the stack
- MUST add an `aria-label` to icon-only buttons
- NEVER rebuild keyboard or focus behavior by hand unless explicitly requested
- MUST prefer native semantics (`button`, `a`, `label`, `table`) before `aria-*`
- MUST use `<a>` or `<Link>` for navigation—never `<button>` or `<div>` for links

## Accessibility

- MUST follow [WAI-ARIA Authoring Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) for keyboard & focus
- MUST show visible focus ring on every focusable element; prefer `:focus-visible` over `:focus`
- MUST manage focus: traps in modals, move & return focus per WAI-ARIA patterns
- MUST use polite `aria-live` for toasts & async updates
- MUST include redundant status cues—don't rely on color alone
- MUST provide hierarchical `<h1–h6>` headings & a "Skip to content" link
- NEVER disable browser zoom

## Interaction

- MUST use an `AlertDialog` for destructive or irreversible actions
- SHOULD use structural skeletons for loading states; skeletons mirror final content to avoid CLS
- NEVER use `h-screen`, use `h-dvh`
- MUST respect `safe-area-inset` for fixed elements
- MUST show errors next to where the action happens
- NEVER block paste in `input` or `textarea` elements
- MUST expand hit targets to ≥24px if visual target is smaller; ≥44px on mobile
- MUST set `touch-action: manipulation` on controls to prevent double-tap zoom
- MUST persist meaningful state in URL (filters, tabs, pagination, expanded panels)
- SHOULD use optimistic updates when success is likely; reconcile or roll back on failure
- SHOULD add minimum loading-state duration (~150–300ms delay, ~300–500ms visible) to avoid flicker
- SHOULD show loading indicator on buttons while keeping original label
- SHOULD delay first tooltip in a group; subsequent peers show immediately
- SHOULD set `overscroll-behavior: contain` in modals & drawers
- SHOULD preserve scroll positions on Back/Forward navigation
- SHOULD autofocus primary input on desktop single-input screens; rarely on mobile
- SHOULD disable text selection & apply `inert` while dragging elements

## Animation

- NEVER add animation unless it is explicitly requested
- MUST animate only compositor props (`transform`, `opacity`)
- NEVER animate layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`)
- NEVER use `transition: all`—explicitly list only intended properties
- SHOULD avoid animating paint properties (`background`, `color`) except for small, local UI (text, icons)
- SHOULD use `ease-out` on entrance
- NEVER exceed `200ms` for interaction feedback
- MUST pause looping animations when off-screen
- MUST honor `prefers-reduced-motion` with a reduced-motion variant
- NEVER introduce custom easing curves unless explicitly requested
- SHOULD avoid animating large images or full-screen surfaces
- SHOULD prefer CSS > Web Animations API > JS libraries when possible
- SHOULD make animations interruptible by user input
- SHOULD avoid autoplay; animate in response to user actions
- SHOULD anchor transforms to where motion "physically" starts (`transform-origin`)
- SHOULD wrap SVG elements in `<g>` for cross-browser transforms with `transform-box: fill-box; transform-origin: center`

## Typography

- MUST use `text-balance` for headings and `text-pretty` for body/paragraphs
- MUST use `tabular-nums` for numeric data
- SHOULD use `truncate` or `line-clamp` for dense UI
- NEVER modify `letter-spacing` (`tracking-*`) unless explicitly requested
- SHOULD use curly quotes (" ") over straight quotes (" ")
- SHOULD use ellipsis character `…` over three periods `...`
- SHOULD avoid widows/orphans; tidy rag & line breaks
- SHOULD use `&nbsp;` for glued terms: `10&nbsp;MB`, `⌘&nbsp;+&nbsp;K`

## Layout

- MUST use a fixed `z-index` scale (no arbitrary `z-*`)
- SHOULD use `size-*` for square elements instead of `w-*` + `h-*`
- SHOULD prefer flex/grid/intrinsic layout over measuring in JS
- SHOULD apply optical alignment ±1px when perception beats geometry
- SHOULD verify on mobile, laptop, & ultra-wide (50% zoom to simulate)
- SHOULD set `scroll-margin-top` on anchored headings for hash links

## Forms

- MUST ensure every control has a `<label>` or associated accessible name
- MUST enable form submission with Enter on text inputs (Cmd/Ctrl+Enter for textarea)
- MUST focus first errored field on submit
- MUST set appropriate `type`, `inputmode`, and `autocomplete` attributes
- SHOULD keep submit enabled until submission starts; then disable + show spinner
- SHOULD allow any input and show validation feedback—don't block keystrokes
- SHOULD warn before navigation when unsaved changes exist
- SHOULD disable spellcheck for emails, codes, usernames
- SHOULD trim whitespace from input values (text expansions add trailing spaces)
- SHOULD set explicit `background-color` and `color` on native `<select>` for Windows dark-mode
- NEVER pre-disable submit—allow submitting incomplete forms to surface validation

## Content

- MUST set accurate `<title>` reflecting current context
- MUST design all states: empty, sparse, dense, error
- MUST give empty states one clear next action
- SHOULD prefer inline explanations; use tooltips as last resort
- SHOULD use `…` suffix for menu items that open follow-ups ("Rename…") and loading states ("Saving…")
- SHOULD make layouts resilient to short, average, & long user-generated content
- SHOULD format dates, times, numbers, currencies for the user's locale via `Accept-Language`

## Performance

- NEVER animate large `blur()` or `backdrop-filter` surfaces
- NEVER apply `will-change` outside an active animation
- NEVER use `useEffect` for anything that can be expressed as render logic
- MUST set explicit image dimensions to avoid CLS
- MUST virtualize large lists (e.g., `virtua`, `content-visibility: auto`)
- SHOULD preload above-fold images only; lazy-load the rest
- SHOULD use `<link rel="preconnect">` for asset/CDN domains
- SHOULD preload & subset fonts (unicode-range, limit variable axes)
- SHOULD prefer uncontrolled inputs; make controlled loops cheap
- SHOULD batch DOM reads/writes; avoid layout thrash
- SHOULD target <500ms for `POST/PATCH/DELETE` responses
- SHOULD move expensive work to Web Workers

## Design

- NEVER use gradients unless explicitly requested
- NEVER use purple or multicolor gradients
- NEVER use glow effects as primary affordances
- SHOULD use Tailwind CSS default shadow scale unless explicitly requested
- SHOULD limit accent color usage to one per view
- SHOULD use existing theme or Tailwind CSS color tokens before introducing new ones
- SHOULD use layered shadows (ambient + direct light) for depth
- SHOULD combine borders & shadows; semi-transparent borders improve edge clarity
- SHOULD ensure nested radii: child ≤ parent, concentric curves
- SHOULD tint borders/shadows/text toward hue on non-neutral backgrounds
- SHOULD use color-blind-friendly palettes for charts
- SHOULD prefer APCA over WCAG 2 for perceptual contrast checks
- SHOULD increase contrast on `:hover`, `:active`, `:focus` vs rest state
- SHOULD set `<meta name="theme-color">` to match page background
- SHOULD set `color-scheme: dark` on `<html>` for proper scrollbar/device UI contrast in dark themes
