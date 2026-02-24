import re
from bs4 import BeautifulSoup
import os

def replace_text(soup, search_text, replace_text, exact=False):
    for text_node in soup.find_all(string=True):
        if text_node.parent.name in ['script', 'style']:
            continue
        if exact:
            if search_text.strip() == text_node.strip():
                text_node.replace_with(text_node.replace(search_text, replace_text))
        else:
            if search_text in text_node:
                text_node.replace_with(text_node.replace(search_text, replace_text))

def update_homepage():
    with open('homepage-mock-v4.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    soup.html['lang'] = 'fr'
    
    # Title
    soup.title.string = "Bubble — L'IA implémentée. Vous gardez l'avance."
    
    # Nav
    nav = soup.find('nav')
    if nav:
        links = nav.find_all('a')
        if len(links) >= 4:
            links[0].string = 'À Propos'
            links[0]['href'] = '/a-propos-mock'
            links[1].string = 'Professionnels'
            links[1]['href'] = '/professionnels-mock'
            links[2].string = 'Particuliers'
            links[2]['href'] = '/particuliers-mock'
            links[3].string = 'Blog'
            links[3]['href'] = '/blog-mock'
            
        lang_switch = nav.find('div', class_='lang-switch')
        if lang_switch:
            btns = lang_switch.find_all('button')
            if len(btns) >= 2:
                btns[0].string = 'FR'
                btns[0]['class'] = ['active']
                btns[0]['onclick'] = ''
                btns[1].string = 'EN'
                btns[1]['class'] = []
                btns[1]['onclick'] = "window.location.href='/homepage-mock-v4-en'"

    # Hero
    tagline = soup.find('p', class_='hero-tagline')
    if tagline: tagline.string = "L'IA implémentée. Vous gardez l'avance."
    desc = soup.find('p', class_='hero-description')
    if desc:
        desc.clear()
        desc.append("On construit des agents IA pour nous — et on vous montre comment faire pareil. Vitrine d'expertise gratuite pour particuliers. Implémentation sur mesure pour professionnels.")
        
    chat_input = soup.find('input', class_='chat-input')
    if chat_input:
        chat_input['placeholder'] = 'Par exemple : "Comment fonctionne votre agent d\'investissement ?"'
        
    btn_primary = soup.find('button', class_='btn-primary')
    if btn_primary: btn_primary.string = 'Voir la démo'
    
    btn_secondary = soup.find('a', class_='btn-secondary')
    if btn_secondary:
        btn_secondary.string = 'En savoir plus'
        btn_secondary['href'] = '/a-propos-mock'
    
    # Dual paths header
    sec_header = soup.find('section', class_='dual-path').find('div', class_='section-header')
    if sec_header:
        sec_header.find('h2').string = 'Deux Approches'
        sec_header.find('h3').string = 'Choisissez votre parcours'
        
    # Dual path cards
    cards = soup.find_all('div', class_='path-card')
    if len(cards) >= 1:
        c1 = cards[0]
        c1.find('h3').string = 'Particuliers'
        c1.find('p').string = "Apprenez en observant ce qu'on a construit"
        c1['onclick'] = "location.href='/particuliers-mock'"
        c1.find('a', class_='path-cta')['href'] = '/particuliers-mock'
        lis = c1.find_all('li')
        if len(lis) >= 4:
            lis[0].string = "Notre agent d'investissement est un proof of concept public."
            lis[1].string = "On partage comment il marche (OpenClaw, code, méthodes) pour que vous puissiez reproduire — pour vos investissements ou vos propres projets."
            lis[2].string = "POC 100% transparent — Stack, limites, apprentissages"
            lis[3].string = "Ressources gratuites — Configs, tutos, veille"
            # add 5th li
            new_li = soup.new_tag('li')
            new_li.string = "Newsletter — Ce qu'on découvre chaque semaine"
            lis[3].insert_after(new_li)
            # update button text
        cta1 = c1.find('a', class_='path-cta')
        # Keep SVG
        svg1 = cta1.find('svg').extract()
        cta1.string = 'Explorer notre agent '
        cta1.append(svg1)
            
    if len(cards) >= 2:
        c2 = cards[1]
        c2.find('h3').string = 'Professionnels'
        c2.find('p').string = "Implémentez l'IA dans votre métier — avec les tout derniers outils"
        c2['onclick'] = "location.href='/professionnels-mock'"
        c2.find('a', class_='path-cta')['href'] = '/professionnels-mock'
        lis = c2.find_all('li')
        if len(lis) >= 4:
            lis[0].string = "CGP, sociétés de gestion, PME. On déploie des agents sur vos systèmes."
            lis[1].string = "Les solutions qu'on utilise sont sorties il y a quelques semaines — on est parmi les premiers en France à les maîtriser."
            lis[2].string = "Early adopters — Toujours une longueur d'avance"
            lis[3].string = "Co-construction — On build avec vous, pas pour vous"
            # add 5th li
            new_li = soup.new_tag('li')
            new_li.string = "Autonomie garantie — À la fin, vous n'avez plus besoin de nous"
            lis[3].insert_after(new_li)
        cta2 = c2.find('a', class_='path-cta')
        svg2 = cta2.find('svg').extract()
        cta2.string = 'Discuter de votre projet '
        cta2.append(svg2)

    # Blog preview
    blog_header = soup.find('section', class_='blog-preview').find('div', class_='section-header')
    if blog_header:
        blog_header.find('h2').string = 'Build in Public'
        blog_header.find('h3').string = "Ce qu'on apprend, ce qu'on pense, ce qu'on partage — gratuitement"
        
    blog_cards = soup.find('section', class_='blog-preview').find_all('div', class_='blog-card')
    if len(blog_cards) >= 3:
        b1, b2, b3 = blog_cards[0], blog_cards[1], blog_cards[2]
        b1.find('div', class_='blog-tag').string = "Agents en vitrine"
        b1.find('h4').string = "Notre agent en action : 18 mois de gestion réelle"
        b1.find('p').string = ""
        b1['onclick'] = "location.href='/blog-mock'"
        
        b2.find('div', class_='blog-tag').string = "Cas d'usage"
        b2.find('h4').string = "Comment on automatise la veille réglementaire avec OpenClaw"
        b2.find('p').string = ""
        b2['onclick'] = "location.href='/blog-mock'"
        
        b3.find('div', class_='blog-tag').string = "Essai philosophique"
        b3.find('h4').string = "L'IA va-t-elle remplacer les CGP ? Réflexion sur la valeur du conseil"
        b3.find('p').string = ""
        b3['onclick'] = "location.href='/blog-mock'"
        
    # Remove unwanted sections that are not in FINAL_CONTENT:
    # selfware, trust, waitlist
    for sel in ['.selfware', '.trust', '.waitlist']:
        for tag in soup.select(sel):
            tag.decompose()
            
    # Footer
    footer = soup.find('footer')
    if footer:
        brand_p = footer.find('div', class_='footer-brand').find_all('p')
        if len(brand_p) >= 1:
            brand_p[0].string = "L'ère de l'IA a tout changé. Changez avec elle."
            
        links_cols = footer.find_all('div', class_='footer-links')
        if len(links_cols) >= 3:
            links_cols[0].find('h4').string = "Implémentation"
            lis = links_cols[0].find_all('li')
            if len(lis) >= 2:
                lis[0].find('a').string = "Particuliers"
                lis[0].find('a')['href'] = "/particuliers-mock"
                lis[1].find('a').string = "Professionnels"
                lis[1].find('a')['href'] = "/professionnels-mock"
            if len(lis) > 2:
                for i in range(2, len(lis)):
                    lis[i].decompose()
                    
            links_cols[1].find('h4').string = "Ressources"
            lis = links_cols[1].find_all('li')
            if len(lis) >= 3:
                lis[0].find('a').string = "Blog"
                lis[0].find('a')['href'] = "/blog-mock"
                lis[1].find('a').string = "Newsletter"
                lis[2].find('a').string = "Agents & Tutos"
                
            links_cols[2].find('h4').string = "Entreprise"
            lis = links_cols[2].find_all('li')
            if len(lis) >= 2:
                lis[0].find('a').string = "À Propos"
                lis[0].find('a')['href'] = "/a-propos-mock"
                lis[1].find('a').string = "Build in Public"
                new_li = soup.new_tag('li')
                new_a = soup.new_tag('a', href='/a-propos-mock')
                new_a.string = "Notre méthode"
                new_li.append(new_a)
                links_cols[2].find('ul').append(new_li)
                
        bottom_ps = footer.find('div', class_='footer-bottom').find_all('p')
        if len(bottom_ps) >= 1:
            bottom_ps[0].string = "© 2026 Bubble Invest — Contenu gratuit · Expertise sur mesure · Build in Public"
        if len(bottom_ps) >= 2:
            bottom_ps[1].decompose() # Remove why bubble

    with open('homepage-mock-v4.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))
        
if __name__ == '__main__':
    update_homepage()
