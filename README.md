# Prologue Blog

Next.js + Tailwindcss + Contentlayer + Markdown/MDX Blog

这是一个由 Next.js 生态拼凑而生的博客。

想直接搭自己的博客？请使用独立模板仓库（不含作者历史文章）：

**[hxlog/prologue-blog-template](https://github.com/hxlog/prologue-blog-template)**（GitHub Template）

## Features

- Content Focused, Contentlayer + MD/MDX
- Adaptive dark mode
- Full SEO, Opengraph + JSON-LD + RSS
- Lightweight search engine, powered by Fuse.js

- 专注于内容创作，支持 markdown/mdx
- 自适应黑暗模式
- 完整的 SEO 支持，支持 Opengraph、JSON-LD 和 RSS
- 轻量级的搜索引擎，Fuse.js 实现全文搜索和模糊搜索
- 支持 mermaid 渲染

![Index Screenshot](./public/static/images/Index-Screenshot.jpg)

![Post Screenshot](./public/static/images/Post-Screenshot.jpg)

## Get Started

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhxlog%2Fprologue-blog-template)

```bash
git clone https://github.com/hxlog/prologue-blog-template.git my-blog
cd my-blog
npm install
npm run dev
```

You can easily customize the template site: all configurations are in `/data`, static files are in `/public`.

你可以很容易自定义网站，所有配置文件都在 `/data` 目录，静态文件存放在 `/public`。

Maintainer sync (`prologue.dev` master → `prologue-blog-template`):

```bash
npm run publish
```

## Configuration

Post Frontmatter

```yaml
---
title: title
description: description
publishDate: 2022-11-13
(required)

lastmod: 2023-07-02
featured: true
tags: ["tag1","tag2"]
image: /static/photos/06.jpg
imageDesc: This is a static file
(optional)
---
```

Page Frontmatter

```yaml
title: title
description: description
(required)
```
