const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const { marked } = require("marked");
const Anthropic = require("@anthropic-ai/sdk");
const imageService = require("./imageService");
const fs = require("fs");
const path = require("path");

// Cache for OG images to avoid repeated fetches
const ogImageCache = new Map();

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

function extractUrlCandidate(rawUrl) {
    if (!rawUrl) return null;
    const trimmed = String(rawUrl).trim();
    if (!trimmed) return null;
    const markdownMatch = trimmed.match(/\((https?:\/\/[^)]+)\)/);
    const candidate = markdownMatch ? markdownMatch[1].trim() : trimmed;
    if (candidate.includes("[") || candidate.includes("]")) return null;
    return candidate;
}

function isGenericBlogPath(pathname) {
    return pathname === "" || pathname === "/" || pathname === "/blog" || pathname === "/en/blog";
}

/**
 * Check if a URL is external (not on bubbleinvest.org)
 */
function isExternalUrl(rawUrl) {
    const candidate = extractUrlCandidate(rawUrl);
    if (!candidate) return false;
    try {
        const url = new URL(candidate);
        // External if it has a different host than our site
        return !url.hostname.includes('bubbleinvest.org') &&
               !url.hostname.includes('localhost') &&
               url.protocol.startsWith('http');
    } catch (e) {
        return false;
    }
}

/**
 * Check if a URL is a Substack link
 */
function isSubstackUrl(url) {
    return url && (url.includes('substack.com') || url.includes('.substack.'));
}

function getUrlPath(rawUrl) {
    const candidate = extractUrlCandidate(rawUrl);
    if (!candidate) return null;
    try {
        const url = new URL(candidate, SITE_ORIGIN);
        const normalized = url.pathname.replace(/\/+$/, "");
        if (isGenericBlogPath(normalized || "/")) return null;
        return normalized;
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
    // If it's an external URL, return it as-is
    if (isExternalUrl(rawUrl)) {
        return extractUrlCandidate(rawUrl);
    }

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
    // If it's an external URL, return it as-is (same URL for both languages)
    if (frUrl && (frUrl.startsWith('http://') || frUrl.startsWith('https://'))) {
        return frUrl;
    }

    if (!hasEnglish) return frUrl;
    const base = frUrl || `/blog/${slug}`;
    return base.startsWith("/en/") ? base : `/en${base}`;
}

/**
 * Fetch Open Graph image from an external URL (like Substack)
 * @param {string} url - The external URL to fetch OG image from
 * @returns {Promise<string|null>} - The OG image URL or null
 */
async function fetchOgImage(url) {
    if (!url) return null;

    // Check cache first
    if (ogImageCache.has(url)) {
        const cached = ogImageCache.get(url);
        console.log(`[BlogService] Using cached OG image for ${url}: ${cached ? 'found' : 'none'}`);
        return cached;
    }

    try {
        console.log(`[BlogService] Fetching OG image from: ${url}`);

        // Use a browser-like User-Agent to avoid being blocked
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'identity', // Avoid compression issues
                'Connection': 'keep-alive',
            },
            redirect: 'follow',
        });

        if (!response.ok) {
            console.warn(`[BlogService] Failed to fetch ${url}: ${response.status}`);
            return null;
        }

        const html = await response.text();
        console.log(`[BlogService] Fetched ${html.length} bytes from ${url}`);

        // Multiple regex patterns to catch different meta tag formats
        const ogPatterns = [
            // Standard format: property="og:image" content="..."
            /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
            // Reversed format: content="..." property="og:image"
            /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
            // With data attributes (Substack uses data-rh="true")
            /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
        ];

        let imageUrl = null;

        for (const pattern of ogPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                imageUrl = match[1];
                console.log(`[BlogService] Found OG image with pattern ${pattern}: ${imageUrl.substring(0, 100)}...`);
                break;
            }
        }

        // Fallback: look for twitter:image
        if (!imageUrl) {
            const twitterPatterns = [
                /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
                /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
            ];

            for (const pattern of twitterPatterns) {
                const match = html.match(pattern);
                if (match && match[1]) {
                    imageUrl = match[1];
                    console.log(`[BlogService] Found Twitter image: ${imageUrl.substring(0, 100)}...`);
                    break;
                }
            }
        }

        if (imageUrl) {
            // Decode HTML entities if present
            imageUrl = imageUrl.replace(/&amp;/g, '&');
            ogImageCache.set(url, imageUrl);
            return imageUrl;
        }

        console.log(`[BlogService] No OG image found for: ${url}`);
        console.log(`[BlogService] HTML head preview: ${html.substring(0, 2000)}`);
        ogImageCache.set(url, null);
        return null;
    } catch (e) {
        console.error(`[BlogService] Error fetching OG image from ${url}:`, e.message);
        return null;
    }
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
                filter: { property: "Status", status: { equals: "Published" } },
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
                console.log(`[BlogService] Post "${titleFr}" - Website URL: ${websiteUrl || 'none'}`);
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

                // For Substack posts, fetch OG image instead of generating
                let img = await imageService.getCachedImage(page.id);
                const isSubstack = isSubstackUrl(websiteUrl);
                console.log(`[BlogService] Post "${titleFr}" - isSubstack: ${isSubstack}, hasCachedImage: ${!!img}`);

                if (!img) {
                    if (isSubstack) {
                        // Try to fetch OG image from Substack URL
                        const substackUrl = extractUrlCandidate(websiteUrl);
                        console.log(`[BlogService] Attempting to fetch OG image for Substack URL: ${substackUrl}`);
                        img = await fetchOgImage(substackUrl);
                        if (img) {
                            // Cache the OG image URL
                            console.log(`[BlogService] Successfully fetched OG image, caching...`);
                            imageService.setCachedImage(page.id, img);
                        } else {
                            console.log(`[BlogService] No OG image found for Substack URL`);
                        }
                    }
                    // Fall back to generating an image if no OG image found
                    if (!img) {
                        console.log(`[BlogService] Generating image for post "${titleFr}"`);
                        img = await imageService.generateArticleImage(titleFr, summaryFr, tags, page.id);
                    }
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

            // Step 1: Try page body FIRST for FR content
            let frContent = await extractPageContentAsHtml(post.id);
            console.log(`[BlogService] FR content from page body: ${frContent ? frContent.length : 0} chars`);

            // Step 2: If page body empty, fallback to Content FR property
            if (!frContent) {
                console.log(`[BlogService] Page body empty, checking Content FR property...`);
                const propertyContent = extractContentFromProperties(page.properties);
                frContent = propertyContent.fr;
                console.log(`[BlogService] FR content from property: ${frContent ? frContent.length : 0} chars`);
            }

            // Step 3: For EN, try Content EN property first, then fallback to FR content
            const propertyContent = extractContentFromProperties(page.properties);
            const enContent = propertyContent.en || frContent;
            console.log(`[BlogService] EN content: ${enContent ? enContent.length : 0} chars (from ${propertyContent.en ? 'property' : 'FR fallback'})`);

            post.content = { fr: frContent, en: enContent };
            console.log(`[BlogService] Final content set - FR: ${post.content.fr ? post.content.fr.length : 0} chars, EN: ${post.content.en ? post.content.en.length : 0} chars`);
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
