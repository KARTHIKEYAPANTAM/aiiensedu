# Project Structure

This project is a Vite + React wrapper around a legacy HTML application. The structure keeps runtime source, database assets, operational scripts, and project documentation separate.

## Root

- `index.html` is the Vite entry document.
- `package.json` and `package-lock.json` define dependencies and local commands.
- `vite.config.js` contains Vite configuration.
- `.env.example` documents required environment variables. `.env.local` is intentionally ignored.

## Source

- `src/App.jsx` bootstraps Supabase, auth, legacy scripts, and the legacy shell.
- `src/main.jsx` mounts React.
- `src/components` contains React shell components and shared HTML fragments.
- `src/pages` contains page-level legacy HTML screens.
- `src/services` contains application services grouped by domain.
- `src/legacy` contains extracted legacy scripts, patch installers, and generated markup.
- `src/styles` contains global CSS, layout helpers, and design tokens.

## Data And Operations

- `supabase/schema.sql` is the schema snapshot.
- `supabase/migrations` contains timestamped database migrations.
- `supabase/fix_rls.sql` contains RLS repair SQL.
- `scripts` contains local checks, extraction tools, and database diagnostics.

## Documentation

- `docs` contains implementation notes and test reports.
- `docs/audits` contains historical audits and fix summaries.
