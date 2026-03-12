## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, sveltekit-adapter, devtools-json, mcp

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AAC Board — a planned SvelteKit rewrite of [Cboard](https://github.com/cboard-org/cboard), an open-source AAC (Augmentative and Alternative Communication) web application. The project is currently in the **pre-development planning phase**.

The primary document is `cboard-sveltekit-evaluation.md` — a Hebrew-language technical evaluation covering the existing Cboard architecture and the proposed migration plan.

## Planned Tech Stack

- **Framework**: SvelteKit (migrating from React 17 + Redux)
- **UI**: shadcn-svelte + Tailwind CSS (replacing Material-UI 4)
- **State Management**: Svelte stores (replacing Redux + redux-thunk)
- **Build Tool**: Vite (via SvelteKit, replacing CRACO/CRA)
- **Internationalization**: ~50+ languages (replacing react-intl)
- **Speech/TTS**: Microsoft Cognitive Services Speech SDK, Azure TTS, ElevenLabs
- **Storage**: IndexedDB for local persistence
- **Testing**: Playwright for E2E

## Domain Context

- **AAC**: Augmentative and Alternative Communication — assistive technology for people with speech/language impairments
- **Board (לוח)**: A grid of tiles representing words, phrases, or actions
- **Tile (אריח)**: A single cell — can be a button (speaks a word), folder (navigates to another board), or board link
- **Communicator (מתקשר)**: A collection of boards forming a complete communication system
- **Switch scanning**: Accessibility feature allowing board navigation via physical switches
- **Key providers**: Language, Scanner, Speech, Subscription, Theme

## Original Cboard API

The backend is a separate Node.js service ([cboard-api](https://github.com/cboard-org/cboard-api)) with ~35 REST endpoints handling authentication, board CRUD, user management, analytics, and subscriptions.

## Language

Project documentation is in Hebrew. Code and technical identifiers should remain in English.
