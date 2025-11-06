#!/bin/bash

# Bubble Project Migration Script
# This script moves files to the new organized structure

echo "Starting Bubble project migration..."

# Base directory
BASE_DIR="/Users/jadethi-viet-lanhoang/Library/Mobile Documents/com~apple~CloudDocs/Bubble invest/BubbleLaunch"
cd "$BASE_DIR"

# Frontend files
echo "Moving frontend files..."
mv index.html src/frontend/pages/
mv styles.css src/frontend/assets/styles/
mv bubble-favicon.svg src/frontend/assets/images/
mv bubble-logo-single.svg src/frontend/assets/images/
mv animations.js src/frontend/js/
mv charts.js src/frontend/js/
mv chatbot-animations.js src/frontend/js/
mv chatbot-logic.js src/frontend/js/
mv floating-bubble.js src/frontend/js/
mv mini-chat.js src/frontend/js/
mv script.js src/frontend/js/
mv translations.js src/frontend/i18n/

# Backend files
echo "Moving backend files..."
mv server.js src/backend/

# Documentation files
echo "Moving documentation files..."
mv CLAUDE.md docs/technical/
mv "Charte Graphique Bubble.md" "docs/company/Charte Graphique Bubble.md"
mv Elevatorpitch5min.md docs/company/
mv "PointsdeDépartStratégiquesBubble.md" docs/company/
mv mission_texte.txt docs/company/
mv a-practical-guide-to-building-agents.md docs/references/
mv a-practical-guide-to-building-agents.pdf docs/references/
mv REORGANIZATION_PLAN.md docs/technical/

# Scripts
echo "Moving scripts..."
mv pdf_to_markdown.py scripts/

# Clean up temporary file
if [ -f "chatbot-animations.js.new" ]; then
    mkdir -p archive/frontend/backups
    mv chatbot-animations.js.new archive/frontend/backups/
fi

echo "Migration complete!"
echo "Next steps: Update file paths in code files"
