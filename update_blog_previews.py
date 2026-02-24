import re
from bs4 import BeautifulSoup

def replace_blog_section(filename, lang):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    
    blog_grid = soup.find('div', id='blog-preview-grid')
    if not blog_grid:
        print(f"No blog grid found in {filename}")
        return

    # Create new blog-grid
    new_grid = soup.new_tag('div', attrs={'class': 'blog-grid', 'style': 'margin-top: 2rem;'})
    
    articles_fr = [
        {"tag": "Performance", "title": "Comment on a réduit la latence de notre agent de 40%", "icon": '<svg fill="none" height="32" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="32"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline></svg>'},
        {"tag": "Apprentissages", "title": "Ce qui n'a pas marché : nos ratés sur les prompts de raisonnement", "icon": '<svg fill="none" height="32" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="32"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'},
        {"tag": "Stack Technique", "title": "Pourquoi on a migré de OpenAI vers Anthropic (et les leçons apprises)", "icon": '<svg fill="none" height="32" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="32"><rect height="10" rx="2" width="18" x="3" y="11"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>'}
    ]
    
    articles_en = [
        {"tag": "Performance", "title": "How we reduced our agent's latency by 40%", "icon": '<svg fill="none" height="32" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="32"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline></svg>'},
        {"tag": "Learnings", "title": "What didn't work: our failures with reasoning prompts", "icon": '<svg fill="none" height="32" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="32"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'},
        {"tag": "Technical Stack", "title": "Why we migrated from OpenAI to Anthropic (and the lessons learned)", "icon": '<svg fill="none" height="32" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="32"><rect height="10" rx="2" width="18" x="3" y="11"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>'}
    ]
    
    articles = articles_fr if lang == 'fr' else articles_en
    
    for article in articles:
        new_grid.append(BeautifulSoup(f'''
        <div class="blog-card" onclick="location.href='/blog-mock'">
            <div class="blog-image">
                {article['icon']}
            </div>
            <div class="blog-content">
                <div class="blog-tag">{article['tag']}</div>
                <h4>{article['title']}</h4>
                <p></p>
            </div>
        </div>
        ''', 'html.parser'))
    
    blog_grid.replace_with(new_grid)
    
    # Also remove <script src="/js/blog-preview.js"></script> as it's no longer needed
    script_tag = soup.find('script', src="/js/blog-preview.js")
    if script_tag:
        script_tag.decompose()
        
    # Also we want to ensure the "this week" text in particuliers-mock.html is translated
    # Let's fix it globally if it exists by replacing string representation before save
    final_html = str(soup)
    final_html = final_html.replace('Loading articles...', 'Chargement des articles...')
    final_html = final_html.replace('this week', 'cette semaine')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(final_html)

replace_blog_section('particuliers-mock.html', 'fr')
replace_blog_section('individuals-mock-en.html', 'en')
