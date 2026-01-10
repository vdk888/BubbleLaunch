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
        // Handle markdown-style links like [https://...](https://...)
        const markdownMatch = rawUrl.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (markdownMatch) {
            rawUrl = markdownMatch[2]; // Use the URL from parentheses
        }
        const url = new URL(rawUrl, SITE_ORIGIN);
        return url.pathname;
    } catch (e) {
        return null;
    }
}

function extractWebsiteUrl(property) {
    // Try URL type first
    if (property?.url) {
        return property.url;
    }
    // Try rich_text - may contain markdown links or plain URLs
    const plainText = getPlainText(property);
    if (!plainText) return null;

    // Check for markdown link format: [text](url)
    const markdownMatch = plainText.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (markdownMatch) {
        return markdownMatch[2];
    }

    // Check if it's a plain URL
    if (plainText.startsWith('http://') || plainText.startsWith('https://') || plainText.startsWith('/')) {
        return plainText;
    }

    return null;
}

function buildFrUrl(rawUrl, slug) {
    const path = getUrlPath(rawUrl);
    if (path) {
        // Only use URL path if it's a full article path (not just /blog or /en/blog)
        const cleanPath = path.startsWith("/en/") ? path.replace(/^\/en/, "") : path;
        const parts = cleanPath.split("/").filter(Boolean);
        if (parts.length > 1 && parts[0] === 'blog') {
            return cleanPath;
        }
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
    if (!n2m) {
        console.error(`[BlogService] NotionToMarkdown not initialized - cannot extract page content`);
        return "";
    }
    try {
        const mdBlocks = await n2m.pageToMarkdown(pageId);
        const md = n2m.toMarkdownString(mdBlocks);
        const content = md.parent || md;
        return marked(typeof content === 'string' ? content : '');
    } catch (e) {
        console.error(`[BlogService] Error extracting page content for ${pageId}:`, e.message);
        return "";
    }
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
                const websiteUrl = extractWebsiteUrl(p["Website URL"]);
                const urlPath = getUrlPath(websiteUrl);
                // Only use URL path if it's a full article path (e.g., /blog/article-slug)
                // Fall back to slugifying title if URL is just /blog or empty
                const pathParts = urlPath ? urlPath.split("/").filter(Boolean) : [];
                const slug = (pathParts.length > 1 && pathParts[0] === 'blog')
                    ? pathParts[pathParts.length - 1]
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
            console.log(`[BlogService] Fetching full content for post: ${slug} (id: ${post.id})`);
            const page = await notion.pages.retrieve({ page_id: post.id });
            const content = extractContentFromProperties(page.properties);
            console.log(`[BlogService] Content from properties - FR: ${content.fr ? content.fr.length : 0} chars, EN: ${content.en ? content.en.length : 0} chars`);

            let frContent = content.fr;
            if (!frContent) {
                console.log(`[BlogService] No FR content in properties, extracting from page blocks...`);
                frContent = await extractPageContentAsHtml(post.id);
                console.log(`[BlogService] Extracted FR content: ${frContent ? frContent.length : 0} chars`);
            }

            const enContent = content.en || frContent;
            post.content = { fr: frContent, en: enContent };
            console.log(`[BlogService] Final content set - FR: ${post.content.fr.length} chars, EN: ${post.content.en.length} chars`);
        } else if (!post.content) {
            post.content = { fr: "", en: "" };
        }
    } catch (e) {
        console.error(`[BlogService] Error fetching content for post ${slug}:`, e.message);
        console.error(e.stack);
        // Ensure content is at least an empty object
        if (!post.content) {
            post.content = { fr: "", en: "" };
        }
    }
    return post;
}

module.exports = { getPublishedPosts, getPostBySlug };
