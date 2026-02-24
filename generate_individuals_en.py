import re
from bs4 import BeautifulSoup

def update_individuals():
    with open('individuals-mock-en.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    
    # Hero
    hero = soup.find('section', class_='hero')
    if hero:
        h1 = hero.find('h1')
        if h1: h1.string = "Our Investment Agent — An Open POC"
        
        p = hero.find('p', class_='hero-subtitle')
        if p: p.string = "We built an AI agent for ourselves using OpenClaw and code. We share how it works — technical stack, prompts, limits — so you can reproduce it, for your investments or your projects."

    # Stack Section (adding if not exists)
    sections = soup.find_all('section')
    
    # Let's see if we can find the section to insert after
    # We will search for a section that contains "How it's built"
    stack_found = soup.find(string=re.compile("How it's built"))
    if not stack_found:
        # English copy:
        # How it's built
        # 100% transparent — our technical stack
        # 
        # 🛠️ OpenClaw & MCP
        # Agent orchestration via Model Context Protocol.
        # We show you how to configure your own MCP servers.
        #
        # 💻 Code with AI
        # We don't code alone — we use Claude, Kimi, Cursor as co-pilots.
        # We share our prompts and development workflows.
        #
        # 📊 APIs & Data
        # Broker connections, vector databases for memory,
        # secure storage. We explain every technical choice.
        #
        # 🔍 The limits (we don't hide)
        # API latency, unexpected costs, edge cases that break.
        # We also show what doesn't work yet.
        
        stack_html = """
<section class="stack-reveal" style="padding: 4rem 0; background: var(--bg-subtle);">
  <div class="container">
    <div class="section-header">
      <h2>How it's built</h2>
      <h3>100% transparent — our technical stack</h3>
    </div>
    
    <div class="stack-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 3rem;">
      
      <div class="stack-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-size: 2rem; margin-bottom: 1rem;">🛠️</div>
        <h4>OpenClaw & MCP</h4>
        <p style="color: var(--secondary); font-size: 0.9rem; margin-top: 0.5rem;">
          Agent orchestration via Model Context Protocol. We show you how to configure your own MCP servers.
        </p>
      </div>
      
      <div class="stack-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-size: 2rem; margin-bottom: 1rem;">💻</div>
        <h4>Code with AI</h4>
        <p style="color: var(--secondary); font-size: 0.9rem; margin-top: 0.5rem;">
          We don't code alone — we use Claude, Kimi, Cursor as co-pilots. We share our prompts and development workflows.
        </p>
      </div>
      
      <div class="stack-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-size: 2rem; margin-bottom: 1rem;">📊</div>
        <h4>APIs & Data</h4>
        <p style="color: var(--secondary); font-size: 0.9rem; margin-top: 0.5rem;">
          Broker connections, vector databases for memory, secure storage. We explain every technical choice.
        </p>
      </div>
      
      <div class="stack-card" style="background: white; padding: 2rem; border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-size: 2rem; margin-bottom: 1rem;">🔍</div>
        <h4>The limits (we don't hide)</h4>
        <p style="color: var(--secondary); font-size: 0.9rem; margin-top: 0.5rem;">
          API latency, unexpected costs, edge cases that break. We also show what doesn't work yet.
        </p>
      </div>
      
    </div>
  </div>
</section>
"""
        agent_demo = soup.find('section', class_='agent-demo')
        if agent_demo:
            new_section = BeautifulSoup(stack_html, 'html.parser')
            agent_demo.insert_after(new_section)

    with open('individuals-mock-en.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))

if __name__ == '__main__':
    update_individuals()
