import re
from bs4 import BeautifulSoup

def clean(text):
    return re.sub(r'\s+', ' ', text).strip()

def audit_file(filename):
    print(f"\n--- {filename} ---")
    with open(filename, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    
    # exclude script and style
    for script_or_style in soup(['script', 'style']):
        script_or_style.decompose()

    texts = set()
    for text_node in soup.find_all(string=True):
        cleaned = clean(text_node)
        if len(cleaned) > 2 and not cleaned.isnumeric():
            texts.add(cleaned)
            
    for t in sorted(list(texts)):
        print(t)

for f in ['homepage-mock-v4.html', 'particuliers-mock.html', 'professionnels-mock.html', 'a-propos-mock.html']:
    audit_file(f)
