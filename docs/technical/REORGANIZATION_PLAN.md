# Bubble Project Reorganization Plan

## Current Issues
- All files mixed in root directory (frontend, backend, docs, assets)
- No clear separation of concerns
- Difficult to scale for future features (user accounts, API, multiple pages)
- Static assets mixed with application code

## Proposed Structure

```
BubbleLaunch/
├── src/                          # Source code
│   ├── frontend/                 # Frontend application
│   │   ├── assets/              # Static assets
│   │   │   ├── images/          # Images and logos
│   │   │   │   ├── bubble-favicon.svg
│   │   │   │   └── bubble-logo-single.svg
│   │   │   └── styles/          # CSS files
│   │   │       └── styles.css
│   │   ├── js/                  # JavaScript files
│   │   │   ├── animations.js
│   │   │   ├── charts.js
│   │   │   ├── chatbot-animations.js
│   │   │   ├── chatbot-logic.js
│   │   │   ├── floating-bubble.js
│   │   │   ├── mini-chat.js
│   │   │   └── script.js
│   │   ├── i18n/                # Internationalization
│   │   │   └── translations.js
│   │   └── pages/               # HTML pages
│   │       └── index.html
│   │
│   └── backend/                  # Backend application
│       ├── server.js            # Main server file
│       ├── routes/              # API routes (future)
│       ├── controllers/         # Route controllers (future)
│       ├── models/              # Data models (future)
│       ├── services/            # Business logic (future)
│       └── middleware/          # Express middleware (future)
│
├── docs/                         # Documentation
│   ├── company/                 # Company documents
│   │   ├── Charte Graphique Bubble.md
│   │   ├── Elevatorpitch5min.md
│   │   ├── PointsdeDépartStratégiquesBubble.md
│   │   └── mission_texte.txt
│   ├── technical/               # Technical docs
│   │   ├── CLAUDE.md
│   │   └── REORGANIZATION_PLAN.md
│   └── references/              # Reference materials
│       ├── a-practical-guide-to-building-agents.md
│       └── a-practical-guide-to-building-agents.pdf
│
├── scripts/                      # Utility scripts
│   └── pdf_to_markdown.py
│
├── config/                       # Configuration files (future)
│   ├── database.js              # Database config (future)
│   └── environment.js           # Environment config (future)
│
├── tests/                        # Test files (future)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/                       # Public static files (future)
│   └── (files served directly)
│
├── backup/                       # Backup files
│   ├── index.html
│   └── translations.js
│
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── package.json                 # Node dependencies
├── package-lock.json
├── replit.nix                   # Replit configuration
└── README.md                    # Project readme (to create)
```

## File Mapping (Current → New Location)

### Frontend Files
- `index.html` → `src/frontend/pages/index.html`
- `styles.css` → `src/frontend/assets/styles/styles.css`
- `bubble-favicon.svg` → `src/frontend/assets/images/bubble-favicon.svg`
- `bubble-logo-single.svg` → `src/frontend/assets/images/bubble-logo-single.svg`
- `animations.js` → `src/frontend/js/animations.js`
- `charts.js` → `src/frontend/js/charts.js`
- `chatbot-animations.js` → `src/frontend/js/chatbot-animations.js`
- `chatbot-logic.js` → `src/frontend/js/chatbot-logic.js`
- `floating-bubble.js` → `src/frontend/js/floating-bubble.js`
- `mini-chat.js` → `src/frontend/js/mini-chat.js`
- `script.js` → `src/frontend/js/script.js`
- `translations.js` → `src/frontend/i18n/translations.js`

### Backend Files
- `server.js` → `src/backend/server.js`

### Documentation
- `CLAUDE.md` → `docs/technical/CLAUDE.md`
- `Charte Graphique Bubble.md` → `docs/company/Charte Graphique Bubble.md`
- `Elevatorpitch5min.md` → `docs/company/Elevatorpitch5min.md`
- `PointsdeDépartStratégiquesBubble.md` → `docs/company/PointsdeDépartStratégiquesBubble.md`
- `mission_texte.txt` → `docs/company/mission_texte.txt`
- `a-practical-guide-to-building-agents.md` → `docs/references/a-practical-guide-to-building-agents.md`
- `a-practical-guide-to-building-agents.pdf` → `docs/references/a-practical-guide-to-building-agents.pdf`

### Scripts
- `pdf_to_markdown.py` → `scripts/pdf_to_markdown.py`

### Other Files
- `chatbot-animations.js.new` → Can be removed or moved to backup
- `helpers/` → Keep as is (contains separate project)
- `attached_assets/` → Keep as is (contains screenshots/notes)

## Benefits of This Structure

1. **Separation of Concerns**: Clear separation between frontend, backend, and documentation
2. **Scalability**: Easy to add new features, pages, and API endpoints
3. **Maintainability**: Organized structure makes it easier to find and update files
4. **Future-Ready**: Pre-defined folders for future features (routes, models, tests, etc.)
5. **Professional**: Standard structure used by production Node.js/Express applications

## Next Steps After Reorganization

1. Update all file paths in:
   - `server.js` (static file serving, document loading)
   - `index.html` (script and style references)
   - JavaScript files (any relative imports)

2. Update `package.json` scripts if needed

3. Create a proper README.md

4. Set up proper build process for production deployment

5. Consider adding:
   - ESLint configuration
   - Prettier configuration
   - Jest for testing
   - Webpack or Vite for bundling
   - TypeScript for type safety