<div align="center">

# FindIt

### Smart Campus Lost & Found Platform

A centralized platform to report, discover, and recover lost belongings on campus.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20FindIt-2563EB?style=flat-square)](https://find-it-campus-three.vercel.app)
[![Built with React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Powered by Supabase](https://img.shields.io/badge/Backend-Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployment-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---
## Explainer Video -
https://drive.google.com/file/d/1zV28xixW6qfOmpjv0L18QuV1KFONRGmj/view?usp=sharing

## Overview

FindIt is a web-based lost-and-found platform designed to make recovering belongings on campus easier and more organized. Students can report lost or found items, search listings, view potential matches, and submit ownership claims. Administrators can review claims, moderate listings, and track returned items.

## The Problem

Campus lost-and-found processes often rely on messaging groups, word-of-mouth, or physical notice boards. These approaches can be fragmented and time-consuming, making it difficult to connect a lost-item report with the person who found it.

FindIt brings these workflows into one place and adds a deterministic matching score to help users identify potentially related reports.

## Project Objectives

- Centralize lost and found item reports.
- Make listings easier to discover through search and filters.
- Surface potential matches using item details, location, and date.
- Support ownership claims and administrator review.
- Track moderation and item-return status.
- Protect restricted actions with authentication and role-based access.

## Features

### For Students
- **Authentication:** Register, log in, and log out.
- **Item reporting:** Create lost or found reports with details and photographs.
- **Browse and search:** Explore listings, apply filters, and open item detail pages.
- **Potential matches:** See reports that may correspond to a lost or found item.
- **Ownership claims:** Submit supporting information to claim an item.
- **Personal dashboard:** Review submitted reports and claims.

### For Administrators
- **Dashboard:** View platform metrics and manage activity.
- **Claim management:** Review claims and approve or reject them.
- **Item status:** Mark items as returned after recovery.
- **Listing moderation:** Moderate listings and restore them when appropriate.

## Smart Matching

FindIt uses a custom, deterministic scoring algorithm to rank potentially related reports. The maximum score is **100 points**.

| Signal | Maximum score |
|---|---:|
| Category similarity | 30 |
| Description similarity | 30 |
| Location similarity | 25 |
| Date proximity | 15 |
| **Total** | **100** |

A higher score means a stronger match according to the configured rules. It is a suggestion—not proof of ownership—so claims still need to be reviewed.

## Technology Stack

| Technology | Role |
|---|---|
| React | Component-based user interface |
| Vite | Development server and production build |
| JavaScript (ES6+) | Application logic |
| Tailwind CSS v4 | Styling and responsive layout |
| React Router | Client-side navigation and protected routes |
| Supabase | Backend services |
| PostgreSQL | Relational data storage |
| Supabase Auth | Authentication and session management |
| Supabase Storage | Item photograph storage |
| Git and GitHub | Version control and source hosting |
| Vercel | Production deployment |

## How It Works

1. A student signs in and submits a lost or found item report.
2. The report and its details are stored through Supabase; photographs are stored in Supabase Storage.
3. FindIt calculates match scores using category, description, location, and date.
4. Students can browse listings and submit claims with supporting information.
5. An administrator reviews claims, updates item status, and moderates listings.

## User Roles

| Role | Main permissions |
|---|---|
| **Student** | Create reports, browse listings, view potential matches, submit claims, and manage personal activity |
| **Administrator** | Review claims, moderate listings, and update item-return status |

Route guards and role checks restrict access in the frontend. Database access should also be enforced through appropriate Supabase Row Level Security (RLS) and Storage policies.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- A [Supabase](https://supabase.com/) project
- Git

### 1. Clone the repository

Replace the placeholders with your repository URL and folder name.

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
```

Use the URL and publishable/anon key from your Supabase project settings.

### 4. Run the development server

```bash
npm run dev
```

Open the local URL shown in the terminal.

### 5. Build for production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Supabase Configuration

For a fresh setup:

1. Create a Supabase project and configure the environment variables above.
2. Apply the SQL schema and migrations included in the repository. The initial migration is located at `supabase/migrations/001_initial_schema.sql`.
3. Confirm that required tables, functions, triggers, and Row Level Security policies are installed.
4. Configure the `item-photos` Storage bucket and its policies according to the application's upload and access requirements.
5. Create accounts through the application and configure administrator access using a secure, intended administrative process.

The exact database configuration should follow the migrations in the checked-out repository version.

## Deployment

The production application is hosted on Vercel.

**Live application:** [find-it-campus-three.vercel.app](https://find-it-campus-three.vercel.app)

To deploy your own copy:

1. Push the project to GitHub and import the repository into Vercel.
2. Use the Vite framework preset.
3. Set the build command to `npm run build` and the output directory to `dist`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel's environment variables.
5. Deploy and test authentication, reports, image uploads, matching, claims, and admin access.

The root `vercel.json` configures single-page application routing for client-side routes.

## Security Notes

- Never expose Supabase service-role keys in frontend code or `VITE_` environment variables.
- Keep `.env` out of source control and provide only placeholder values in example files.
- Use Row Level Security and Storage policies to enforce data access rules.
- Restrict administrator actions to authorized accounts.
- Treat matching scores as suggestions, not proof of ownership.
- Collect and expose only the personal information necessary to handle claims.

## Possible Future Improvements

- Notifications for potential matches and claim updates.
- More detailed claim history and audit trails.
- Campus-specific pickup locations.
- Expanded automated tests and accessibility improvements.
- Analytics on recovery outcomes and common lost-item categories.

---

<div align="center">

**FindIt** · Making campus item recovery simpler and more organized.

[Open the live application](https://find-it-campus-three.vercel.app)

</div>
