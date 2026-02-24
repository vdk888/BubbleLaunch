import re
from bs4 import BeautifulSoup

def process_file(filename, is_french=False):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    # Remove unwanted sections from homepage
    if 'homepage' in filename:
        for selector in ['.selfware', '.trust', '.waitlist']:
            for tag in soup.select(selector):
                tag.decompose()
                
    # We will do text replacement later...
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(str(soup))

files = ['homepage-mock-v4.html', 'particuliers-mock.html', 'professionnels-mock.html', 'a-propos-mock.html']
for f in files:
    try:
        process_file(f, is_french=True)
    except FileNotFoundError:
        pass
