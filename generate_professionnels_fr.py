import re
from bs4 import BeautifulSoup

def update_professionnels():
    with open('professionnels-mock.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    soup.html['lang'] = 'fr'
    
    # Title
    if soup.title:
        soup.title.string = "Professionnels — Implémentation IA | Bubble"

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
                btns[1]['onclick'] = "window.location.href='/professionals-mock-en'"

    # Hero
    hero = soup.find('section', class_='hero')
    if hero:
        h1 = hero.find('h1')
        if h1: h1.string = "Devenez la PME la plus rapide de votre secteur"
        
        subtitle = hero.find('p', class_='hero-subtitle')
        if subtitle: subtitle.string = "L'IA n'est pas une hype, c'est un avantage concurrentiel asymétrique. On implémente les agents d'aujourd'hui dans vos processus pour que vous gardiez l'avance."
        
        desc = hero.find('p', class_='hero-description')
        if desc: desc.string = "On ne vend pas de SaaS mensuel. On analyse, on construit sur mesure, on déploie sur vos systèmes, on vous forme. Ensuite, l'agent vous appartient. Autonomie totale."
        
        ctas = hero.find('div', class_='hero-cta')
        if ctas:
            btns = ctas.find_all('a')
            if len(btns) >= 2:
                btns[0].string = "Discuter de votre projet"
                btns[0]['href'] = "#calendly"
                btns[1].string = "Voir des cas d'usage"
                btns[1]['href'] = "#services"

    # Services
    services = soup.find('section', id='services')
    if services:
        sec_header = services.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Domaines d'intervention"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "Où l'IA a un impact immédiat"
            
        cards = services.find_all('div', class_='service-card')
        if len(cards) >= 3:
            cards[0].find('h4').string = "Veille & Recherche"
            cards[0].find('p').string = "Surveillance concurrentielle, veille réglementaire, analyse de marché. L'agent lit, synthétise et vous alerte."
            
            cards[1].find('h4').string = "Analyse de données complexes"
            cards[1].find('p').string = "Traitement de gros volumes (documents juridiques, bilans financiers, historiques). L'agent extrait la donnée clé."
            
            cards[2].find('h4').string = "Automatisation Back-Office"
            cards[2].find('p').string = "Génération de rapports personnalisés, pré-qualification, workflows administratifs répétitifs."

    # How we work
    hww = soup.find('section', id='how-we-work')
    if hww:
        sec_header = hww.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Notre approche"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "Co-construction et transfert de compétences"
            
        cards = hww.find_all('div', class_='step-card')
        if len(cards) >= 4:
            cards[0].find('h4').string = "1. Audit gratuit (1h)"
            cards[0].find('p').string = "On identifie VOS frictions. Si l'IA n'est pas la bonne solution, on vous le dit. Pas de bullshit."
            
            cards[1].find('h4').string = "2. POC en 2 à 4 semaines"
            cards[1].find('p').string = "On construit un premier agent fonctionnel sur un cas d'usage précis. Vous testez la valeur très vite."
            
            cards[2].find('h4').string = "3. Déploiement sécurisé"
            cards[2].find('p').string = "Cloud privé, API sécurisées, respect de la confidentialité des données (pas d'entraînement des modèles sur vos data)."
            
            cards[3].find('h4').string = "4. Formation & Autonomie"
            cards[3].find('p').string = "On forme vis équipes à utiliser et faire évoluer l'agent. À la fin, vous avez la main."

    # Examples
    examples = soup.find('section', id='examples')
    if examples:
        sec_header = examples.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Ce qu'on a déjà construit"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "Cas d'usage concrets — Pas de théorie"
            
        cards = examples.find_all('div', class_='example-card')
        if len(cards) >= 3:
            cards[0].find('h4').string = "Agent de veille AMF"
            cards[0].find('p').string = "Surveille les publications de l'AMF et génère une synthèse quotidienne des alertes sanctions sur les SCPI."
            cards[0].find('span', class_='example-label').string = "Pour les CGP"
            
            cards[1].find('h4').string = "Assistant Appel d'Offres"
            cards[1].find('p').string = "Analyse les cahiers des charges de 200 pages en 5 minutes et pré-rédige les éléments de conformité."
            cards[1].find('span', class_='example-label').string = "Pour les PME"
            
            cards[2].find('h4').string = "Agent de pré-qualification"
            cards[2].find('p').string = "Analyse les emails entrants de prospects pour un promoteur immobilier, score l'urgence et prépare une réponse."
            cards[2].find('span', class_='example-label').string = "Pour l'Immobilier"

    # Why Bubble
    wb = soup.find('section', id='why-bubble')
    if wb:
        sec_header = wb.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Pourquoi nous choisir ?"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "Notre différence est dans l'exécution"
            
        cards = wb.find_all('div', class_='why-card')
        if len(cards) >= 3:
            cards[0].find('h4').string = "Early adopters"
            cards[0].find('p').string = "On connaît les outils sortis le mois dernier. On vous fait bénéficier de la tech la plus récente avant vos concurrents (ex: Model Context Protocol)."
            
            cards[1].find('h4').string = "Build in Public"
            cards[1].find('p').string = "Notre propre POC (Agent d'investissement) est public. On ne vous vend pas ce qu'on ne sait pas faire pour nous-mêmes."
            
            cards[2].find('h4').string = "Zéro opacité"
            cards[2].find('p').string = "On build AVEC vous. Pas de boîte noire. Vous comprenez chaque choix technique car nous vous l'expliquons."

    # Social Proof
    sp = soup.find('section', id='social-proof')
    if sp:
        sp.decompose() # Not in final content

    # FAQ
    faq = soup.find('section', id='faq')
    if faq:
        sec_header = faq.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "Questions fréquentes"
            
        items = faq.find_all('div', class_='faq-item')
        if len(items) >= 4:
            items[0].find('h4').string = "Est-ce que mes données vont entraîner ChatGPT ?"
            items[0].find('p').string = "Non. Nous utilisons les API entreprise des modèles (comme Anthropic ou OpenAI), qui garantissent contractuellement que vos données ne sont jamais utilisées pour l'entraînement."
            
            items[1].find('h4').string = "Combien ça coûte ?"
            items[1].find('p').string = "L'audit initial est gratuit. Ensuite, nous facturons au projet (POC ou déploiement complet). Pas d'abonnement SaaS mensuel, vous ne payez que les coûts d'API (très faibles aujourd'hui)."
            
            items[2].find('h4').string = "Faut-il des connaissances techniques ?"
            items[2].find('p').string = "Non. C'est notre rôle. Nous construisons l'outil pour qu'il soit utilisable en langage naturel par vos équipes métier."
            
            items[3].find('h4').string = "Quel est le délai typique ?"
            items[3].find('p').string = "Toutes les missions commencent par un POC livré en 2 à 4 semaines pour valider la faisabilité technique et la valeur métier avant tout grand déploiement."

    # Final CTA
    cta = soup.find('section', id='calendly')
    if cta:
        sec_header = cta.find('div', class_='section-header')
        if sec_header:
            sh2 = sec_header.find('h2')
            if sh2: sh2.string = "On en parle de vive voix ?"
            sh3 = sec_header.find('h3')
            if sh3: sh3.string = "Réservez 30 min avec nous. 100% exploration, 0% pression commerciale."

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

    with open('professionnels-mock.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))
        
if __name__ == '__main__':
    update_professionnels()
