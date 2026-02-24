import re
from bs4 import BeautifulSoup

def update_professionals():
    with open('professionals-mock-en.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    
    # Hero subtitle
    hero = soup.find('section', class_='hero')
    if hero:
        p = hero.find('p', class_='hero-subtitle')
        if p: p.string = "The solutions we deploy were released just weeks ago. We're among the first in France to master them — our unique edge to keep you ahead."
        
        # Title
        h1 = hero.find('h1')
        if h1:
            h1.clear()
            span = soup.new_tag('span', class_='highlight')
            span.string = "Implement AI"
            h1.append(span)
            h1.append(" in your business")
            
        badge = hero.find('div', class_='hero-badge')
        if badge: badge.string = "🚀 Systematic Early Adopters"

    # Services
    services = soup.find('section', class_='services')
    if services:
        cards = services.find_all('div', class_='service-card')
        if len(cards) >= 1:
            pass # Keep as is, it's mostly correct or adjust if needed
            
    # How We Work
    how = soup.find('section', class_='how-we-work')
    if how:
        h2 = how.find('h2')
        if h2: h2.string = "Our Method: Co-construction"
        h3 = how.find('h3')
        if h3: h3.string = "We build with you, not for you"
        
        steps = how.find_all('div', class_='step-card')
        if len(steps) >= 4:
            steps[0].find('h4').string = "1. Discovery (1h)"
            steps[0].find('p').string = "Understand your challenges and identify what should be automated vs what stays manual."
            
            steps[1].find('h4').string = "2. Co-construction (4-8 weeks)"
            steps[1].find('p').string = "1-2h/week live sessions where we build together. You see every decision, we explain every technical choice. You learn by doing."
            
            steps[2].find('h4').string = "3. Autonomy (go-live day)"
            steps[2].find('p').string = "Delivery + complete documentation. You can maintain and evolve your agents without depending on us."
            
            steps[3].find('h4').string = "4. Continuous upgrade (optional)"
            steps[3].find('p').string = "New AI tools released? We keep you informed. You stay ahead."

    # Testimonials
    proof = soup.find('section', class_='social-proof')
    if proof:
        quotes = proof.find_all('div', class_='testimonial-card')
        if len(quotes) >= 3:
            quotes[0].find('p', class_='testimonial-text').string = '"We started with a free diagnostic. 6 weeks later, our reporting agent was running. And most importantly: I understand what it does, I can evolve it alone."'
            author_info = quotes[0].find('div', class_='author-info')
            if author_info:
                author_info.find('h4').string = "Marc T."
                author_info.find('p').string = "Independent Wealth Manager"

            quotes[1].find('p', class_='testimonial-text').string = '"I was afraid of creating dependency. Instead — the documentation is so clear that my team took over without issue after 2 months."'
            author_info = quotes[1].find('div', class_='author-info')
            if author_info:
                author_info.find('h4').string = "Sophie L."
                author_info.find('p').string = "SMB Director (45 employees)"
                
            quotes[2].find('p', class_='testimonial-text').string = '"What convinced me: they\'re honest about what doesn\'t work. When a tool wasn\'t suitable, they told me. No dream sellers."'
            author_info = quotes[2].find('div', class_='author-info')
            if author_info:
                author_info.find('h4').string = "Pierre D."
                author_info.find('p').string = "Tech-forward Entrepreneur"

    with open('professionals-mock-en.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))

if __name__ == '__main__':
    update_professionals()
