import re

with open('a-propos-mock.html', 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    "Automating is not an end in itself. It's a means to free up time for what really matters.": "Automatiser n'est pas une fin en soi. C'est un moyen de libérer du temps pour ce qui compte vraiment.",
    "What we do at Bubble: we automate the repetitive so you can dedicate your irreversible time to what has value — your clients, your team, your loved ones.": "Ce qu'on fait chez Bubble : on automatise le répétitif pour que vous puissiez consacrer votre temps irréversible à ce qui a de la valeur — vos clients, votre équipe, vos proches.",
    "Why We Automate": "Pourquoi on automatise"
}

for eng, fr in replacements.items():
    html = html.replace(eng, fr)

with open('a-propos-mock.html', 'w', encoding='utf-8') as f:
    f.write(html)
