const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const { marked } = require("marked");
const Anthropic = require("@anthropic-ai/sdk");
const imageService = require("./imageService");
const fs = require("fs");
const path = require("path");

const blogApiKey = process.env.NOTION_BLOG_API_KEY;
const blogDatabaseId = process.env.NOTION_BLOG_DATABASE_ID;
const isBlogConfigured = blogApiKey && blogDatabaseId;
const notion = isBlogConfigured ? new Client({ auth: blogApiKey }) : null;
const n2m = isBlogConfigured ? new NotionToMarkdown({ notionClient: notion }) : null;

const CACHE_FILE = path.join(__dirname, "../cache/blog-posts-cache.json");
const SITE_ORIGIN = "https://bubbleinvest.org";

function getRichTextArray(property) {
    if (!property) return [];
    if (Array.isArray(property.title)) return property.title;
    if (Array.isArray(property.rich_text)) return property.rich_text;
    return [];
}

function getPlainText(property) {
    const richText = getRichTextArray(property);
    return richText.map((item) => item?.plain_text || "").join("");
}

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function getUrlPath(rawUrl) {
    if (!rawUrl) return null;
    try {
        const url = new URL(rawUrl, SITE_ORIGIN);
        return url.pathname;
    } catch (e) {
        return null;
    }
}

function buildFrUrl(rawUrl, slug) {
    const path = getUrlPath(rawUrl);
    if (path) {
        return path.startsWith("/en/") ? path.replace(/^\/en/, "") : path;
    }
    return `/blog/${slug}`;
}

function buildEnUrl(frUrl, slug, hasEnglish) {
    if (!hasEnglish) return frUrl;
    const base = frUrl || `/blog/${slug}`;
    return base.startsWith("/en/") ? base : `/en${base}`;
}

function extractContentFromProperties(properties) {
    const frMarkdown = getPlainText(properties?.["Content FR"]);
    const enMarkdown = getPlainText(properties?.["Content EN"]);
    return {
        fr: frMarkdown ? marked(frMarkdown) : "",
        en: enMarkdown ? marked(enMarkdown) : ""
    };
}

function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, "utf8");
            return JSON.parse(data);
        }
    } catch (e) {}
    return null;
}

function saveCache(posts) {
    try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(posts, null, 2), "utf8");
    } catch (e) {}
}

async function extractPageContentAsHtml(pageId) {
    try {
        const mdBlocks = await n2m.pageToMarkdown(pageId);
        const md = n2m.toMarkdownString(mdBlocks);
        return marked(md.parent || md);
    } catch (e) { return ""; }
}

async function getPublishedPosts() {
    if (isBlogConfigured) {
        try {
            const response = await notion.databases.query({ 
                database_id: blogDatabaseId, 
                filter: { property: "Status", select: { equals: "Published" } },
                sorts: [{ property: "Publication Date", direction: "descending" }]
            });
            const posts = [];
            for (const page of response.results) {
                const p = page.properties;
                const titleFr = getPlainText(p["Title FR"]) || "Untitled";
                const titleEnRaw = getPlainText(p["Title EN"]);
                const summaryFr = getPlainText(p["Content Summary FR"]);
                const summaryEnRaw = getPlainText(p["Content Summary EN"]);
                const contentEnRaw = getPlainText(p["Content EN"]);
                const status = p["Status"]?.select?.name || null;
                const isPinned = Boolean(p["Pinned"]?.checkbox);
                const tags = (p["Topic Tags"]?.multi_select || [])
                    .map((tag) => tag?.name)
                    .filter(Boolean);
                const websiteUrl = p["Website URL"]?.url || getPlainText(p["Website URL"]);
                const slug = getUrlPath(websiteUrl)
                    ? getUrlPath(websiteUrl).split("/").filter(Boolean).pop()
                    : slugify(titleFr);
                const hasEnglish = Boolean(
                    (titleEnRaw && titleEnRaw.trim()) ||
                    (summaryEnRaw && summaryEnRaw.trim()) ||
                    (contentEnRaw && contentEnRaw.trim())
                );
                const url = buildFrUrl(websiteUrl, slug);
                const urlEn = buildEnUrl(url, slug, hasEnglish);
                let img = await imageService.getCachedImage(page.id);
                if (!img) {
                    img = await imageService.generateArticleImage(titleFr, summaryFr, tags, page.id);
                }
                posts.push({
                    id: page.id,
                    title: { fr: titleFr, en: titleEnRaw || titleFr },
                    slug,
                    summary: { fr: summaryFr || "", en: summaryEnRaw || "" },
                    publishedDate: p["Publication Date"]?.date?.start || null,
                    featuredImage: img,
                    url,
                    urlEn,
                    status,
                    isPinned,
                    tags
                });
            }
            posts._source = "notion";
            saveCache(posts);
            return posts;
        } catch (e) { console.error(e); }
    }
    const cachedPosts = loadCache() || [];
    cachedPosts._source = "cache";
    return cachedPosts;
}

async function getPostBySlug(slug) {
    const posts = await getPublishedPosts();
    const post = posts.find(p => p.slug === slug);
    if (!post) return null;
    try {
        if (isBlogConfigured) {
            const page = await notion.pages.retrieve({ page_id: post.id });
            const content = extractContentFromProperties(page.properties);
            const frContent = content.fr || await extractPageContentAsHtml(post.id);
            const enContent = content.en || frContent;
            post.content = { fr: frContent, en: enContent };
        } else if (!post.content) {
            post.content = { fr: "", en: "" };
        }
    } catch (e) {}
    return post;
}

module.exports = { getPublishedPosts, getPostBySlug };
