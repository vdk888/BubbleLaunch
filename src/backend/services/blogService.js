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
                const title = p["Title FR"]?.title[0]?.plain_text || "Untitled";
                const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                let img = await imageService.getCachedImage(page.id);
                if (!img) img = await imageService.generateArticleImage(title, "", [], page.id);
                posts.push({
                    id: page.id,
                    title: { fr: title, en: p["Title EN"]?.rich_text[0]?.plain_text || title },
                    slug,
                    summary: { fr: p["Content Summary FR"]?.rich_text[0]?.plain_text || "", en: p["Content Summary EN"]?.rich_text[0]?.plain_text || "" },
                    publishedDate: p["Publication Date"]?.date?.start || null,
                    featuredImage: img,
                    url: "/blog/" + slug
                });
            }
            saveCache(posts);
            return posts;
        } catch (e) { console.error(e); }
    }
    return loadCache() || [];
}

async function getPostBySlug(slug) {
    const posts = await getPublishedPosts();
    const post = posts.find(p => p.slug === slug);
    if (!post) return null;
    try {
        post.content = { fr: await extractPageContentAsHtml(post.id), en: "" };
    } catch (e) {}
    return post;
}

module.exports = { getPublishedPosts, getPostBySlug };
