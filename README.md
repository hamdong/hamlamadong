# Hamlamadong

My personal website made for blogging and expressing myself.

## Tech Stack

- **Framework**: Astro 4.x
- **CMS**: Sveltia
- **Styling**: Tailwind CSS v4=

## 🚀 Project Structure

```text
/
├── public/
│   ├── admin/          # CMS configuration
│   └── assets/         # Static assets
├── src/
│   ├── components/     # Reusable Astro components
│   ├── content/        # Markdown blog posts
│   ├── layouts/        # Layout templates
│   ├── pages/          # Route pages
│   └── styles/         # Global styles
├── astro.config.mjs    # Astro configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies
```

## 🧞 Commands

All commands are run from the root of the project:

| Command           | Action                                     |
| :---------------- | :----------------------------------------- |
| `npm install`     | Install dependencies                       |
| `npm run dev`     | Start local dev server at `localhost:4321` |
| `npm run build`   | Build production site to `./dist/`         |
| `npm run preview` | Preview build locally before deploying     |

### Blog Posts

Add new markdown files to `src/content/blog/` with the naming convention `YYYY-MM-DD-title.md`. Update `src/content/config.ts` to modify the content collection schema.

## 📝 License

Built with Astro. See [astro.build](https://astro.build) for more information.
