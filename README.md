# FindIt --- Smart Campus Lost & Found Platform

FindIt is a web-based lost-and-found platform designed to help students
report, discover, and recover belongings lost on campus. It brings lost
and found reports into one place and uses a transparent, rule-based
matching algorithm to highlight potentially related items.

**Live application:** https://find-it-campus-three.vercel.app

------------------------------------------------------------------------

## Table of Contents

-   [Overview](#overview)
-   [Problem Statement](#problem-statement)
-   [Project Objectives](#project-objectives)
-   [Key Features](#key-features)
-   [How Smart Matching Works](#how-smart-matching-works)
-   [User Roles](#user-roles)
-   [Technology Stack](#technology-stack)
-   [Application Architecture](#application-architecture)
-   [Getting Started](#getting-started)
-   [Environment Variables](#environment-variables)
-   [Supabase Setup](#supabase-setup)
-   [Build and Deployment](#build-and-deployment)
-   [Security Notes](#security-notes)
-   [Future Improvements](#future-improvements)

------------------------------------------------------------------------

## Overview

Finding a lost item on a college campus can be difficult when reports
are spread across messaging groups, informal conversations, and physical
notice boards. FindIt provides a centralized workflow for reporting
items, searching listings, identifying possible matches, and reviewing
ownership claims.

The platform includes student-facing reporting and discovery tools as
well as an administrator workflow for moderating listings and handling
claims.

## Problem Statement

Students frequently lose belongings such as ID cards, wallets, keys,
books, and electronic devices on campus. Informal methods of finding
these items are often fragmented, time-consuming, and unreliable. There
is no convenient way to connect a lost-item report with a corresponding
found-item report or to manage ownership claims in a structured manner.

FindIt addresses this problem through a centralized web application that
organizes lost and found reports, suggests potential matches, and
supports a claim-review process.

## Project Objectives

-   Provide one place for students to report lost and found items.
-   Make listings easier to discover through browsing, searching, and
    filters.
-   Identify potentially related reports using a consistent matching
    score.
-   Allow users to submit ownership claims with supporting information.
-   Give administrators tools to review claims and moderate listings.
-   Track item status, including when an item has been returned.
-   Protect application functionality through authentication and
    role-based access controls.

## Key Features

### Student Features

-   **Authentication:** Register, log in, and log out.
-   **Report an item:** Submit lost or found item reports with relevant
    details and a photograph.
-   **Browse listings:** Explore available reports and view item
    details.
-   **Search and filters:** Narrow listings to find relevant reports.
-   **Potential matches:** View items that score as possible matches for
    a report.
-   **Submit a claim:** Provide proof or details to support a claim of
    ownership.
-   **Dashboard:** Review personal reports and submitted claims.

### Administrator Features

-   **Admin dashboard:** View administrative metrics and manage platform
    activity.
-   **Claim review:** Review claims and approve or reject them.
-   **Return tracking:** Mark an item as returned when the recovery
    process is complete.
-   **Listing moderation:** Moderate listings and restore them where
    appropriate.

### Access Control

Student and administrator capabilities are separated. Protected routes
restrict access to authenticated users, and administrator routes require
the appropriate role. Database security policies should be configured to
enforce access rules at the data layer as well.

## How Smart Matching Works

FindIt uses a custom deterministic scoring algorithm to rank potential
matches. The score is out of 100 and combines four signals:

  Matching factor            Maximum points
  ------------------------ ----------------
  Item category                          30
  Description similarity                 30
  Location similarity                    25
  Date proximity                         15
  **Total**                         **100**

The algorithm uses these signals to help surface potentially related
lost and found reports. A higher score indicates stronger similarity
according to the configured rules; it does **not** prove that two
reports refer to the same physical item. Ownership must still be
assessed through the claim-review process.

## User Roles

### Student

Students can create reports, browse and search listings, inspect
potential matches, submit claims, and review their own reports and
claims through the dashboard.

### Administrator

Administrators have additional permissions to review claims, moderate
listings, and update item status. Administrative access is restricted to
authorized accounts.

## Technology Stack

  Technology          Purpose
  ------------------- -------------------------------------------------
  React.js            Component-based user interface
  Vite                Development server and production build tooling
  JavaScript (ES6+)   Application logic and interactive behavior
  Tailwind CSS v4     Styling and responsive UI
  React Router        Client-side routing and route guards
  Supabase            Backend services and application data access
  PostgreSQL          Relational database
  Supabase Auth       User authentication and session management
  Supabase Storage    Item photograph storage
  Git and GitHub      Version control and source-code hosting
  Vercel              Production frontend hosting and deployment

## Application Architecture

At a high level, the application works as follows:

1.  The React frontend presents the reporting, browsing, dashboard, and
    administration interfaces.
2.  React Router manages page navigation and protected routes.
3.  Supabase Auth manages user authentication and sessions.
4.  PostgreSQL stores profiles, item reports, claims, and related
    records.
5.  Supabase Storage stores uploaded item photographs.
6.  The matching logic scores reports using category, description,
    location, and date.
7.  Role checks and database policies help restrict student and
    administrator operations.

## Getting Started

### Prerequisites

Install the following before running the project locally:

-   Node.js and npm
-   A Supabase project
-   Git

### 1. Clone the repository

Replace `<repository-url>` with the GitHub repository URL for this
project.

``` bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and add the required Supabase
values. See [Environment Variables](#environment-variables).

### 4. Start the development server

``` bash
npm run dev
```

Open the local URL printed in the terminal by Vite.

### 5. Create a production build

``` bash
npm run build
```

To preview the production build locally, run:

``` bash
npm run preview
```

## Environment Variables

The frontend expects these Vite environment variables:

``` env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
```

Use the URL and publishable/anon key from your own Supabase project
settings.

**Important:** Never put a Supabase service-role key or other privileged
secret in a frontend environment variable. Variables prefixed with
`VITE_` are bundled for client-side use and should be treated as public.
Access must be protected with appropriate Supabase Row Level Security
policies and storage policies.

Do not commit your real `.env` file. Keep it excluded through
`.gitignore`; provide a `.env.example` containing placeholders if you
want to document the required variable names.

## Supabase Setup

The project uses Supabase for authentication, database access, and image
storage.

1.  Create or select a Supabase project.
2.  Configure the frontend environment variables.
3.  Apply the SQL schema and migration files included in the repository,
    if present. The initial schema migration is located at
    `supabase/migrations/001_initial_schema.sql`.
4.  Ensure the database tables, constraints, functions, triggers, and
    Row Level Security policies required by the application are
    installed.
5.  Configure the `item-photos` Storage bucket and its access policies
    to match the application's upload and viewing behavior.
6.  Create user accounts through the application and configure
    administrator access using the project's intended, secure
    administrative process.

Database schema and policy details can change with future migrations.
Apply the migrations that are actually present in the checked-out
version of the repository, and do not assume that creating the Supabase
project alone completes setup.

## Build and Deployment

The application is deployed on Vercel and connected to GitHub.

To deploy your own copy:

1.  Push the project to a GitHub repository.
2.  Import the repository into Vercel.
3.  Select **Vite** as the framework preset if it is not detected
    automatically.
4.  Set the build command to `npm run build` and the output directory to
    `dist`.
5.  Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel
    environment variables for the required deployment environments.
6.  Deploy the application and test authentication, reporting, image
    uploads, matching, claims, and administrative access on the deployed
    URL.

The root `vercel.json` file configures single-page application routing
so direct navigation and refreshes on client-side routes can resolve to
the React application.

## Security Notes

-   Keep privileged backend keys out of the browser and out of source
    control.
-   Use Supabase Row Level Security policies to control which records
    authenticated users can read or modify.
-   Restrict administrative operations to authorized administrator
    accounts.
-   Validate submitted data and uploaded files appropriately.
-   Treat a matching score as a suggestion, not proof of ownership.
-   Avoid collecting or exposing more personal information than
    necessary for a claim.
-   Test authorization rules using both student and administrator
    accounts.

## Future Improvements

Possible extensions include:

-   Email or in-app notifications when a potential match or claim update
    is available.
-   More advanced matching using additional item attributes.
-   Campus-specific locations and pickup-point management.
-   A claim audit trail and more detailed status history.
-   Accessibility improvements and expanded automated testing.
-   Analytics on successful recoveries and common lost-item categories.

------------------------------------------------------------------------

## Project Status

FindIt has been built and deployed as a working web application. The
live deployment should be tested after any significant code, database,
or environment configuration changes.

**Live application:** https://find-it-campus-three.vercel.app
