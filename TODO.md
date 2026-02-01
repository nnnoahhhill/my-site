# Project Status & To-Do List

## 🟢 Phase 1: Core Architecture & Physics
- [x] **Physics Engine Hook**: Implement `usePhysics` for velocity, boundary checking, and elastic collisions.
- [x] **FloatingComponent**: Create a wrapper component for floating elements.
- [x] **Home Page**: Wire up the physics engine with the required links (Noah Hill, About, Contact, etc.).
- [x] **Global Layout**: Ensure full-screen, no-scroll container.
- [x] **Physics Overlap Prevention**: Added rejection sampling for initial spawn positions.

## 🟢 Phase 2: The "Evil" UX (Theming)
- [x] **Brightness State**: Implement progressive Light/Dark modes (-10 to +10). **FIXED: Now correctly goes to +10**
- [x] **Random Mode**: Implement random color generation for background and elements.
- [x] **The Trap**: Implement the "invisible" state + popup logic. **FIXED: Triggers at +10 or -10**
- [x] **IP Punishment**: Add Vercel KV/Edge Middleware logic for locking "bad" IPs (Stubbed for local dev).

## 🟢 Phase 3: Content Pages
- [x] **About / Projects / Goods**: Basic text pages with floating physics headers.
- [x] **Contact Page**: Floating form inputs with validation and "chase" mechanics. **FIXED: Now logs to API**
- [x] **Music Page**: Floating iframe embeds. **FIXED: Added actual embed structure**
- [x] **Services Page**: "Sick as Fuck Art Car" service specific listing. **FIXED: Added full description**
- [x] **Words (Blog)**: Setup Decap CMS at `/admin` and blog listing page.

## 🟢 Phase 4: Special Flows
- [x] **Cult Page**: Email input -> GIF -> Fade -> "Dope, thanks". **FIXED: Now logs to API**
- [x] **Mood Popup**: 11s timer on Home, logging to API. **FIXED: Now actually POSTs to API**
- [x] **Social Sharing**: Dynamic metadata images (noshare.png logic). **FIXED: Added metadata to all pages**

## ⚪ Phase 5: Polish
- [x] Mobile optimization (touch events, velocity tuning). **FIXED: Added tap-to-underline, second-tap-to-navigate**
- [ ] Accessibility check - *Intentionally hostile UX as per spec*.

## 📝 Recent Fixes (Latest Session)
- ✅ Fixed brightness range: Now correctly goes from -10 to +10 (was -10 to +5)
- ✅ Fixed trap trigger: Now triggers at +10 OR -10 (was +5)
- ✅ Mood API: Now actually POSTs to `/api/mood` with proper data structure
- ✅ Cult API: Now actually POSTs email to `/api/cult` on join
- ✅ Contact API: Created `/api/contact` route and wired up form submission
- ✅ Social Metadata: Added OpenGraph/Twitter metadata to all pages with proper images
- ✅ Cult Metadata: Special "gatekeep this at all costs" metadata with noshare.png
- ✅ Services Page: Added full art car description text
- ✅ Music Page: Added actual Spotify/SoundCloud embed structure (replace URLs with real ones)
- ✅ Mobile Touch: Added tap-to-underline, second-tap-to-navigate behavior
- ✅ Physics: Added rejection sampling to prevent initial overlaps

## 🔴 Remaining Items
- [ ] **Decap CMS**: Config exists but may need Git Gateway setup for production
- [ ] **Words Featured Section**: Currently featured posts are just styled differently (works with floating physics)
- [ ] **Music Embeds**: Replace placeholder URLs with actual SoundCloud/Spotify links