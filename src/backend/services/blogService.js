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
        const markdownContent = markdownString.parent || markdownString;
        const normalizedMarkdown = normalizeHeadingMarkers(markdownContent);
        const htmlContent = marked(normalizedMarkdown);
        return normalizeHeadingParagraphs(htmlContent);
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
 * Normalize heading markers by removing decorative prefixes so markdown parsers detect them
 */
function normalizeHeadingMarkers(text) {
    if (!text) return '';
    return text
        // Ensure headings break onto a new paragraph even if they were inline
        .replace(/([^\n])\s*(?:<br\s*\/?>\s*)*(?:[-–—•*]+\s*)?(#{1,6}\s+)/g, '$1\n\n$2')
        // Remove decorative prefixes like --- or •• before heading markers
        .replace(/^[\s]*[-–—•*]+\s*(#{1,6})\s*/gm, '$1 ')
        // Ensure a space after the hashes so markdown parsers detect the heading
        .replace(/^(#{1,6})([^\s#])/gm, '$1 $2');
}

/**
 * Check if a paragraph is a markdown table
 */
function isMarkdownTable(paragraph) {
    const lines = paragraph.split('\n').filter(line => line.trim());
    if (lines.length < 2) return false;

    // Check if lines contain pipes (table delimiter)
    const hasPipes = lines.every(line => line.includes('|'));
    if (!hasPipes) return false;

    // Check if second line is a separator line (e.g., |---|---|) 
    const secondLine = lines[1].trim();
    const isSeparatorLine = /^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?\s*$/.test(secondLine);

    return isSeparatorLine;
}

/**
 * Format a markdown table to HTML
 */
function formatMarkdownTable(tableText) {
    const lines = tableText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return tableText;

    const rows = [];
    let headerRow = null;
    let isFirstRow = true;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip separator line (second line with dashes)
        if (i === 1 && /^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?\s*$/.test(line)) {
            continue;
        }

        // Parse table row
        const cells = line
            .split('|')
            .map(cell => cell.trim())
            .filter((cell, index, arr) => {
                // Remove empty first/last cells from leading/trailing pipes
                if (index === 0 && cell === '') return false;
                if (index === arr.length - 1 && cell === '') return false;
                return true;
            });

        if (cells.length === 0) continue;

        if (isFirstRow) {
            // First row is header
            headerRow = cells.map(cell => `<th>${formatInlineContent(cell)}</th>`).join('');
            isFirstRow = false;
        } else {
            // Data rows
            const rowHtml = cells.map(cell => `<td>${formatInlineContent(cell)}</td>`).join('');
            rows.push(`<tr>${rowHtml}</tr>`);
        }
    }

    // Construct complete table
    let tableHtml = '<table class="blog-table">\n';
    if (headerRow) {
        tableHtml += `<thead>\n<tr>${headerRow}</tr>\n</thead>\n`;
    }
    if (rows.length > 0) {
        tableHtml += `<tbody>\n${rows.join('\n')}\n</tbody>\n`;
    }
    tableHtml += '</table>';

    return tableHtml;
}

/**
 * Format plain text content with enhanced HTML formatting
 */
function formatPlainTextContent(content) {
    if (!content) return '';

    // Pre-process the content to handle different line break patterns
    const processedContent = normalizeHeadingMarkers(content)
        .replace(/\r\n/g, '\n')  // Normalize Windows line breaks
        .replace(/\r/g, '\n')   // Normalize old Mac line breaks
        .trim();

    const htmlResult = processedContent
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

            // Check if it's a table (markdown table format with pipes)
            if (isMarkdownTable(paragraph)) {
                return formatMarkdownTable(paragraph);
            }

            // Normalize headings even if they are prefixed by decorative dashes/bullets
            const headingMatch = paragraph.match(/^[-–—\s]*(#{1,4})\s*(.+)$/);
            if (headingMatch) {
                const headingLevel = Math.min(headingMatch[1].length, 4);
                const title = headingMatch[2].trim();
                return `<h${headingLevel}>${formatInlineContent(title)}</h${headingLevel}>`;
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
    return normalizeHeadingParagraphs(mergeConsecutiveNumberedLists(htmlResult));
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
        .replace(/\<span class="notion-link-text">([^\]]+)<\/span\u003E\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Auto-detect bare URLs (http or https) and convert to clickable links
        // This regex matches URLs but avoids converting URLs already in markdown or HTML format
        .replace(/(?<![["(\])(https?:\/\/[^\s<>'"`]+)(?![\\\])"'])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
        // Format inline code `code`
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Clean up any remaining single hashtags that aren't part of headings
        .replace(/(?<!^|\s)#(\w+)/g, '$1');
}

/**
 * Convert paragraphs that still contain heading markers into actual heading tags
 */
function normalizeHeadingParagraphs(html) {
    if (!html) return '';
    return html.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, (match, inner) => {
        const textOnly = inner.replace(/<[^>]+>/g, '').trim();
        const headingMatch = textOnly.match(/^[-–—\s]*(#{1,6})\s*(.+)$/);
        if (headingMatch && headingMatch[1]) {
            const level = Math.min(headingMatch[1].length, 6);
            const title = headingMatch[2].trim();
            return `<h${level}>${formatInlineContent(title)}</h${level}>`;
        }

        // Handle paragraphs that contain a heading marker after some text
        const splitHeading = textOnly.match(/(.+?)\s+[-–—\s]*(#{1,6})\s+(.+)/);
        if (splitHeading && splitHeading[2]) {
            const before = splitHeading[1].trim();
            const level = Math.min(splitHeading[2].length, 6);
            const title = splitHeading[3].trim();
            const beforeHtml = before ? `<p>${formatInlineContent(before)}</p>` : '';
            const headingHtml = `<h${level}>${formatInlineContent(title)}</h${level}>`;
            return `${beforeHtml}${headingHtml}`;
        }

        return match;
    });
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
        });

        const posts = [];
        // Sequential processing to avoid rate limits with Runware
        for (const page of response.results) {
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
                featuredImage = await imageService.getCachedImage(page.id);

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
                    console.log(`⚠️ No image available for "${titleFR}" (Runware failed or returned null)`);
                }
            } catch (error) {
                console.error(`Failed to generate image for article "${titleFR}":`, error);
            }

            posts.push({
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
            });
        }

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
                console.log(`⚠️ No image available for "${titleFR}" (Runware failed or returned null)`);
            }
        } catch (error) {
            console.error(`Failed to generate image for article "${titleFR}":`, error);
        }

        // Extract bilingual content with complete fallback chains
        const contentFRProperty = properties['Content FR'];
        const contentENProperty = properties['Content EN'];
        let htmlContentFR = '';
        let htmlContentEN = '';

        // FRENCH CONTENT: Property → Page Blocks → English Property
        if (contentFRProperty?.rich_text) {
            const richTextContent = richTextPropertyToHtml(contentFRProperty.rich_text);
            htmlContentFR = richTextContent ? formatPlainTextContent(richTextContent) : '';
        }

        if (!htmlContentFR) {
            htmlContentFR = await extractPageContentAsHtml(matchingPage.id);
        }

        if (!htmlContentFR && contentENProperty?.rich_text) {
            const richTextContent = richTextPropertyToHtml(contentENProperty.rich_text);
            htmlContentFR = richTextContent ? formatPlainTextContent(richTextContent) : '';
        }

        // ENGLISH CONTENT: Property → Page Blocks → French Property
        if (contentENProperty?.rich_text) {
            const richTextContent = richTextPropertyToHtml(contentENProperty.rich_text);
            htmlContentEN = richTextContent ? formatPlainTextContent(richTextContent) : '';
        }

        if (!htmlContentEN) {
            htmlContentEN = await extractPageContentAsHtml(matchingPage.id);
        }

        if (!htmlContentEN && contentFRProperty?.rich_text) {
            const richTextContent = richTextPropertyToHtml(contentFRProperty.rich_text);
            htmlContentEN = richTextContent ? formatPlainTextContent(richTextContent) : '';
        }

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
