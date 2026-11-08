# stevenchambers.dev

Steven Chambers’s static development blog, built with Astro and Markdown. No runtime server, database, external fonts, or client-side JavaScript is needed for the published site.

## Local development

Use Node.js 24 LTS (the package requires Node >=22.23.4).

```sh
npm ci
npm run dev
```

Open the URL printed by Astro, normally `http://localhost:4321`. Development includes drafts, marked **Local draft**. Astro’s development toolbar is not part of the production site.

```sh
npm run build
npm run preview
```

The build checks types and generates `dist/`. Use the npm scripts: they explicitly set the development/production environment so an inherited `NODE_ENV=development` cannot include drafts in a production build.

Astro may keep its preview/development server running in the background. Use `npx astro dev stop` or `npx astro preview stop` to stop it.

## Write a post

Run the interactive command from the project root, or select `new-post` in observer.nvim’s npm scripts:

```sh
npm run new-post
```

It asks for a title, description, URL slug (suggested from the title), and publication date (defaults to today in local time). It creates `src/content/blog/<slug>.md` with `draft: true` and an empty body, then prints the absolute path to open in Neovim. Existing files are never overwritten. Slugs use lowercase ASCII letters/numbers separated by hyphens; supply a slug yourself if the title cannot produce one.

Use an interactive terminal for prompts. For a task runner without terminal input, supply the metadata as flags:

```sh
npm run --silent new-post -- --no-interactive \
  --title "A useful title" \
  --description "A short summary for the index, feed, and search results."
```

Optional `--slug a-useful-title` and `--date 2026-11-07` override the defaults. `--help` lists the options. With npm’s `--silent` flag, stdout contains only the created path; prompts and errors go to stderr. From another directory, use `npm --prefix /path/to/stevenchambers.dev run new-post`.

The resulting frontmatter follows this format (manual file creation also works):

```yaml
---
title: A useful title
description: A short summary for the index, feed, and search results.
pubDate: 2026-11-06
draft: true
---
```

Write Markdown after the frontmatter. A file named `a-useful-title.md` produces `/blog/a-useful-title/`. Second-level headings generate the article’s contents list; fenced code blocks support syntax highlighting. Put static images in `public/images/` and reference them as `/images/filename.webp` with descriptive alt text.

Set `draft: false` to publish on the next build. Omitted `draft` defaults to `true`. Drafts are excluded from production article routes, indexes, and sitemap, and from RSS even in development. Dates sort and label posts; future dates do not schedule publication. Optional `updatedDate` displays a revision date.

Drafts and their Git history are public source files in this repository, even though drafts are excluded from the website. Keep private material outside the repository. Files in `public/` are always deployed, including assets for unfinished posts. Do not expose the development server publicly.

## Site configuration

- `astro.config.mjs`: canonical domain, static output, sitemap, syntax theme.
- `src/site.ts`: site title and description.
- `src/styles/global.css`: compact single-column layouts and system fonts; `:root` defines the default dark theme with saturated blue (`#5d8fff`) links and purple (`#a875ff`) accents, independent of system color preference.
- `src/pages/index.astro`: homepage introduction.
- `src/layouts/SiteLayout.astro`: navigation, metadata, footer.
- `/rss.xml`: published post summaries and links.
- `/sitemap-index.xml`: generated sitemap index.

If changing the domain, update both `astro.config.mjs` and `public/robots.txt`.

## GitHub Pages

The public repository is [symbyte/stevenchambers.dev](https://github.com/symbyte/stevenchambers.dev). The canonical site URL is `https://stevenchambers.dev`.

`.github/workflows/deploy.yml` deploys pushes to `main` and supports manual runs from the Actions tab. It uses Node.js 24, runs `npm ci`, `npm test`, and `npm run build`, and uploads only `dist/` to GitHub Pages. Failed tests or builds prevent deployment. Generated files and dependencies are not committed.

To publish a post, set `draft: false`, commit, and push to `main`. Check the **Deploy to GitHub Pages** workflow for the deployment result.

### Domain configuration

In the repository's **Settings → Pages**, use **GitHub Actions** as the source and `stevenchambers.dev` as the custom domain. The custom domain is configured in Pages settings, not a `CNAME` file; GitHub ignores that file for custom Actions deployments. Keep Astro's `base` unset because the custom domain serves the site at `/`.

DNS is managed at Porkbun and configured with the following records, each with a 600-second TTL (leave the host blank for the apex in Porkbun):

| Type | Host | Value |
| --- | --- | --- |
| A | apex | `185.199.108.153` |
| A | apex | `185.199.109.153` |
| A | apex | `185.199.110.153` |
| A | apex | `185.199.111.153` |
| CNAME | `www` | `symbyte.github.io` |

Preserve the existing Proton Mail MX, SPF, DKIM, and DMARC records. No nameserver change is needed. Do not add wildcard records. Configure the custom domain in GitHub before pointing DNS at Pages.

GitHub has issued a certificate for both `stevenchambers.dev` and `www.stevenchambers.dev`, and **Enforce HTTPS** is enabled. HTTP redirects to HTTPS, and `www` redirects to the apex domain. `.dev` domains require HTTPS in browsers. After DNS changes, some resolvers may temporarily retain an earlier empty answer even when authoritative DNS is correct. Verify the homepage, `/blog/`, `/rss.xml`, `/sitemap-index.xml`, and a missing page after deployment.

For takeover protection, also [verify domain ownership](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages) under your GitHub account's **Settings → Pages** and retain its TXT record. If you later disable Pages, remove the DNS records pointing to GitHub.
