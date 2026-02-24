import re

with open('particuliers-mock.html', 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    "Total Positions": "Total des Positions",
    "Avg Position": "Position Moyenne",
    "Last update: 2 min ago": "Dernière MAJ : il y a 2 min",
    "this week": "cette semaine",
    "Current Allocations:": "Allocations Actuelles :",
    "Healthcare": "Santé",
    "Gold": "Or",
    "Current Positions": "Positions Actuelles",
    "Largest": "Principales",
    "Next Actions": "Prochaines Actions",
    "To Rebalance": "À Rééquilibrer",
    "Morning Brief — January 15": "Briefing Matinal — 15 Janvier",
    "Portfolio:": "Portefeuille :",
    "• 2 positions to rebalance before 10am": "• 2 positions à rééquilibrer avant 10h",
    "• NVDA: Volatility alert (+15% overnight)": "• NVDA : Alerte volatilité (+15% cette nuit)",
    "Analysis — January 12 Rebalancing:": "Analyse — Rééquilibrage du 12 Janvier :",
    "• Sold: AAPL (-2%) — reached take-profit at +18%": "• Vente : AAPL (-2%) — take-profit atteint à +18%",
    "• Bought: VEA (+2%) — opportunity on international": "• Achat : VEA (+2%) — opportunité à l'international",
    "• Result: +0.8% vs S&P 500 since rebalancing": "• Résultat : +0.8% vs S&P 500 depuis rééquilibrage",
    "All trades are in your broker history.": "Tous les ordres sont dans l'historique de votre broker.",
    "What are my current allocations?": "Quelles sont mes allocations actuelles ?",
    "Analyze the last rebalancing": "Analyser le dernier rééquilibrage",
    "All our articles": "Tous nos articles",
    "Twice a week · 3 profiles: Tech · Finance · Balanced · Unsubscribe anytime": "2x par semaine · 3 profils : Tech · Finance · Équilibré · Désinscription à tout moment",
    "Subscribe to newsletter": "S'abonner à la newsletter"
}

for eng, fr in replacements.items():
    html = html.replace(eng, fr)

# Let's handle the Send button
html = re.sub(r'<button class="chat-submit[^>]*>.*?Send.*?</button>', r'<button class="chat-submit">\n            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n              <line x1="22" y1="2" x2="11" y2="13"></line>\n              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>\n            </svg>\n            Envoyer\n          </button>', html, flags=re.DOTALL)

with open('particuliers-mock.html', 'w', encoding='utf-8') as f:
    f.write(html)

