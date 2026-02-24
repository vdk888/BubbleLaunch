import re
from bs4 import BeautifulSoup

def update_a_propos():
    with open('a-propos-mock.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    soup.html['lang'] = 'fr'
    
    # Title
    if soup.title:
        soup.title.string = "À Propos — Philosophie, Histoire & Valeurs | Bubble"

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
                btns[1]['onclick'] = "window.location.href='/about-mock-en'"

    # 1. Hero
    hero = soup.find('section', class_='hero')
    if hero:
        h1 = hero.find('h1')
        if h1: h1.string = "À propos de Bubble"
        p = hero.find('p')
        if p: p.string = "On build in public. Voici qui nous sommes, ce qu'on croit et pourquoi on le fait."

    sections = soup.find_all('section', class_='section')
    
    # 2. Philosophie
    if len(sections) > 0:
        sec = sections[0]
        h2 = sec.find('h2')
        if h2: h2.string = "Notre philosophie"
        h3 = sec.find('h3')
        if h3: h3.string = "Automatiser pour mieux s'occuper des autres"
        
        content = sec.find('div', class_='story-content')
        if content:
            ps = content.find_all('p', recursive=False)
            h4s = content.find_all('h4', recursive=False)
            uls = content.find_all('ul', recursive=False)
            if len(ps) >= 8 and len(h4s) >= 4:
                ps[0].string = "L'IA peut produire du contenu, du code et de l'analyse pour un coût marginal proche de zéro. Ce qui devient rare, ce n'est plus la compétence technique. C'est autre chose :"
                ps[1].string = "Le choix conscient d'un être humain de consacrer son temps — son temps irréversible, perdu pour toujours — à un autre être humain."
                
                h4s[0].string = "L'histoire des vœux"
                ps[2].string = "Un dirigeant a utilisé l'IA pour envoyer ses vœux personnalisés à ses 600 employés. Des messages adaptés à chacun, à ses performances, à son parcours. Les employés étaient touchés."
                ps[3].string = "Puis le patron a révélé sa méthode. La déception fut immense."
                ps[4].string = "Pas parce que les mots avaient changé. Mais parce qu'ils ont découvert que derrière l'apparence de l'attention, il n'y avait aucun temps consacré. Aucun choix. Aucun sacrifice de quelque chose d'irréversible."
                
                h4s[1].string = "Le temps irréversible"
                ps[5].string = "Quand quelqu'un vous écrit un message, même court, la valeur ne réside pas dans sa formulation. Elle réside dans le fait que cette personne a pris un bout de sa vie, un fragment de temps qu'elle ne récupérera jamais, et a choisi de le dépenser pour vous plutôt qu'ailleurs."
                ps[6].string = "Elle a interrompu ce qu'elle faisait. Elle a pensé à vous. Ce temps est consommé, irréversible, perdu pour tout le reste."
                ps[7].string = "C'est cela que vous recevez. Pas des mots. Du temps. Le temps de vie d'une personne qui va mourir."
                
                h4s[2].string = "Ce que l'IA ne peut pas faire"
                ps[8].string = "L'IA peut simuler l'attention. Produire des phrases qui ressemblent à du soin. Mais il lui manque l'essentiel : la liberté de faire autrement."
                ps[9].string = "Elle ne peut pas choisir de ne pas vous répondre. Elle ne sacrifie rien. Son temps ne coûte rien."
                ps[10].string = "Et c'est précisément cette impossibilité — cette absence de choix — qui vide son attention de tout ce qui la rendrait précieuse."
                
                h4s[3].string = "Pourquoi on automatise"
                ps[11].string = "Si tout ce qui est automatisable est automatisé, alors il reste plus de temps pour ce qui ne l'est pas :"
                
                if len(uls) > 0:
                    lis = uls[0].find_all('li')
                    if len(lis) >= 4:
                        lis[0].string = "Le regard d'un conseiller qui comprend vraiment la situation de son client"
                        lis[1].string = "La créativité d'une équipe qui réfléchit ensemble"
                        lis[2].string = "L'empathie d'un manager qui prend le temps d'écouter"
                        lis[3].string = "La présence d'un parent, d'un ami, d'un proche"
                        
                ps[12].string = "Automatiser n'est pas une fin en soi. C'est un moyen de libérer du temps pour ce qui compte vraiment."
                ps[13].string = "Ce qu'on fait chez Bubble : on automatise le répétitif pour que vous puissiez consacrer votre temps irréversible à ce qui a de la valeur — vos clients, votre équipe, vos proches."

        quote = sec.find('blockquote', class_='manifesto-quote')
        if quote:
            quote.clear()
            quote.append('"L\'IA peut produire pour un coût marginal proche de zéro. Ce qu\'elle ne peut pas produire, c\'est le choix d\'un être libre de consacrer son temps à un autre.')
            quote.append(soup.new_tag('br'))
            quote.append(soup.new_tag('br'))
            quote.append('C\'est ça qu\'on vous redonne : du temps. Pour vous. Pour les vôtres."')
        
        attr = sec.find('p', class_='manifesto-attribution')
        if attr: attr.string = "— J & J, fondateurs"

    # 3. Valeurs
    if len(sections) > 1:
        sec = sections[1]
        h2 = sec.find('h2')
        if h2: h2.string = "Nos valeurs"
        h3 = sec.find('h3')
        if h3: h3.string = "On build in public"
        
        cards = sec.find_all('a', class_='value-card')
        if len(cards) >= 4:
            cards[0].find('h4').string = "Éduquer"
            cards[0].find('p').string = "Démystifier la finance et l'IA. Partager ce que l'industrie garde opaque."
            
            cards[1].find('h4').string = "Automatiser"
            cards[1].find('p').string = "Montrer comment on construit. Ce qu'on utilise pour nous, on vous l'explique."
            
            cards[2].find('h4').string = "Transparence"
            cards[2].find('p').string = "Nos chiffres, nos erreurs, nos décisions — tout est visible."
            
            cards[3].find('h4').string = "Bienveillance"
            cards[3].find('p').string = "Élever chaque personne qui nous fait confiance. Créer plus de valeur qu'on n'en capture."

    # 4. Histoire
    if len(sections) > 2:
        sec = sections[2]
        h2 = sec.find('h2')
        if h2: h2.string = "Notre histoire"
        h3 = sec.find('h3')
        if h3: h3.string = "Pourquoi on a créé Bubble"
        
        content = sec.find('div', class_='story-content')
        if content:
            ps = content.find_all('p', recursive=False)
            ul = content.find('ul')
            if len(ps) >= 5:
                ps[0].string = "On a passé 6 ans en gestion de fonds et dans de grandes banques. À travailler au quotidien dans ce qu'on appelle la \"haute finance\"."
                ps[1].string = "Et on s'est rendu compte de deux choses :"
                ps[2].string = "1/ Les investisseurs particuliers paient trop cher pour un service opaque. Des frais qui ne reflètent pas la valeur réelle créée."
                ps[3].string = "2/ Les méthodes de travail dans le secteur sont archaïques. À l'ère de l'automatisation, la plupart des gérants utilisent encore Excel de manière primitive."
                ps[4].string = "On a quitté nos postes confortables pour construire l'outil qu'on voulait pour nous-mêmes."
                
            h4 = content.find('h4')
            if h4: h4.string = "Un outil qui :"
            
            if ul:
                lis = ul.find_all('li')
                if len(lis) >= 3:
                    lis[0].string = "Automatise l'investissement actif, sans nous déposséder de nos actifs"
                    lis[1].string = "Explique chaque décision, sans jargon inutile"
                    lis[2].string = "Coûte un abonnement fixe, pas un pourcentage de notre patrimoine"
                    
            if len(ps) >= 6:
                ps[5].string = "Et on a décidé de le construire en public. Parce qu'on croit que la confiance se gagne par la transparence."

    # 5. L'équipe
    if len(sections) > 3:
        sec = sections[3]
        h2 = sec.find('h2')
        if h2: h2.string = "L'équipe"
        h3 = sec.find('h3')
        if h3: h3.string = "Qui nous sommes"
        
        intro = sec.find('p', class_='team-intro')
        if intro: intro.string = "J & J — Deux profils complémentaires. L'un de l'investissement, l'autre de l'audit et du conseil. Un optimiste, une pragmatique."
        
        members = sec.find_all('div', class_='team-member')
        if len(members) >= 2:
            members[0].find('h4').string = "Joris"
            members[0].find_all('p')[0].string = "Co-fondateur"
            members[0].find_all('p')[1].string = "6 ans en gestion de fonds et banque d'investissement"
            
            members[1].find('h4').string = "Jade"
            members[1].find_all('p')[0].string = "Co-fondatrice"
            members[1].find_all('p')[1].string = "6 ans en audit et conseil (Big Four)"
            
        p = sec.find_all('p')[-1]
        if p.get('style') and 'max-width' in p.get('style'):
            p.string = "On ne cherche pas à devenir des icônes. On veut rester dans l'ombre du produit. Parce que Bubble, ce n'est pas notre histoire — c'est la vôtre."

    # 6. Ce qu'on fait
    if len(sections) > 4:
        sec = sections[4]
        h2 = sec.find('h2')
        if h2: h2.string = "Ce qu'on fait"
        h3 = sec.find('h3')
        if h3: h3.string = "Aujourd'hui et demain"
        
        content = sec.find('div', class_='story-content')
        if content:
            ps = content.find_all('p')
            h4s = content.find_all('h4')
            if len(ps) >= 1: ps[0].string = "On développe deux activités complémentaires autour d'une même expertise : l'automatisation par les agents."
            if len(h4s) >= 1: h4s[0].string = "1. Implémentation de systèmes multi-agents (B2B)"
            if len(ps) >= 2: ps[1].string = "Pour les professionnels de la finance — CGP, sociétés de gestion, Directions Financières. On déploie les dernières solutions d'automatisation dès leur sortie. Diagnostics, agents sur mesure, projets complets."
            if len(h4s) >= 2: h4s[1].string = "2. L'Agent d'Investissement (B2C)"
            if len(ps) >= 3: ps[2].string = "L'outil qu'on utilise pour nos propres portefeuilles. On vous partage comment configurer votre agent : screening, backtesting, exécution automatisée. C'est du \"partage\" — on ne prétend pas avoir la vérité absolue, on vous donne accès à ce qui marche pour nous."
            
            if len(ps) >= 4:
                ps[3].clear()
                ps[3].append("Notre positionnement est clair : ")
                s1 = soup.new_tag('strong')
                s1.string = "Le B2B d'abord"
                ps[3].append(s1)
                ps[3].append(" (pour la viabilité de l'entreprise), ")
                s2 = soup.new_tag('strong')
                s2.string = "Le B2C en partage"
                ps[3].append(s2)
                ps[3].append(" (pour l'impact et la communauté).")

    # 7. Émancipation
    if len(sections) > 5:
        sec = sections[5]
        h2 = sec.find('h2')
        if h2: h2.string = "Notre volonté d'émanciper"
        h3 = sec.find('h3')
        if h3: h3.string = "Là où l'industrie du conseil vit de votre dépendance, nous vivons de votre émancipation"
        
        content = sec.find('div', class_='story-content')
        if content:
            ps = content.find_all('p')
            if len(ps) >= 4:
                ps[0].string = "Notre mission n'est pas de vous rendre dépendants — c'est de vous élever."
                ps[1].string = "Là où l'industrie du conseil classique construit des \"boîtes noires\" cryptiques pour vous facturer de la maintenance au mois, nous choisissons l'open source et le transfert de compétences."
                ps[2].string = "On ne fait pas que construire des agents pour vous. On vous montre comment ils sont construits, pour que vous puissiez le faire vous-mêmes ensuite. On documente nos réussites, nos échecs, nos méthodes."
                ps[3].clear()
                ps[3].append("Au cœur de Bubble, il y a une conviction : ")
                s = soup.new_tag('strong')
                s.string = "la transparence crée plus de valeur que la rétention d'information"
                ps[3].append(s)
                ps[3].append(". On mesure notre succès non pas à quel point vous avez besoin de nous, mais à la vitesse à laquelle vous devenez autonomes.")

    # 8. Pourquoi Bubble
    if len(sections) > 6:
        sec = sections[6]
        h2 = sec.find('h2')
        if h2: h2.string = "Le nom"
        h3 = sec.find('h3')
        if h3: h3.string = "Pourquoi \"Bubble\" ?"
        
        items = sec.find_all('div', class_='why-item')
        if len(items) >= 3:
            items[0].find('h4').string = "La bulle de la finance"
            items[0].find('p').string = "On éclate (pop) la bulle de la finance opaque. Pas de jargon, pas de frais cachés, pas de complexité artificielle."
            
            items[1].find('h4').string = "Investir"
            items[1].find('p').string = "Notre cœur de métier historique. Mais aussi une métaphore : investir dans les bulles technologiques (comme l'IA), investir en soi."
            
            items[2].find('h4').string = "Le double sens"
            items[2].find('p').string = "Investir dans les bulles = saisir les opportunités. Investir en soi = se former, devenir autonome."
            
        p = sec.find_all('p')[-1]
        if p.get('style') and 'text-align' in p.get('style'):
            em = p.find('em')
            if em: em.string = "\"Let's pop the finance bubble!\""

    # 9. Build in public (Footer court)
    if len(sections) > 7:
        sec = sections[7]
        h2 = sec.find('h2')
        if h2: h2.string = "Build in Public"
        h3 = sec.find('h3')
        if h3: h3.string = "Suivez notre parcours"
        
        content = sec.find('div', class_='story-content')
        if content:
            p = content.find('p', class_='lead')
            if p: p.string = "On partage nos doutes, nos victoires, nos erreurs. Parce que la confiance se gagne par la transparence."
            
            links = content.find_all('a')
            if len(links) >= 4:
                links[0].string = "Blog →"
                links[0]['href'] = "/blog-mock"
                links[1].string = "Newsletter →"
                links[1]['href'] = "https://bit.ly/3Z9Cncr"
                links[2].string = "YouTube →"
                links[2]['href'] = "#"
                links[3].string = "LinkedIn →"
                links[3]['href'] = "https://www.linkedin.com/company/bubble-invest"

    # Footer
    footer = soup.find('footer')
    if footer:
        brand_p = footer.find('div', class_='footer-brand').find_all('p')
        if len(brand_p) >= 1:
            brand_p[0].string = "L'ère de l'IA a tout changé. Changez avec elle."
            
        links_cols = footer.find_all('div', class_='footer-links')
        if len(links_cols) >= 3:
            # First col is Product -> Implémentation
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

    with open('a-propos-mock.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))
        
if __name__ == '__main__':
    update_a_propos()
