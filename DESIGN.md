---
name: RoadmapAI
description: AI-powered personalized learning & progression roadmap generator
colors:
  primary: "#006591"
  on-primary: "#ffffff"
  primary-container: "#0ea5e9"
  on-primary-container: "#003751"
  primary-fixed: "#c9e6ff"
  secondary: "#006c49"
  on-secondary: "#ffffff"
  secondary-container: "#6cf8bb"
  on-secondary-container: "#00714d"
  secondary-fixed: "#6ffbbe"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  background: "#f7f9fb"
  on-background: "#191c1e"
  surface: "#f7f9fb"
  on-surface: "#191c1e"
  on-surface-variant: "#3e4850"
  surface-variant: "#e0e3e5"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f2f4f6"
  surface-container: "#eceef0"
  outline: "#6e7881"
  outline-variant: "#bec8d2"
typography:
  display:
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "normal"
  label:
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
    letterSpacing: "normal"
  helper:
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "normal"
rounded:
  default: "4px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  base: "4px"
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-outline:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.2xl}"
    padding: "24px"
---

# Design System

## Overview
RoadmapAI is designed to provide an uncluttered, calm, and trustworthy learning tracking experience.
The visual system builds upon Material 3 design tokens with an intentional, restrained blue-and-teal palette.
Clarity and low cognitive load take precedence: one primary action per screen, well-defined hierarchy, and generous breathing room.

## Colors
- **Primary Blue (`#006591`)**: Brand identity, focused borders, active icons, and key highlights.
- **Primary Container (`#0ea5e9`)** & **On-Primary Container (`#003751`)**: The primary button background and label color.
- **Secondary Teal (`#006c49`)** & **Container (`#6cf8bb`)**: Milestones, achievements, and progress feedback.
- **Error (`#ba1a1a`)** & **Container (`#ffdad6`)**: Form validation feedback and critical alerts.
- **Surfaces (`#f7f9fb` to `#ffffff`)**: Layered surfaces (`surface-container-lowest` for cards, `surface-container-low` for footers).
- **Outlines (`#6e7881`, `#bec8d2`)**: Subtle borders for inputs and cards, maintaining contrast without visual weight.

## Typography
- **Primary Font**: `Inter`, system-ui, sans-serif.
- **Title / Display**: 32px / 40px line-height, semi-bold (600), -0.01em letter spacing.
- **Body**: 16px / 24px line-height, regular (400).
- **UI & Labels**: 14px / 20px line-height, medium (500).
- **Helper & Errors**: 12px / 16px line-height, regular (400).

## Layout
- **Container Max-Width**: `1280px` (`--container-max`).
- **Auth Shell**: Centered layout, max-width `520px`, full-height `100dvh`.
- **Responsive Strategy**: Mobile-first grid and flex layouts. Two-column grids (e.g. social auth buttons) collapse gracefully; footers transition from column to row at 768px.

## Elevation & Depth
- **Shadow Sm**: Subtle diffused elevation for cards and primary buttons: `rgba(0, 0, 0, 0.1) 0 4px 6px -2px, rgba(0, 0, 0, 0.06) 0 2px 4px -2px`.
- Outline buttons and secondary containers use flat borders rather than shadows.

## Shapes
- **Inputs & Buttons**: `8px` (`--radius-lg`).
- **Cards**: `16px` (`--radius-2xl`).
- **Pills / Checkbox**: `9999px` (`--radius-full`).

## Components
- **Button**:
  - `primary`: filled container `#0ea5e9` with dark text `#003751`, active scale effect.
  - `outline`: white surface with border `#bec8d2`, hover state `#f2f4f6`.
  - Full width in auth flows with 12px vertical padding.
- **Input**:
  - Border `#bec8d2`, focus border `#006591` with focus halo `0 0 0 2px #c9e6ff`.
  - Icon slots with left/right padding adjustments (`48px`).
- **AuthCard**:
  - White surface, 1px border, 16px radius, responsive padding (24px mobile -> 40px tablet+).

## Do's and Don'ts
- **Do**: Always provide a visible focus ring on interactive elements.
- **Do**: Keep only one primary filled action button per screen.
- **Do**: Use semantic color tokens instead of hardcoded hex values.
- **Don't**: Introduce arbitrary font sizes or fonts outside `Inter`.
- **Don't**: Overwhelm screens with dense nested containers or high-contrast shadows.
