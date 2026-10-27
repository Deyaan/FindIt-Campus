# FindIt — Smart Campus Lost & Found Platform
## Project Status & Implementation Blueprint

### 1. Project Overview & Current State
- **Project Name:** FindIt — Smart Campus Lost & Found Platform
- **Current Status:** Phase 8 Complete (Claims Module + Admin Portal Operational)
- **Deadline:** Immediate (Next-Day Delivery)
- **Workspace State:** Full application operational: Browse, Search, Item Details, Claim submission (ClaimModal), Student Dashboard (My Reports + My Claims), Admin Portal (metrics, claims review with approve/reject/mark-returned, item moderation). Production build verified (exit 0, 612ms).
- **Next Task:** Phase 9 — UI Polish, then Phase 10 — Vercel Deployment.

---

### 2. Confirmed Technology Stack
- **Frontend Framework:** React 18+ (Vite, JavaScript `.jsx`)
- **Styling:** Tailwind CSS + Lucide React (icons)
- **Backend & Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth (Email/Password or Campus Email magic link)
- **File Storage:** Supabase Storage (`item-photos` bucket)
- **Deployment & Hosting:** Vercel
- **Version Control:** Git & GitHub

---

### 3. Core Architecture & Data Schema
#### Tables:
1. **`profiles`**
   - `id` (UUID, PK -> auth.users.id, ON DELETE CASCADE)
   - `email` (TEXT)
   - `full_name` (TEXT)
   - `role` (TEXT: `'student'` | `'admin'`, default `'student'`)
   - `created_at` (TIMESTAMPTZ)
2. **`items`**
   - `id` (UUID, PK, default uuid_generate_v4())
   - `user_id` (UUID, FK -> profiles.id)
   - `type` (TEXT: `'lost'` | `'found'`)
   - `title` (TEXT)
   - `category` (TEXT: e.g., Electronics, Cards/IDs, Books, Keys, Clothing, Other)
   - `description` (TEXT)
   - `location` (TEXT: e.g., Library, Cafeteria, Science Block, Gym, Other)
   - `date_incident` (DATE)
   - `photo_url` (TEXT, nullable)
   - `status` (TEXT: `'active'` | `'claimed'` | `'returned'` | `'moderated'`)
   - `created_at` (TIMESTAMPTZ)
3. **`claims`**
   - `id` (UUID, PK, default uuid_generate_v4())
   - `item_id` (UUID, FK -> items.id, ON DELETE CASCADE)
   - `claimant_id` (UUID, FK -> profiles.id)
   - `proof_description` (TEXT)
   - `contact_details` (TEXT)
   - `status` (TEXT: `'pending'` | `'approved'` | `'rejected'`)
   - `admin_notes` (TEXT, nullable)
   - `created_at` (TIMESTAMPTZ)

#### Row Level Security (RLS) Rules:
- **`items`**: 
  - Read: Public can view active/returned items (moderated items excluded).
  - Insert: Authenticated users can insert their own reports (`auth.uid() = user_id`).
  - Update: Author can update before resolution; Admins can update any item.
- **`claims`**:
  - Read: Only claimant (`claimant_id = auth.uid()`) AND admins can read claims.
  - Insert: Authenticated users can submit a claim for a found item (cannot claim own reported item).
  - Update: Only Admins can update claim status and admin notes.
- **`profiles`**:
  - Read: Public / authenticated for display names.
  - Update: Users update own profile; role changes restricted to admin/DB trigger.

---

### 4. Deterministic Matching Engine Specification
Max Score: **100 points**
- **Category Match (30 pts):** Exact match = 30; otherwise 0.
- **Description Keyword Jaccard Similarity (30 pts):**
  - Tokenization, lowercase, stopwords filtered (e.g., "the", "a", "with", "my").
  - $J(A, B) = \frac{|A \cap B|}{|A \cup B|}$; Score = $\text{round}(J \times 30)$.
- **Location Similarity (25 pts):**
  - Exact campus zone = 25 pts; partial substring match = 15 pts; otherwise 0.
- **Date Proximity (15 pts):**
  - $|\Delta \text{days}| \le 1$: 15 pts
  - $|\Delta \text{days}| \le 3$: 10 pts
  - $|\Delta \text{days}| \le 7$: 5 pts
  - $|\Delta \text{days}| > 7$: 0 pts
- **Output:** Numerical score (0-100), sorted descending, labeled explicitly as *"Potential Match (Score: X%) — Verification Required"*.

---

### 5. Implementation Sequence (Prioritized for 1-Day Delivery)
1. **Step 1:** Project initialization (Vite + React + Tailwind + Lucide Icons + Supabase JS Client + Router).
2. **Step 2:** Database schema SQL script + Storage bucket creation + RLS configuration in Supabase.
3. **Step 3:** Authentication (Login/Register, AuthContext, role resolution, protected routes).
4. **Step 4:** Item Reporting Module (Submit Lost / Found forms with Supabase photo upload).
5. **Step 5:** Browse & Search Feed (Category, location, type, keyword filters + card listing).
6. **Step 6:** Deterministic Matching Engine & Match Modal (Automated suggestions on detail/report pages).
7. **Step 7:** Claims Module (Claim submission form for found items, Claimant Dashboard to track status).
8. **Step 8:** Admin Management Portal (Moderation, claims review approve/reject, analytics metrics).
9. **Step 9:** Polish UI/UX (Loading spinners, empty states, toast alerts, error boundaries).
10. **Step 10:** Production deployment on Vercel & sanity verification.

---

### 6. Milestone Verification History
- **Phase 1 (Foundation):** `npm run build` passed (bundled 1992 modules), `npm run dev` verified at `http://localhost:5173/`, Git `.gitignore` verified.
- **Phase 2 (Database & Storage Architecture):**
  - Migration script prepared at `supabase/migrations/001_initial_schema.sql` covering `profiles`, `items`, `claims`, indexes, constraints, timestamps, and `item-photos` storage policies.
  - Role security: `handle_new_user()` enforces `role = 'student'` and `prevent_role_self_elevation()` trigger blocks privilege tampering.
  - Privacy: RLS on `claims` restricts view access strictly to claimant and administrators (`is_admin()`).
  - Storage: Isolated namespace per user (`item-photos/{auth.uid()}/...`) with time-limited signed URL retrieval model.
  - Comprehensive documentation generated at `docs/database-schema.md`.
- **Phase 3 (Authentication, Forms, and Route Guards):**
  - Implemented `src/context/AuthContext.jsx`: Supabase session initialization, user/profile sync, role resolution (`role` fetched from `profiles` table, never trusted from client metadata), `login`, `register`, `logout`, and unmount cleanup.
  - Implemented `src/pages/Login.jsx` & `src/pages/Register.jsx`: Full client-side validation (matching passwords, minimum length), responsive design, loading spinners, and email confirmation status notifications.
  - Implemented `src/components/common/RouteGuards.jsx`: `ProtectedRoute` for authenticated users with redirection preserving intended destination (`location.state.from`); `AdminRoute` blocking non-administrators with a styled 403 Forbidden screen.
  - Updated `src/components/common/Navbar.jsx`: Dynamic user badge, role display, sign out trigger, and conditional `Admin Portal` link restricted strictly to administrators.
  - Verified remote database connection against configured Supabase project: verified `profiles` table is online and responding.
  - Verified authentication endpoint connectivity: verified `getSession()` and handled error responses.
  - **Phase 5 (Browse Feed, Search, Filters, and Item Details):**
  - Implemented `src/lib/storage.js`: Cache-backed signed URL generator (`getItemSignedUrl` and `batchGetSignedUrls`) for private `item-photos` storage.
  - Implemented `src/components/items/ItemCard.jsx`: Responsive item card with Lost/Found badges, category pill, metadata, photo thumbnail, and view details action.
  - Implemented `src/components/items/ItemFilter.jsx`: Multi-attribute filter combining debounced keyword search (across title and description), type toggle pills (All/Lost/Found), category dropdown, location filter, clear filters button, and live count indicator.
  - Implemented `src/pages/Browse.jsx`: Paginated feed with range queries (avoiding fetching unlimited records), skeleton loading states, empty states, and error alerts with retry triggers.
  - Implemented `src/pages/ItemDetail.jsx`: Comprehensive details page at `/items/:id` with UUID format validation, full description, metadata grid, signed photo display, friendly 404 screen, and integration notices for Phase 6/7.
  - Registered route `/items/:id` in `src/App.jsx`.
  - Remote verification: Verified queries against remote Supabase database. Retrieved 2 live records (`charger` and `book`) and verified table joins with `profiles`.
  - Storage verification: Verified signed URL generation on the private `item-photos` bucket; confirmed graceful fallback when photos are absent or inaccessible.
  - Production build: `npm run build` completed with zero errors (bundled in 603ms).

---

### 7. Milestone Verification (Phases 6–8)
- **Phase 6 (Deterministic Matching Engine):**
  - `src/lib/matching.js`: Category (30 pts) + Description Jaccard (30 pts) + Location (25 pts) + Date Proximity (15 pts). Max: 100.
  - `src/components/items/PotentialMatches.jsx`: Scored match cards, score bars, batch signed URL thumbnails, refresh, disclaimer, all states.
  - Integrated into `ItemDetail.jsx`.
- **Phase 7 (Claims Module):**
  - `src/components/claims/ClaimModal.jsx`: Proof (min 20 chars) + contact fields, own-item guard, privacy notice, Supabase insert.
  - `src/pages/ItemDetail.jsx`: "Submit Claim" button for found items, success banner on claimed.
  - `src/pages/Dashboard.jsx`: My Reports tab + My Claims tab with real Supabase queries.
- **Phase 8 (Admin Portal):**
  - `src/pages/Admin.jsx`: Metrics cards, Claims Review (approve/reject/mark-returned), Item Moderation (moderate/restore). Approve sets item to 'claimed'; physical return is a separate step.
  - `npm run build` passed — exit 0, 2002 modules, 612ms.

---

### 8. Milestone Verification (Phase 9 — Dark Mode & Theme Toggle)
- **Design Inspiration:** `https://codementor-olive.vercel.app/` — deep obsidian canvas (`#0d0e15`), dark grey elevated cards (`#151724`), sleek violet/purple accents (`#7c6eed` / `#8b5cf6`), subtle borders (`#1f2130` / `border-slate-800`), and modern typography.
- **Default State:** Defaults to **Dark Mode** on initial load with zero white flash (`<html class="dark">` with inline `<head>` script syncing `localStorage`).
- **User Toggle:** `ThemeToggle.jsx` with Sun/Moon icons and micro-animations, integrated into desktop header and mobile menu.
- **State Management:** `ThemeContext.jsx` with `ThemeProvider` and `useTheme()` hook, persisting choice in `localStorage` (`findit_theme`).
- **Tailwind v4 Setup:** `@custom-variant dark (&:where(.dark, .dark *));` configured in `src/index.css`.
- **Pages & Components Restyled:**
  - `Navbar.jsx` (glassmorphism header, purple glow badge, theme toggle)
  - `Footer.jsx` (dark styling, brand mark)
  - `Home.jsx` (dark hero canvas, purple radial glow, feature cards)
  - `Browse.jsx` (dark feed, search filters, skeleton states, reset action)
  - `ItemCard.jsx` & `ItemFilter.jsx` (dark cards, category pills, select dropdowns)
  - `ItemDetail.jsx` (dark metadata cards, back link, photo viewer)
  - `PotentialMatches.jsx` (dark score bars, candidate cards)
  - `ClaimModal.jsx` (dark modal backdrop, inputs, purple gradient button)
  - `Dashboard.jsx` (dark tabs, reports, claims status badges)
  - `Admin.jsx` (dark metric cards, claim review table, moderation items)
  - `Login.jsx` & `Register.jsx` (dark auth cards, inputs, purple gradient submit buttons)
  - `RouteGuards.jsx` (dark 403 Forbidden screen & loading spinner)
- **Production Build:** Verified with `npm run build` (exit code 0, 2004 modules, 619ms).

---

### 9. Remaining Steps
- **Vercel Deployment:** Push to Git repository → Deploy to Vercel → Configure Supabase environment variables → Smoke test production URL.

