import re
from bs4 import BeautifulSoup

def update_homepage():
    with open('homepage-mock-v4-en.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    
    # Hero Description
    hero_desc = soup.find('p', class_='hero-description')
    if hero_desc:
        hero_desc.string = "We build AI agents for ourselves — and show you how to do the same. Free expertise showcase for individuals. Custom implementation for professionals."
        
    # Dual Path
    cards = soup.find_all('div', class_='path-card')
    if len(cards) >= 2:
        # Individuals
        cards[0].find('h3').string = "Individuals"
        cards[0].find('p').string = "Learn by watching what we've built"
        
        ul1 = cards[0].find('ul', class_='path-features')
        if ul1:
            lis1 = ul1.find_all('li')
            if len(lis1) >= 3:
                lis1[0].string = "Our investment agent is a public proof of concept. We share how it works (OpenClaw, code, prompts) so you can reproduce it — for your investments or your own projects."
                lis1[1].string = "100% transparent POC — Stack, limits, learnings"
                lis1[2].string = "Free resources — Configs, tutorials, watch"
                
                # Add 4th li if it doesn't exist, else update
                if len(lis1) < 4:
                    new_li = soup.new_tag('li')
                    new_li.string = "Newsletter — What we discover each week"
                    ul1.append(new_li)
                else:
                    lis1[3].string = "Newsletter — What we discover each week"
                    
        btn1 = cards[0].find('a', class_='path-cta')
        if btn1:
            btn1.string = "Explore our agent"
            
        # Professionals
        cards[1].find('h3').string = "Professionals"
        cards[1].find('p').string = "Implement AI in your business — with the latest tools"
        
        ul2 = cards[1].find('ul', class_='path-features')
        if ul2:
            lis2 = ul2.find_all('li')
            if len(lis2) >= 3:
                lis2[0].string = "Wealth managers, asset managers, SMBs. We deploy agents on your systems. The solutions we use were released weeks ago — we're among the first in France to master them."
                lis2[1].string = "Early adopters — Always one step ahead"
                lis2[2].string = "Co-construction — We build with you, not for you"
                
                if len(lis2) < 4:
                    new_li2 = soup.new_tag('li')
                    new_li2.string = "Guaranteed autonomy — In the end, you don't need us"
                    ul2.append(new_li2)
                else:
                    lis2[3].string = "Guaranteed autonomy — In the end, you don't need us"
                    
        btn2 = cards[1].find('a', class_='path-cta')
        if btn2:
            btn2.string = "Discuss your project"

    # Footer
    footer = soup.find('footer')
    if footer:
        brand_p = footer.find('div', class_='footer-brand').find_all('p')
        if len(brand_p) >= 1:
            brand_p[0].string = "AI implemented. You stay ahead."
            
        bottom_ps = footer.find('div', class_='footer-bottom').find_all('p')
        if len(bottom_ps) >= 1:
            bottom_ps[0].string = "© 2026 Bubble Invest — Free content · Custom expertise · Build in Public"
        if len(bottom_ps) >= 2:
            bottom_ps[1].decompose()

    with open('homepage-mock-v4-en.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))
        
if __name__ == '__main__':
    update_homepage()
