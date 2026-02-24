import glob
import os

css_fix = """
    /* --- Fix CTA button visibility on dark backgrounds --- */
    .b2b-section .btn-primary,
    .final-cta .btn-primary,
    .will-to-empower .btn-primary,
    .waitlist-section .btn-primary {
      background: white;
      color: var(--primary);
      border: 1px solid white;
    }
    
    .b2b-section .btn-primary:hover,
    .final-cta .btn-primary:hover,
    .will-to-empower .btn-primary:hover,
    .waitlist-section .btn-primary:hover {
      background: var(--purple);
      color: white;
      border-color: var(--purple);
      transform: translateY(-2px);
    }
    
    .b2b-section .btn-secondary,
    .final-cta .btn-secondary,
    .will-to-empower .btn-secondary,
    .waitlist-section .btn-secondary {
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    
    .b2b-section .btn-secondary:hover,
    .final-cta .btn-secondary:hover,
    .will-to-empower .btn-secondary:hover,
    .waitlist-section .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border-color: white;
    }
"""

html_files = [
    'homepage-mock-v4.html',
    'homepage-mock-v4-en.html',
    'particuliers-mock.html',
    'individuals-mock-en.html',
    'professionnels-mock.html',
    'professionals-mock-en.html',
    'a-propos-mock.html',
    'about-mock-en.html'
]

for file in html_files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if '/* --- Fix CTA button visibility on dark backgrounds --- */' not in content:
            content = content.replace('</style>', css_fix + '</style>')
            
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
        print(f"Fixed CSS in {file}")
