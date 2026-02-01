# Project Status & To-Do List

## 🟢 Phase 1: Core Architecture & Physics
- [x] **Physics Engine Hook**: Implement `usePhysics` for velocity, boundary checking, and elastic collisions.
- [x] **FloatingComponent**: Create a wrapper component for floating elements.
- [x] **Home Page**: Wire up the physics engine with the required links (Noah Hill, About, Contact, etc.).
- [x] **Global Layout**: Ensure full-screen, no-scroll container.

## 🟢 Phase 2: The "Evil" UX (Theming)
- [x] **Brightness State**: Implement progressive Light/Dark modes (-10 to +10).
- [x] **Random Mode**: Implement random color generation for background and elements.
- [x] **The Trap**: Implement the "invisible" state + popup logic.
- [x] **IP Punishment**: Add Vercel KV/Edge Middleware logic for locking "bad" IPs (Stubbed for local dev).

## 🟢 Phase 3: Content Pages
- [x] **About / Projects / Goods**: Basic text pages with floating physics headers.
- [x] **Contact Page**: Floating form inputs with validation and "chase" mechanics.
- [x] **Music Page**: Floating iframe embeds (placeholders).
- [x] **Services Page**: "Sick as Fuck Art Car" service specific listing.
- [x] **Words (Blog)**: Setup Decap CMS at `/admin` and blog listing page.

## 🟢 Phase 4: Special Flows
- [x] **Cult Page**: Email input -> GIF -> Fade -> "Dope, thanks".
- [x] **Mood Popup**: 11s timer on Home, logging to API.
- [x] **Social Sharing**: Dynamic metadata images (noshare.png logic).

## ⚪ Phase 5: Polish
- [ ] Mobile optimization (touch events, velocity tuning) - *Partially handled via CSS/Physics checks*.
- [ ] Accessibility check - *Intentionally hostile UX as per spec*.