import re
from bs4 import BeautifulSoup

def update_particuliers():
    with open('particuliers-mock.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    soup.html['lang'] = 'fr'
    
    # Title
    if soup.title:
        soup.title.string = "Particuliers — Découvrez notre Agent d'Investissement | Bubble"

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
                btns[1]['onclick'] = "window.location.href='/individuals-mock-en'"

    # Hero
    hero = soup.find('section', class_='hero')
    if hero:
        h1 = hero.find('h1')
        if h1: h1.string = "Notre Agent d'Investissement — Un POC Open"
        
        subtitle = hero.find('p', class_='hero-subtitle')
        if subtitle: subtitle.string = "On a construit un agent IA pour nous avec OpenClaw et du code. On partage comment ça marche — stack technique, prompts, limites — pour que vous puissiez reproduire, pour vos investissements ou vos projets."
        
        desc = hero.find('p', class_='hero-description')
        if desc: desc.decompose() # Remove desc, as plan doesn't have it
        
        ctas = hero.find('div', class_='hero-cta')
        if ctas:
            btns = ctas.find_all('a')
            if len(btns) >= 2:
                btns[0].string = "Recevoir nos analyses (2×/semaine)"
                btns[0]['href'] = "#" # Newsletter
                btns[1].string = "Vous voulez implémenter ça ?"
                btns[1]['href'] = "#b2b"

    # Agent demo
    demo = soup.find('section', id='demo')
    if demo:
        # Keep demo dashboard, just change the section header title if it existed
        pass

    # Stack Technique
    stack = soup.find('section', id='playground')
    if stack:
        sec_header = stack.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Comment c'est construit"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "100% transparent — notre stack technique"
            
        cards = stack.find_all('div', class_='playground-card')
        if len(cards) >= 4:
            cards[0].find('h4').string = "OpenClaw & APIs"
            cards[0].find('p').string = "Orchestration des agents via APIs. On vous montre comment configurer vos propres serveurs et connecter différents outils entre eux."
            
            cards[1].find('h4').string = "Code avec IA"
            cards[1].find('p').string = "On ne code pas seuls — on utilise plusieurs modèles d'IA comme Claude, Gemini, Kimi etc comme co-pilotes. On partage nos prompts, nos workflows de développement, comment on passe d'une idée à un agent fonctionnel."
            
            cards[2].find('h4').string = "API & Data"
            cards[2].find('p').string = "Connexion broker, bases vectorielles pour la mémoire, stockage sécurisé. On explique chaque choix technique et pourquoi on a privilégié telle ou telle solution."
            
            cards[3].find('h4').string = "Les limites (qu'on cache pas)"
            cards[3].find('p').string = "Exécution des ordres (achat/vente) applicable uniquement pour les comptes titre (pas pour PEA ou assurance vie). On montre ici tout ce qui marche et tout ce qui ne marche pas encore — pour que vous ayez une vision réaliste de ce qu'on peut faire."

    # Methode
    methode = soup.find('section', id='methodology')
    if methode:
        sec_header = methode.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Notre méthode"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "Ce qu'on a appris en construisant — et comment appliquer ça à vos projets"
            
        content = methode.find('div', class_='config-content')
        if content:
            content.find('h4').string = "5 principes non-négociables"
            content.find('p').string = "Pas de boîte noire. Des règles claires, appliquées avec discipline :"
            lis = content.find_all('li')
            if len(lis) >= 5:
                lis[0].clear()
                s1 = soup.new_tag('strong')
                s1.string = "1️⃣ Backtest systématique"
                lis[0].append(s1)
                lis[0].append(" — Aucune décision sans validation historique")
                
                lis[1].clear()
                s2 = soup.new_tag('strong')
                s2.string = "2️⃣ Risk parity 2 niveaux"
                lis[1].append(s2)
                lis[1].append(" — Thématique + intra-pocket")
                
                lis[2].clear()
                s3 = soup.new_tag('strong')
                s3.string = "3️⃣ Régime de marché"
                lis[2].append(s3)
                lis[2].append(" — 5 signaux composites (VIX, yield curve, credit...)")
                
                lis[3].clear()
                s4 = soup.new_tag('strong')
                s4.string = "4️⃣ Position sizing strict"
                lis[3].append(s4)
                lis[3].append(" — 1-10% max, jamais plus de 30 positions")
                
                lis[4].clear()
                s5 = soup.new_tag('strong')
                s5.string = "5️⃣ Validation humaine"
                lis[4].append(s5)
                lis[4].append(" — L'agent propose, nous validons (et on vous explique pourquoi)")

    # Generalisation
    gen = soup.find('section', id='generalisation')
    if gen:
        sec_header = gen.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Cette méthode marche pour vos propres projets"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "Au-delà de l'investissement"
            
        cards = gen.find_all('div', class_='playground-card')
        if len(cards) >= 3:
            cards[0].find('h4').string = "Veille réglementaire"
            cards[0].find('p').string = "Automatiser la surveillance des évolutions règlementaires (AMF, lois fiscales) avec alertes personnalisées."
            
            cards[1].find('h4').string = "Génération de rapports"
            cards[1].find('p').string = "Créer des templates intelligents qui remplissent automatiquement vos comptes-rendus clients à partir de vos données."
            
            cards[2].find('h4').string = "Productivité personnelle"
            cards[2].find('p').string = "Agents de tri email, synthèse de documents, recherche d'informations — tout ce qui vous prend du temps."
            
        btn_div = gen.find_all('div')[-1] # The one with CTAs
        if btn_div and btn_div.get('style') and 'text-align' in btn_div.get('style'):
            btns = btn_div.find_all('a')
            if len(btns) >= 2:
                btns[0].string = "Voir nos tutos"
                btns[0]['href'] = '/blog-mock'
                
                svg = btns[1].find('svg').extract()
                btns[1].clear()
                btns[1].append(svg)
                btns[1].append("Recevoir les nouveaux agents par mail")

    # Build In Public
    blog = soup.find('section', id='blog')
    if blog:
        sec_header = blog.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Build in Public"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "On documente tout : ce qui marche, ce qui casse, comment on répare."

    # Ressources gratuites
    tools = soup.find('section', id='playground-tools')
    if tools:
        sec_header = tools.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Ressources gratuites"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "Téléchargez, reproduisez, adaptez"
            
        cards = tools.find_all('div', class_='playground-card')
        if len(cards) >= 3:
            cards[0].find('h4').string = "Config OpenClaw de base"
            cards[0].find('p').string = "Notre configuration de test initiale pour bien démarrer avec le framework."
            
            cards[1].find('h4').string = "Prompts pour analyse de portefeuille"
            cards[1].find('p').string = "La liste des prompts que nous utilisons pour analyser nos positions."
            
            cards[2].find('h4').string = "Template Notion pour veille IA"
            cards[2].find('p').string = "Notre template pour organiser la veille technologique hebdomadaire."
            
            # The plan has 4 items, let's just create a 4th card
            new_card = soup.new_tag('div', **{'class': 'playground-card'})
            icon_div = soup.new_tag('div', **{'class': 'playground-icon'})
            new_card.append(icon_div)
            h4 = soup.new_tag('h4')
            h4.string = "Outils validés"
            new_card.append(h4)
            p = soup.new_tag('p')
            p.string = "La liste sélectionnée des outils qu'on teste chaque semaine en interne."
            new_card.append(p)
            cards[0].parent.append(new_card)
            
    # Testimonials Placeholder
    # Let's clone tools section and modify it to be testimonials
    if tools:
        testis = soup.new_tag('section', **{'class': 'playground', 'style': 'background: var(--bg-white);'})
        container = soup.new_tag('div', **{'class': 'container'})
        testis.append(container)
        
        sh = soup.new_tag('div', **{'class': 'section-header'})
        h2 = soup.new_tag('h2')
        h2.string = "Ils suivent notre travail"
        h3 = soup.new_tag('h3')
        h3.string = "Ce que disent ceux qui nous lisent"
        sh.append(h2)
        sh.append(h3)
        container.append(sh)
        
        grid = soup.new_tag('div', **{'class': 'playground-grid'})
        container.append(grid)
        
        c1 = soup.new_tag('div', **{'class': 'playground-card'})
        p1 = soup.new_tag('p')
        p1.string = '"Grâce à leurs explications sur OpenClaw, j\'ai pu construire mon propre agent de veille en 2 semaines. Pas besoin d\'équipe tech."'
        h41 = soup.new_tag('h4', style='margin-top: 1rem;')
        h41.string = "— Thomas D., Consultant indépendant"
        c1.append(p1)
        c1.append(h41)
        grid.append(c1)
        
        c2 = soup.new_tag('div', **{'class': 'playground-card'})
        p2 = soup.new_tag('p')
        p2.string = '"Enfin du contenu IA sans la hype et le bullshit. Ils nous montrent et nous expliquent tout et ça change tout."'
        h42 = soup.new_tag('h4', style='margin-top: 1rem;')
        h42.string = "— Marie L., CGP"
        c2.append(p2)
        c2.append(h42)
        grid.append(c2)
        
        c3 = soup.new_tag('div', **{'class': 'playground-card'})
        p3 = soup.new_tag('p')
        p3.string = '"J\'ai commencé par la newsletter, puis j\'ai reproduit leur agent d\'investissement, et maintenant je travaille avec eux sur un projet pour ma boîte."'
        h43 = soup.new_tag('h4', style='margin-top: 1rem;')
        h43.string = "— Alexandre K., Entrepreneur"
        c3.append(p3)
        c3.append(h43)
        grid.append(c3)
        
        tools.insert_after(testis)

    # B2B
    b2b = soup.find('section', id='b2b')
    if b2b:
        sec_header = b2b.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Vous voulez aller plus loin ?"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "Implémentez cette approche dans votre business"
            
        p = b2b.find('p')
        if p:
            p.clear()
            p.append("Vous avez vu comment on construit nos agents. Vous voulez faire pareil pour votre entreprise, vos clients, vos processus ?")
            p.append(soup.new_tag('br'))
            p.append(soup.new_tag('br'))
            p.append("On accompagne les professionnels (CGP, PME, sociétés de gestion) dans l'implémentation concrète d'agents IA sur mesure — avec la même approche transparente et la promesse d'autonomie.")
            
        btns = b2b.find_all('a', class_='btn')
        if len(btns) >= 2:
            btns[0].string = "Discuter de votre projet"
            btns[0]['href'] = 'https://calendly.com/bubbleinvest-ai'
            btns[1].string = "Voir nos solutions B2B"
            btns[1]['href'] = '/professionnels-mock'

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
            for i in range(len(lis)):
                if i == 0:
                    lis[i].find('a').string = "Particuliers"
                    lis[i].find('a')['href'] = "/particuliers-mock"
                elif i == 1:
                    lis[i].find('a').string = "Professionnels"
                    lis[i].find('a')['href'] = "/professionnels-mock"
                else:
                    lis[i].decompose()
                    
            links_cols[1].find('h4').string = "Ressources"
            lis = links_cols[1].find_all('li')
            for i in range(len(lis)):
                if i == 0:
                    lis[i].find('a').string = "Blog"
                    lis[i].find('a')['href'] = "/blog-mock"
                elif i == 1:
                    lis[i].find('a').string = "Newsletter"
                    lis[i].find('a')['href'] = "https://bit.ly/3Z9Cncr"
                elif i == 2:
                    lis[i].find('a').string = "Agents & Tutos"
                    lis[i].find('a')['href'] = "/particuliers-mock"
                else:
                    lis[i].decompose()
                
            links_cols[2].find('h4').string = "Entreprise"
            lis = links_cols[2].find_all('li')
            for i in range(len(lis)):
                if i == 0:
                    lis[i].find('a').string = "À Propos"
                    lis[i].find('a')['href'] = "/a-propos-mock"
                elif i == 1:
                    lis[i].find('a').string = "Build in Public"
                    lis[i].find('a')['href'] = "/a-propos-mock"
                elif i == 2:
                    lis[i].find('a').string = "Notre méthode"
                    lis[i].find('a')['href'] = "/particuliers-mock#methodology"
                else:
                    lis[i].decompose()
                
        bottom_ps = footer.find('div', class_='footer-bottom').find_all('p')
        if len(bottom_ps) >= 1:
            bottom_ps[0].string = "© 2026 Bubble Invest — Contenu gratuit · Expertise sur mesure · Build in Public"
        if len(bottom_ps) >= 2:
            bottom_ps[1].decompose() # Remove why bubble
            
    with open('particuliers-mock.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))
        
if __name__ == '__main__':
    update_particuliers()
