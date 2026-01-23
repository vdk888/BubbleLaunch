import os
import glob

html_snippet = '''                <a href="https://substack.com/@bubbleinvest?utm_campaign=profile&utm_medium=profile-page" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Substack" data-handle="Bubble Invest">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M22.5 6H1.5V9H22.5V6ZM1.5 10.5V24L12 18L22.5 24V10.5H1.5ZM22.5 0H1.5V3H22.5V0Z" />
                  </svg>
                  <span class="social-handle" data-translate="footer.social.substack">Bubble Invest</span>
                </a>'''

root_dir = '/Users/jadethi-viet-lanhoang/Documents/GitHub/BubbleLaunch/src/frontend/pages'
files = glob.glob(os.path.join(root_dir, '**/*.html'), recursive=True)

count = 0
for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'substack.com' in content:
            print(f'Skipping {file_path}, already has substack link')
            continue
        
        if '<div class="social-media-links">' in content:
            print(f'Updating {file_path}')
            # Insert after the opening tag
            new_content = content.replace('<div class="social-media-links">', '<div class="social-media-links">\n' + html_snippet)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
        else:
            # check for single quotes?
            pass
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

print(f"Updated {count} files.")
