import re
from bs4 import BeautifulSoup

def update_about():
    with open('about-mock-en.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')

    # Find the section to insert "Our Vision", "Our Philosophy", "Will to Empower"
    # Actually, about-mock-en.html has existing sections. Let's see if we can overwrite them.
    sections = soup.find_all('section')
    
    # 1. Vision
    if len(sections) > 1:
        sec = sections[1]
        h2 = sec.find('h2')
        if h2: h2.string = "Our Vision"
        h3 = sec.find('h3')
        if h3: h3.string = "A bridge between two economies"
        
        content = sec.find('div', class_='story-content')
        if content:
            ps = content.find_all('p', recursive=False)
            if len(ps) >= 2:
                ps[0].string = "AI and robotics are already transforming the economy — jobs, wealth, relationship to work. We don't claim to have all the answers or the best product, but we want to be a bridge between yesterday's economy and tomorrow's."
                ps[1].string = "In 10 years, we will have accompanied thousands of professionals (wealth managers, independents, SMBs, asset managers) in their transition to this new economy — while freely sharing our learnings with as many as possible."

    # 2. Philosophy
    # Create the section and insert it after Vision
    philosophy_html = """
<section class="philosophy" style="padding: 6rem 0; background: var(--bg-subtle);">
  <div class="container">
    <div class="section-header">
      <h2>Our Philosophy</h2>
      <h3>Irreversible time and authentic attention</h3>
    </div>
    
    <div class="philosophy-content" style="max-width: 800px; margin: 3rem auto 0; text-align: center;">
      <p style="font-size: 1.2rem; line-height: 1.8; color: var(--secondary); margin-bottom: 2rem;">
        "AI can produce content, code, images at near-zero marginal cost. What it cannot produce is the <strong>authentic investment of a finite human being in a gesture addressed to another</strong>.
      </p>
      
      <p style="font-size: 1.1rem; line-height: 1.7; color: var(--secondary); margin-bottom: 2rem;">
        When we spend time with a client, when we write an article, when we build an agent together — that time is consumed, irreversible, lost to everything else. <strong>That's what we offer. Not deliverables. Life time.</strong>
      </p>
      
      <blockquote style="border-left: 3px solid var(--purple); padding-left: 1.5rem; margin: 2rem 0; text-align: left; font-style: italic;">
        "An AI cannot *choose* not to respond to you — and it is precisely this impossibility that empties its attention of what would make it precious."
        <footer style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--muted);">— Inspired by Sartre</footer>
      </blockquote>
    </div>
  </div>
</section>
"""
    
    # 3. Will to Empower
    empower_html = """
<section class="empowerment" style="padding: 6rem 0;">
  <div class="container">
    <div class="section-header">
      <h2>Will to Empower</h2>
    </div>
    
    <div class="empower-quote" style="text-align: center; margin-top: 2rem; padding: 2rem; background: var(--bg-subtle); border-radius: 12px;">
      <p style="font-size: 1.3rem; font-weight: 500; color: var(--primary);">
        "Where the consulting industry thrives on your dependency, <br>
        we thrive on your emancipation."
      </p>
    </div>
  </div>
</section>
"""

    if len(sections) > 1:
        new_philosophy = BeautifulSoup(philosophy_html, 'html.parser')
        new_empower = BeautifulSoup(empower_html, 'html.parser')
        sections[1].insert_after(new_philosophy)
        sections[1].insert_after(new_empower) # will be placed between Vision and Philosophy

    with open('about-mock-en.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))

if __name__ == '__main__':
    update_about()
