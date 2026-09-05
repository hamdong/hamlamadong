# Hamlamadong

My personal corner of the internet for writing, artwork, games, and books.

Built with Astro, Tailwind, Markdown content collections, Sveltia CMS, and Cloudflare R2.

## Project map

```text
public/          Static files and CMS configuration
src/components/  Reusable UI
src/content/     Blog, art, games, and reading entries
src/layouts/     Shared page layouts
src/lib/         Content and formatting helpers
src/pages/       Site routes
```

## Commands

```bash
npm install
npm run dev      # Start the local site
npm run check    # Check Astro and TypeScript diagnostics
npm run build    # Build the static site
npm run preview  # Preview the build
```

Content schemas live in `src/content/config.ts`, and the Sveltia setup is in `public/admin/config.yml`. Tags are still available in the CMS, although they are not currently shown on the site.
