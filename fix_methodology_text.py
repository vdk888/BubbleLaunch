import re

with open('professionnels-mock.html', 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    "Discovery (2h) — We understand your challenges and identify what's worth automating": "On comprend vos enjeux et on identifie ce qui vaut le coup d'automatiser vs ce qui reste manuel. On ne vous vendra pas de l'IA à tout prix.",
    "Co-construction (4-8 weeks) — 1-2h/week sessions where we build together on your priority processes. You see every decision, we explain every choice. You gain skills in real-time on the latest tools.": "Sessions 1-2h/semaine où on build ensemble. Vous voyez chaque décision, on explique chaque choix technique. Vous montez en compétence en temps réel.",
    "Autonomy (go-live day) — Delivery + complete documentation. You can maintain and evolve without depending on us.": "Livraison + documentation complète. Vous pouvez maintenir et faire évoluer vos agents sans dépendre de nous.",
    "Continuous upgrade": "Upgrade continu",
    "Continuous upgrade (optional) — New tools released? We keep you informed.": "Nouveaux outils sortis ? On vous tient au courant. Vous gardez toujours une longueur d'avance.",
    "But agents, workflows, selfware adapted to your needs.": "Des agents, des workflows, du selfware adaptés à vos besoins."
}

for eng, fr in replacements.items():
    html = html.replace(eng, fr)

with open('professionnels-mock.html', 'w', encoding='utf-8') as f:
    f.write(html)
