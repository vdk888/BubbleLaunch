const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const { marked } = require("marked");
const Anthropic = require("@anthropic-ai/sdk");
const imageService = require("./imageService");

// Initialize Notion client
const blogApiKey = process.env.NOTION_BLOG_API_KEY;
const blogDatabaseId = process.env.NOTION_BLOG_DATABASE_ID;

// Check if blog configuration is available
const isBlogConfigured = blogApiKey && blogDatabaseId;

const notion = isBlogConfigured ? new Client({ auth: blogApiKey }) : null;

// Initialize NotionToMarkdown
const n2m = isBlogConfigured ? new NotionToMarkdown({ notionClient: notion }) : null;
// Initialize Anthropic client for article formatting enhancement
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;

/**
 * Returns sample posts when Notion is not configured
 */
function getSamplePosts() {
    return [];
}

/**
 * Extract page content from Notion blocks and convert to HTML
 * Preserves all formatting: headings, bold, lists, tables, etc.
 */
async function extractPageContentAsHtml(pageId) {
    try {
        const mdBlocks = await n2m.pageToMarkdown(pageId);
        const markdownString = n2m.toMarkdownString(mdBlocks);
        const htmlContent = marked(markdownString.parent || markdownString);
        return htmlContent;
    } catch (error) {
        console.error(`Error extracting page content from ${pageId}:`, error);
        return '';
    }
}

/**
 * Convert Notion rich_text property to HTML with preserved formatting
 * Extracts bold, italic, code, links, underline from annotations
 */
function richTextPropertyToHtml(richTextArray) {
    if (!richTextArray || !Array.isArray(richTextArray)) return '';

    return richTextArray.map(block => {
        let text = block.text?.content || block.plain_text || '';
        if (!text) return '';

        // Apply formatting based on annotations
        if (block.annotations?.code) {
            text = `<code>${text}</code>`;
        } else {
            // Only apply inline formatting if not code
            if (block.annotations?.bold) {
                text = `<strong>${text}</strong>`;
            }
            if (block.annotations?.italic) {
                text = `<em>${text}</em>`;
            }
            if (block.annotations?.underline) {
                text = `<u>${text}</u>`;
            }
            if (block.annotations?.strikethrough) {
                text = `<s>${text}</s>`;
            }
        }

        // Apply link if present
        if (block.text?.link?.url) {
            text = `<a href="${block.text.link.url}" target="_blank">${text}</a>`;
        }

        return text;
    }).join('');
}

/**
 * Format plain text content with enhanced HTML formatting
 */
function formatPlainTextContent(content) {
    if (!content) return '';
    
    // Pre-process the content to handle different line break patterns
    const processedContent = content
        .replace(/\r\n/g, '\n')  // Normalize Windows line breaks
        .replace(/\r/g, '\n')   // Normalize old Mac line breaks
        .trim();
    
    return processedContent
        // Split by double line breaks for paragraphs
        // But normalize multiple line breaks (3+) to just double (paragraph break)
        .replace(/\n\n\n+/g, '\n\n')  // Normalize excessive line breaks
        .split(/\n\n/)
        .flatMap(paragraph => {
            // If paragraph is too long and has mixed content, try to split it better
            if (paragraph.length > 1000 && (paragraph.includes('•') || paragraph.includes('#'))) {
                // Split on clear content boundaries
                return paragraph.split(/(?=\n[A-Z])/g).filter(p => p.trim());
            }
            return [paragraph];
        })
        .map(paragraph => {
            if (!paragraph.trim()) return '';
            
            // Trim whitespace
            paragraph = paragraph.trim();
            
            // Check if it's a heading (starts with #)
            if (paragraph.startsWith('#### ')) {
                const title = paragraph.substring(5).trim();
                return `<h4>${formatInlineContent(title)}</h4>`;
            } else if (paragraph.startsWith('### ')) {
                const title = paragraph.substring(4).trim();
                return `<h3>${formatInlineContent(title)}</h3>`;
            } else if (paragraph.startsWith('## ')) {
                const title = paragraph.substring(3).trim();
                return `<h2>${formatInlineContent(title)}</h2>`;
            } else if (paragraph.startsWith('# ')) {
                const title = paragraph.substring(2).trim();
                return `<h1>${formatInlineContent(title)}</h1>`;
            }
            
            // Check for list items - improved handling (supports both - and • bullets)
            // Only treat as list if it has proper structure (not just random bullets in text)
            const hasProperListStructure = (
                paragraph.includes('\n- ') || paragraph.startsWith('- ') || 
                paragraph.includes('\n• ') || paragraph.startsWith('• ') ||
                paragraph.includes('\n* ') || paragraph.startsWith('* ') ||
                (paragraph.includes(' • ') && paragraph.split(' • ').length <= 6) // Limit inline bullets
            );
            
            if (hasProperListStructure) {
                // First try splitting by line breaks, then by bullet characters if inline
                let lines = paragraph.split('\n').filter(line => line.trim());
                
                // If no line breaks but contains bullets, split by bullet chars
                if (lines.length === 1 && (paragraph.includes(' • ') || /\s•\s/.test(paragraph))) {
                    lines = paragraph.split(/\s*•\s*/).filter(item => item.trim());
                    // Add bullet prefix back
                    lines = lines.map((line, index) => index === 0 ? line : '• ' + line);
                }
                
                const listItems = [];
                let currentItem = '';
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ') || trimmedLine.startsWith('* ')) {
                        // Save previous item if exists
                        if (currentItem.trim()) {
                            listItems.push(`<li>${formatInlineContent(currentItem.trim())}</li>`);
                        }
                        // Start new item - handle different bullet types
                        if (trimmedLine.startsWith('- ')) {
                            currentItem = trimmedLine.substring(2).trim();
                        } else if (trimmedLine.startsWith('• ')) {
                            currentItem = trimmedLine.substring(2).trim();
                        } else if (trimmedLine.startsWith('* ')) {
                            currentItem = trimmedLine.substring(2).trim();
                        }
                    } else if (currentItem) {
                        // Continue current item on new line
                        currentItem += ' ' + trimmedLine;
                    } else if (trimmedLine) {
                        // Not part of a list but has content, could be first item without bullet
                        if (listItems.length === 0) {
                            currentItem = trimmedLine;
                        } else {
                            listItems.push(`<p>${formatInlineContent(trimmedLine)}</p>`);
                        }
                    }
                }
                
                // Add the last item
                if (currentItem.trim()) {
                    listItems.push(`<li>${formatInlineContent(currentItem.trim())}</li>`);
                }
                
                const hasListItems = listItems.some(item => item.includes('<li>'));
                if (hasListItems) {
                    return `<ul>\n${listItems.join('\n')}\n</ul>`;
                }
                return listItems.join('\n');
            }
            
            // Check for numbered lists - improved handling with better detection
            if (paragraph.includes('\n1. ') || paragraph.includes('\n2. ') || /^\d+\.\s/.test(paragraph)) {
                const lines = paragraph.split('\n').filter(line => line.trim());
                const listItems = [];
                let currentItem = '';
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (/^\d+\.\s/.test(trimmedLine)) {
                        // Save previous item if exists
                        if (currentItem.trim()) {
                            listItems.push(`<li>${formatInlineContent(currentItem.trim())}</li>`);
                        }
                        // Start new item - remove the number and dot
                        currentItem = trimmedLine.replace(/^\d+\.\s/, '').trim();
                    } else if (currentItem) {
                        // Continue current item on new line
                        currentItem += ' ' + trimmedLine;
                    } else {
                        // Not part of a list, treat as paragraph
                        listItems.push(`<p>${formatInlineContent(trimmedLine)}</p>`);
                    }
                }
                
                // Add the last item
                if (currentItem.trim()) {
                    listItems.push(`<li>${formatInlineContent(currentItem.trim())}</li>`);
                }
                
                const hasListItems = listItems.some(item => item.includes('<li>'));
                if (hasListItems) {
                    return `<ol>\n${listItems.join('\n')}\n</ol>`;
                }
                return listItems.join('\n');
            }
            
            // Regular paragraph - preserve intentional line breaks but merge single line breaks
            const processedParagraph = paragraph
                .replace(/\n\n+/g, '</p><p>')  // Double line breaks become new paragraphs
                .replace(/\n/g, ' ')           // Single line breaks become spaces
                .trim();
            
            if (processedParagraph.includes('</p><p>')) {
                // Multiple paragraphs
                const paragraphs = processedParagraph.split('</p><p>');
                return paragraphs
                    .map(p => `<p>${formatInlineContent(p)}</p>`)
                    .join('\n');
            } else {
                // Single paragraph
                return `<p>${formatInlineContent(processedParagraph)}</p>`;
            }
        })
        .filter(p => p)
        .join('\n\n');
    
    // Post-process to merge consecutive numbered lists
    return mergeConsecutiveNumberedLists(result);
}

/**
 * Merge consecutive numbered lists to maintain sequential numbering
 */
function mergeConsecutiveNumberedLists(content) {
    // Keep merging until no more consecutive lists are found
    let result = content;
    let hasChanges = true;
    
    while (hasChanges) {
        const before = result;
        // Pattern to find consecutive <ol> elements with optional whitespace/paragraphs between
        result = result.replace(/(<ol[^>]*>[\s\S]*?<\/ol>)(\s*(?:<p>\s*<\/p>\s*)*\s*)(<ol[^>]*>[\s\S]*?<\/ol>)/g, (match, firstList, spacing, secondList) => {
            // Extract the content between <ol> tags
            const firstContent = firstList.replace(/<\/?ol[^>]*>/g, '');
            const secondContent = secondList.replace(/<\/?ol[^>]*>/g, '');
            
            // Merge into a single list
            return `<ol>\n${firstContent}\n${secondContent}\n</ol>`;
        });
        hasChanges = (result !== before);
    }
    
    return result;
}

/**
 * Format inline content (bold, italic, links)
 */
function formatInlineContent(text) {
    return text
        // Format hashtag bold text (#text# or ##text##)
        .replace(/##([^#]+)##/g, '<strong>$1</strong>')
        .replace(/#([^#\s]+)#/g, '<strong>$1</strong>')
        // Format markdown bold text (between ** or __)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Format italic text (between * or _) - but not if it's inside bold
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
        // Format links [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Auto-detect bare URLs (http or https) and convert to clickable links
        // This regex matches URLs but avoids converting URLs already in markdown or HTML format
        .replace(/(?<![\[\("])(https?:\/\/[^\s<>'"]+)(?![\]\)"'])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
        // Format inline code `code`
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Clean up any remaining single hashtags that aren't part of headings
        .replace(/(?<!^|\s)#(\w+)/g, '$1');
}

/**
 * Fetches published blog posts from the Notion database.
 */
/**
 * Enhanced article formatting using Claude AI
 * Intelligently adds subheadings, bold emphasis, and italic for weak articles
 */
async function enhanceArticleFormatting(htmlContent, language = 'fr') {
    if (!anthropic) {
        console.log('Anthropic client not configured, skipping formatting enhancement');
        return htmlContent;
    }

    const strongCount = (htmlContent.match(/<strong>/g) || []).length;
    const h2Count = (htmlContent.match(/<h2>/g) || []).length;
    const h3Count = (htmlContent.match(/<h3>/g) || []).length;
    const totalFormatting = strongCount + h2Count + h3Count;
    const paragraphs = (htmlContent.match(/<p>/g) || []).length;

    // Skip if already well-formatted (at least 1 h2 or 20% strong tags)
    const hasMinimumFormatting = h2Count > 0 || strongCount >= Math.max(3, paragraphs * 0.2);
    if (hasMinimumFormatting) {
        console.log(`Article already well-formatted (${h2Count} h2, ${strongCount} strong), skipping`);
        return htmlContent;
    }

    console.log(`Enhancing article formatting (${language}): ${strongCount} strong, ${h2Count} h2 tags`);

    try {
        const systemPrompt = language === 'fr' ?
            `Tu es un expert en mise en forme de contenu journalistique en HTML. Tu dois améliorer un article HTML existant en:
1. Ajoutant des sous-titres <h2> ou <h3> aux sections principales (ne pas ajouter de H1)
2. Mettant en gras <strong> les concepts clés, les phrases importantes et les citations
3. En italique <em> pour l'emphase stylisée et les voix d'auteur
4. Préservant tous les liens existants <a> et le contenu original
5. Gardant la structure HTML intacte et valide

Réponds UNIQUEMENT avec le HTML amélioré, sans commentaires ni explications.` :
            `You are an expert in HTML content formatting. You must enhance an existing HTML article by:
1. Adding <h2> or <h3> subheadings to major sections (no H1)
2. Making <strong> key concepts, important phrases and quotes
3. Using <em> for stylized emphasis and author voice
4. Preserving all existing links <a> and original content
5. Keeping the HTML structure intact and valid

Reply ONLY with the enhanced HTML, no comments or explanations.`;

        const message = await anthropic.messages.create({
            model: 'claude-opus-4-1-20250805',
            max_tokens: 8000,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: `Enhance this HTML article with better formatting (bold key concepts, add subheadings, italics for emphasis):\n\n${htmlContent}`
                }
            ]
        });

        const enhancedContent = message.content[0]?.text || htmlContent;
        const newStrongCount = (enhancedContent.match(/<strong>/g) || []).length;
        const newH2Count = (enhancedContent.match(/<h2>/g) || []).length;
        console.log(`Enhancement complete: +${newStrongCount - strongCount} strong, +${newH2Count - h2Count} h2 tags`);

        return enhancedContent;
    } catch (error) {
        console.error(`Error enhancing article formatting: ${error.message}`);
        return htmlContent;
    }
}


/**
 * Fetches published blog posts from the Notion database.
 */
async function getPublishedPosts() {
    if (!isBlogConfigured) {
        console.log('Blog not configured - returning sample posts');
        return getSamplePosts();
    }

    try {
        const response = await notion.databases.query({
            database_id: blogDatabaseId,
            filter: {
                or: [
                    {
                        property: 'Status',
                        select: {
                            equals: 'Published',
                        },
                    },
                    {
                        and: [
                            {
                                property: 'Status',
                                select: {
                                    equals: 'Scheduled',
                                },
                            },
                            {
                                property: 'Publication Date',
                                date: {
                                    on_or_before: new Date().toISOString(),
                                },
                            },
                        ],
                    },
                ],
            },
            sorts: [
                {
                    property: 'Publication Date',
                    direction: 'descending',
                },
            ],
            // Note: Pinned sort is commented out until 'Pinned' property is added to Notion
            // sorts: [
            //     {
            //         property: 'Pinned',
            //         direction: 'descending',
            //     },
            //     {
            //         property: 'Publication Date',
            //         direction: 'descending',
            //     },
            // ],
        });

        const posts = await Promise.all(response.results.map(async page => {
            const properties = page.properties;
            
            // Extract bilingual titles using correct property names
            const titleFRProperty = properties['Title FR'];
            
            let titleFR = 'Untitled';
            // Title FR is a title property, not rich_text
            if (titleFRProperty?.title && Array.isArray(titleFRProperty.title)) {
                titleFR = titleFRProperty.title.map(block => block.plain_text || block.text?.content || '').join('');
            }
            if (!titleFR || titleFR === '') {
                titleFR = 'Untitled';
            }
            
            const titleENProperty = properties['Title EN'];
            let titleEN = '';
            if (titleENProperty?.rich_text && Array.isArray(titleENProperty.rich_text)) {
                titleEN = titleENProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
            }
            if (!titleEN) titleEN = titleFR;
            
            // Generate slug from French title (primary)
            const slug = titleFR.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            
            // Extract bilingual summaries using correct property names
            const summaryFRProperty = properties['Content Summary FR'];
            let summaryFR = '';
            if (summaryFRProperty?.rich_text && Array.isArray(summaryFRProperty.rich_text)) {
                summaryFR = summaryFRProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
            }
            
            const summaryENProperty = properties['Content Summary EN'];
            let summaryEN = '';
            if (summaryENProperty?.rich_text && Array.isArray(summaryENProperty.rich_text)) {
                summaryEN = summaryENProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
            }
            if (!summaryEN) summaryEN = summaryFR;
            
            // Extract published date from Publication Date
            const publishedDateProperty = properties['Publication Date'];
            const publishedDate = publishedDateProperty?.date?.start || null;
            
            // Extract status
            const statusProperty = properties.Status;
            const status = statusProperty?.select?.name || 'Draft';
            
            // Extract tags
            const tagsProperty = properties['Topic Tags'];
            const tags = tagsProperty?.multi_select?.map(tag => tag.name) || [];

            // Extract pinned status
            const pinnedProperty = properties['Pinned'];
            const isPinned = pinnedProperty?.checkbox || false;

            // Generate featured image using OpenAI image service or use fallback
            let featuredImage = null;
            try {
                // Check if image is already cached first (prioritize cache for consistency)
                featuredImage = imageService.getCachedImage(page.id);

                if (!featuredImage) {
                    // Check if image exists in Notion properties
                    const featuredImageProperty = properties['Featured Image'];
                    if (featuredImageProperty?.url) {
                        // Use existing image from Notion
                        featuredImage = featuredImageProperty.url;
                        console.log(`📸 Using featured image from Notion for "${titleFR}"`);
                    } else {
                        // Generate new image only if not cached and not in Notion
                        console.log(`🎨 No cached image found for "${titleFR}", generating new one...`);
                        featuredImage = await imageService.generateArticleImage(
                            titleFR, // Use French title as primary
                            summaryFR, // Use French summary as primary
                            tags,
                            page.id // Pass the unique Notion page ID
                        );
                    }
                } else {
                    console.log(`📷 Using cached image for "${titleFR}"`);
                }
                
                // If no image generated, use a unique fallback placeholder based on article ID
                if (!featuredImage) {
                    // Create unique fallback images based on article ID hash
                    const articleHash = Math.abs(page.id.replace(/-/g, '').split('').reduce((hash, char, index) => 
                        ((hash << 3) + hash) + char.charCodeAt(0) + index, 0));
                    
                    const isFinanceTheme = tags.some(tag => 
                        ['finance', 'investment', 'trading', 'market'].includes(tag.toLowerCase())
                    );
                    const isAITheme = tags.some(tag => 
                        ['ai', 'intelligence', 'technology', 'tech'].includes(tag.toLowerCase())
                    );
                    
                    // Different image sets for different themes
                    let imagePool = [];
                    const localFallbacks = {
                        newest: [
                            encodeURI('/assets/images/blog-fallbacks/ChatGPT Image Nov 8, 2025, 10_22_56 PM.png'),
                            encodeURI('/assets/images/blog-fallbacks/ChatGPT Image Nov 8, 2025, 10_26_37 PM.png'),
                        ],
                        hybrid: [
                            '/assets/images/blog-fallbacks/Gemini_Generated_Image_53mmaw53mmaw53mm.png',
                            '/assets/images/blog-fallbacks/Gemini_Generated_Image_lekvajlekvajlekv.png',
                            '/assets/images/blog-fallbacks/Gemini_Generated_Image_w0dl0hw0dl0hw0dl.png',
                            encodeURI('/assets/images/blog-fallbacks/ChatGPT Image Nov 8, 2025, 10_22_56 PM.png'),
                        ],
                        finance: [
                            '/assets/images/blog-fallbacks/Gemini_Generated_Image_53mmaw53mmaw53mm.png',
                            '/assets/images/blog-fallbacks/fallback-2.png',
                            '/assets/images/blog-fallbacks/fallback-1.png',
                            encodeURI('/assets/images/blog-fallbacks/ChatGPT Image Nov 8, 2025, 10_26_37 PM.png'),
                        ],
                        ai: [
                            '/assets/images/blog-fallbacks/Gemini_Generated_Image_lekvajlekvajlekv.png',
                            '/assets/images/blog-fallbacks/Gemini_Generated_Image_w0dl0hw0dl0hw0dl.png',
                            '/assets/images/blog-fallbacks/fallback-3.png',
                            encodeURI('/assets/images/blog-fallbacks/ChatGPT Image Nov 8, 2025, 10_22_56 PM.png'),
                            encodeURI('/assets/images/blog-fallbacks/ChatGPT Image Nov 8, 2025, 10_26_37 PM.png'),
                        ],
                        general: [
                            '/assets/images/blog-fallbacks/Gemini_Generated_Image_53mmaw53mmaw53mm.png',
                            '/assets/images/blog-fallbacks/Gemini_Generated_Image_lekvajlekvajlekv.png',
                            '/assets/images/blog-fallbacks/Gemini_Generated_Image_w0dl0hw0dl0hw0dl.png',
                            '/assets/images/blog-fallbacks/fallback-1.png',
                            '/assets/images/blog-fallbacks/fallback-2.png',
                            '/assets/images/blog-fallbacks/fallback-3.png',
                            '/assets/images/blog-fallbacks/fallback-4.png',
                            encodeURI('/assets/images/blog-fallbacks/ChatGPT Image Nov 8, 2025, 10_22_56 PM.png'),
                            encodeURI('/assets/images/blog-fallbacks/ChatGPT Image Nov 8, 2025, 10_26_37 PM.png'),
                        ],
                    };

                    if (isFinanceTheme && isAITheme) {
                        imagePool = localFallbacks.hybrid;
                    } else if (isFinanceTheme) {
                        imagePool = localFallbacks.finance;
                    } else if (isAITheme) {
                        imagePool = localFallbacks.ai;
                    } else {
                        imagePool = localFallbacks.general;
                    }
                    
                    // Select image based on article ID hash
                    featuredImage = imagePool[articleHash % imagePool.length];
                    console.log(`📷 Using unique fallback image for "${titleFR}" (hash: ${articleHash}): ${featuredImage}`);
                }
            } catch (error) {
                console.error(`Failed to generate image for article "${titleFR}":`, error);
                // Default fallback
                featuredImage = 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop';
            }

            return {
                id: page.id,
                title: {
                    fr: titleFR,
                    en: titleEN
                },
                slug,
                summary: {
                    fr: summaryFR,
                    en: summaryEN
                },
                publishedDate,
                featuredImage,
                status,
                tags,
                isPinned,
                url: `/blog/${slug}`
            };
        }));

        return posts;
    } catch (error) {
        console.error('Error fetching published posts:', error);
        throw new Error('Failed to fetch blog posts');
    }
}

/**
 * Fetches a single post by slug
 */
async function getPostBySlug(slug) {
    if (!isBlogConfigured) {
        return null;
    }

    try {
        // Since we don't have a Slug property, we need to get all published posts
        // and find the one whose generated slug matches the requested slug
        const response = await notion.databases.query({
            database_id: blogDatabaseId,
            filter: {
                or: [
                    {
                        property: 'Status',
                        select: {
                            equals: 'Published',
                        },
                    },
                    {
                        and: [
                            {
                                property: 'Status',
                                select: {
                                    equals: 'Scheduled',
                                },
                            },
                            {
                                property: 'Publication Date',
                                date: {
                                    on_or_before: new Date().toISOString(),
                                },
                            },
                        ],
                    },
                ],
            },
        });

        if (response.results.length === 0) {
            return null;
        }

        // Find the post whose generated slug matches the requested slug
        let matchingPage = null;
        for (const page of response.results) {
            const titleFRProperty = page.properties['Title FR'];
            let title = 'Untitled';
            // Title FR is a title property, not rich_text
            if (titleFRProperty?.title && Array.isArray(titleFRProperty.title)) {
                title = titleFRProperty.title.map(block => block.plain_text || block.text?.content || '').join('');
            }
            const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            
            if (generatedSlug === slug) {
                matchingPage = page;
                break;
            }
        }

        if (!matchingPage) {
            return null;
        }

        const properties = matchingPage.properties;
        
        // Extract bilingual titles using correct property names
        const titleFRProperty = properties['Title FR'];
        let titleFR = 'Untitled';
        // Title FR is a title property, not rich_text
        if (titleFRProperty?.title && Array.isArray(titleFRProperty.title)) {
            titleFR = titleFRProperty.title.map(block => block.plain_text || block.text?.content || '').join('');
        }
        if (!titleFR || titleFR === '') {
            titleFR = 'Untitled';
        }
        
        const titleENProperty = properties['Title EN'];
        let titleEN = '';
        if (titleENProperty?.rich_text && Array.isArray(titleENProperty.rich_text)) {
            titleEN = titleENProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
        }
        if (!titleEN) titleEN = titleFR;
        
        // Extract bilingual summaries using correct property names
        const summaryFRProperty = properties['Content Summary FR'];
        let summaryFR = '';
        if (summaryFRProperty?.rich_text && Array.isArray(summaryFRProperty.rich_text)) {
            summaryFR = summaryFRProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
        }
        
        const summaryENProperty = properties['Content Summary EN'];
        let summaryEN = '';
        if (summaryENProperty?.rich_text && Array.isArray(summaryENProperty.rich_text)) {
            summaryEN = summaryENProperty.rich_text.map(block => block.text?.content || block.plain_text || '').join('');
        }
        if (!summaryEN) summaryEN = summaryFR;
        
        // Extract published date from Publication Date
        const publishedDateProperty = properties['Publication Date'];
        const publishedDate = publishedDateProperty?.date?.start || null;
        
        // Extract status
        const statusProperty = properties.Status;
        const status = statusProperty?.select?.name || 'Draft';
        
        // Extract tags
        const tagsProperty = properties['Topic Tags'];
        const tags = tagsProperty?.multi_select?.map(tag => tag.name) || [];

        // Extract pinned status
        const pinnedProperty = properties['Pinned'];
        const isPinned = pinnedProperty?.checkbox || false;

        // Generate featured image using OpenAI image service or use fallback
        let featuredImage = null;
        try {
            featuredImage = await imageService.generateArticleImage(
                titleFR, // Use French title as primary
                summaryFR, // Use French summary as primary
                tags,
                matchingPage.id, // Pass the unique Notion page ID
                false // Don't bypass cache by default
            );
            
            // If no image generated, use a unique fallback placeholder based on article ID
            if (!featuredImage) {
                // Create unique fallback images based on article ID hash
                const articleHash = Math.abs(matchingPage.id.replace(/-/g, '').split('').reduce((hash, char, index) => 
                    ((hash << 3) + hash) + char.charCodeAt(0) + index, 0));
                
                const isFinanceTheme = tags.some(tag => 
                    ['finance', 'investment', 'trading', 'market'].includes(tag.toLowerCase())
                );
                const isAITheme = tags.some(tag => 
                    ['ai', 'intelligence', 'technology', 'tech'].includes(tag.toLowerCase())
                );
                
                // Different image sets for different themes
                let imagePool = [];
                if (isFinanceTheme && isAITheme) {
                    imagePool = [
                        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
                        'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=450&fit=crop',
                        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=450&fit=crop'
                    ];
                } else if (isFinanceTheme) {
                    imagePool = [
                        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop',
                        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop',
                        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop'
                    ];
                } else if (isAITheme) {
                    imagePool = [
                        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop',
                        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=450&fit=crop',
                        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=450&fit=crop'
                    ];
                } else {
                    imagePool = [
                        'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
                        'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&h=450&fit=crop'
                    ];
                }
                
                // Select image based on article ID hash
                featuredImage = imagePool[articleHash % imagePool.length];
                console.log(`📷 Using unique fallback image for "${titleFR}" (hash: ${articleHash}): ${featuredImage}`);
            }
        } catch (error) {
            console.error(`Failed to generate image for article "${titleFR}":`, error);
            // Default fallback
            featuredImage = 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop';
        }

        // Extract bilingual content
        // FR: Try page blocks first (preserves formatting), fallback to property
        let htmlContentFR = await extractPageContentAsHtml(matchingPage.id);

        // If page blocks are empty, fallback to Content FR property
        if (!htmlContentFR) {
            const contentFRProperty = properties['Content FR'];
            const contentFR = contentFRProperty?.rich_text?.map(block => block.text?.content || '').join('') || '';
            htmlContentFR = contentFR ? formatPlainTextContent(contentFR) : '';
        }

        // EN: Use property-based content with rich text formatting (fallback to FR if empty)
        const contentENProperty = properties['Content EN'];
        let htmlContentEN = '';

        if (contentENProperty?.rich_text) {
            // Extract formatted content from rich_text annotations (preserves bold, italic, etc.)
            const richTextContent = richTextPropertyToHtml(contentENProperty.rich_text);
            // Then apply paragraph and structure formatting
            htmlContentEN = richTextContent ? formatPlainTextContent(richTextContent) : '';
        }

        // Don't fallback EN to FR - keep languages separate!
        // Frontend already handles display of FR when EN is unavailable
        // htmlContentEN stays empty if no English content in Notion

        // Enhancement disabled for performance (enhancement already completed on articles)
        // Future: Move enhancement to background job queue if needed
        // if (anthropic && process.env.ENABLE_ENHANCEMENT === 'true') { ... }

        return {
            id: matchingPage.id,
            title: {
                fr: titleFR,
                en: titleEN
            },
            slug,
            summary: {
                fr: summaryFR,
                en: summaryEN
            },
            content: {
                fr: htmlContentFR,
                en: htmlContentEN
            },
            publishedDate,
            featuredImage,
            status,
            tags,
            isPinned,
            url: `/blog/${slug}`
        };
    } catch (error) {
        console.error('Error fetching post by slug:', error);
        throw new Error('Failed to fetch blog post');
    }
}

module.exports = {
    getPublishedPosts,
    getPostBySlug
};
