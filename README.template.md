# Prologue Starter Template

A minimal, content-first blog starter powered by Next.js 16 + Contentlayer2.

This branch is designed for forking. It keeps the full blog engine (`src` and build config) while shipping only starter content in `data` and `public`.

## Quick Start

```bash
git clone -b starter https://github.com/hxlog/prologue.dev.git my-blog
cd my-blog
npm install
npm run dev
```

Open `http://localhost:3000`.

## 5 Things To Change First

1. `data/sitemetadata.js`
   - `title`, `author`, `description`, `siteUrl`
   - `github`, `siteRepo`, `repoid`, `categoryid` (for Giscus)
2. `data/headerNavLinks.js`
3. `data/content/pages/about.md`
4. `data/content/blog/hello-prologue.md`
5. `data/microblog.yaml` and `data/links.yaml`

## Common Commands

```bash
npm run dev
npm run build
npm run start
npm run build:content
```

## Branch Strategy

- `master`: full personal blog content
- `starter`: minimal template for forks

The maintainer syncs `starter` from `master` with:

```bash
npm run publish
```

## Keeping Your Fork Updated

If your repo is forked from this template:

```bash
git remote add upstream https://github.com/hxlog/prologue.dev.git
git fetch upstream
git checkout starter
git merge upstream/starter
```

If you already rewrote your own `data` content, prefer syncing engine files:

- Keep your local `data/**` and `public/static/**` content
- Take upstream updates from `src/**` and config files

## License

Please add a license file suitable for your own project before public release.
