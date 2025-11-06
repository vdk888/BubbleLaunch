#!/usr/bin/env python3
"""
Script to update the businesses.html page with new content from Texte business.md
"""

import re

# Read the current HTML file
with open('src/frontend/pages/businesses.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Define the new content sections

# New "Why" section content
new_why_section = '''    <!-- Why We Started This Section -->
    <section id="why" class="approach fade-in">
      <div class="container" style="max-width: 800px;">
        <h2 data-translate="businesses.why.title">Pourquoi nous faisons cela</h2>

        <p data-translate="businesses.why.p1">
          Après des années dans des cabinets de conseil et dans la gestion d'actifs, nous avons observé de nombreux travers : des missions à 6 chiffres qui ne débouchent sur rien, des consultants qui disparaissent après avoir présenté leur rapport, et beaucoup de promesses rarement tenues. Chez Bubble Invest, nous avons choisi de faire autrement : miser sur l'honnêteté, la souplesse et l'envie d'aider vraiment – même si cela signifie parfois dire non à un projet qui ne correspond pas à notre expertise ou nos valeurs.
        </p>

        <p data-translate="businesses.why.p2">
          On préfère afficher notre expérience que prétendre tout savoir. Nous agissons avec vous, main dans la main, sans vous vendre une révolution technologique. Sur chaque projet, nous privilégions la transparence, même si cela veut dire reconnaître nos limites.
        </p>
      </div>
    </section>

    <!-- Values and Methodology Section -->
    <section id="values" class="fade-in" style="padding: 6rem 0; background: #F8F8F8;">
      <div class="container" style="max-width: 900px;">
        <h2 style="text-align: center; margin-bottom: 3rem;" data-translate="businesses.values.title">Valeurs et méthodologie</h2>

        <div style="display: grid; gap: 2rem;">
          <div style="background: white; padding: 2rem; border-radius: 24px;">
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #333; margin-bottom: 1rem;" data-translate="businesses.values.pragmatism.title">Pragmatisme</h3>
            <p style="color: #666; line-height: 1.7; margin: 0;" data-translate="businesses.values.pragmatism.text">
              Outils éprouvés et adaptables, pas de technologie pour la technologie.
            </p>
          </div>

          <div style="background: white; padding: 2rem; border-radius: 24px;">
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #333; margin-bottom: 1rem;" data-translate="businesses.values.transparency.title">Transparence</h3>
            <p style="color: #666; line-height: 1.7; margin: 0;" data-translate="businesses.values.transparency.text">
              Tarif et délai annoncés dès le diagnostic, pas de budgets cachés, pas de ventes forcées.
            </p>
          </div>

          <div style="background: white; padding: 2rem; border-radius: 24px;">
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #333; margin-bottom: 1rem;" data-translate="businesses.values.collaboration.title">Collaboration directe</h3>
            <p style="color: #666; line-height: 1.7; margin: 0;" data-translate="businesses.values.collaboration.text">
              Échanges simples, suivi continu, accompagnement même après la livraison via une maintenance adaptée.
            </p>
          </div>

          <div style="background: white; padding: 2rem; border-radius: 24px;">
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #333; margin-bottom: 1rem;" data-translate="businesses.values.humility.title">Humilité</h3>
            <p style="color: #666; line-height: 1.7; margin: 0;" data-translate="businesses.values.humility.text">
              Nous débutons, et nous n'avons pas 500 clients dans notre historique ou une vue sur les Champs Elysées – mais nous agissons et restons à l'écoute.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="manifesto fade-in">
      <div class="container" style="max-width: 800px;">
        <h2 data-translate="businesses.pricing.title">Tarifs</h2>

        <p data-translate="businesses.pricing.text">
          Nos projets se situent dans une fourchette réaliste : de 15 000 à 30 000 € livrés en 2 à 4 mois, avec devis transparent et phase de diagnostic et maintenance incluse. Nous ne cherchons pas à rivaliser avec les grandes agences sur le volume, mais sur la qualité et la pertinence de ce que nous livrons à nos clients. Notre objectif ? Que les outils d'aujourd'hui soit disponible pour les petites comme les grandes entreprises, sans tarifs discriminants.
        </p>
      </div>
    </section>'''

# Replace old pricing + why sections with new content
# Find the start of pricing section
pricing_start = html_content.find('    <!-- Pricing Comparison Section -->')
# Find the end of why section (before featured article)
why_end = html_content.find('    <!-- Featured Article Section -->')

if pricing_start != -1 and why_end != -1:
    # Replace everything between pricing start and featured article
    html_content = (
        html_content[:pricing_start] +
        new_why_section + '\n\n' +
        html_content[why_end:]
    )
    print("✓ Replaced pricing and why sections with new content")
else:
    print("✗ Could not find sections to replace")
    exit(1)

# Write the updated HTML
with open('src/frontend/pages/businesses.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("✓ Successfully updated businesses.html")
print("Next: Update translations.js with new translation keys")
