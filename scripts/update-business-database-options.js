require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = '294cfc52-0644-80e0-9ea3-cbc2ce09112a';

async function updateDatabaseOptions() {
  console.log('🔧 Updating Business Database select options...\n');

  try {
    // Update database with additional properties and options
    const response = await notion.databases.update({
      database_id: databaseId,
      properties: {
        // Update Profil to include 'business' option
        'Profil': {
          select: {
            options: [
              { name: 'business', color: 'blue' },
              { name: 'individual', color: 'gray' },
              { name: 'investor', color: 'green' },
              { name: 'professional', color: 'purple' },
              { name: 'other', color: 'default' }
            ]
          }
        },

        // Update Statut with all pipeline stages
        'Statut': {
          select: {
            options: [
              { name: '🆕 Nouveau', color: 'default' },
              { name: '👁️ En révision', color: 'yellow' },
              { name: '📞 Premier contact', color: 'blue' },
              { name: '💬 En discussion', color: 'purple' },
              { name: '📝 Devis envoyé', color: 'pink' },
              { name: '✅ Converti', color: 'green' },
              { name: '❌ Refusé', color: 'red' },
              { name: '⏸️ En attente', color: 'gray' },
              { name: '🗑️ Perdu', color: 'red' }
            ]
          }
        },

        // Update Budget range
        'Budget range': {
          select: {
            options: [
              { name: '€3k-€5k', color: 'gray' },
              { name: '€8k-€12k', color: 'blue' },
              { name: '€20k-€30k', color: 'green' },
              { name: '€30k+', color: 'purple' },
              { name: 'Non spécifié', color: 'default' }
            ]
          }
        },

        // Update Timeline
        'Timeline': {
          select: {
            options: [
              { name: '🔥 Urgent (< 1 mois)', color: 'red' },
              { name: '⚡ Prochainement (1-3 mois)', color: 'orange' },
              { name: '📅 En planification (3-6 mois)', color: 'yellow' },
              { name: '🔍 En exploration (6+ mois)', color: 'gray' }
            ]
          }
        },

        // Add recommended properties
        'Date de réponse': {
          date: {}
        },

        'Secteur': {
          select: {
            options: [
              { name: 'Fintech', color: 'blue' },
              { name: 'Asset Management', color: 'green' },
              { name: 'Banque', color: 'purple' },
              { name: 'Assurance', color: 'pink' },
              { name: 'Private Equity', color: 'orange' },
              { name: 'Family Office', color: 'yellow' },
              { name: 'Autre finance', color: 'gray' },
              { name: 'Non-finance', color: 'default' }
            ]
          }
        },

        'Cas d\'usage': {
          multi_select: {
            options: [
              { name: 'Réconciliation bancaire', color: 'blue' },
              { name: 'Reporting automatisé', color: 'green' },
              { name: 'Dashboard de gestion', color: 'purple' },
              { name: 'Compliance / KYC', color: 'red' },
              { name: 'Trading automation', color: 'orange' },
              { name: 'Client onboarding', color: 'pink' },
              { name: 'Document processing', color: 'yellow' },
              { name: 'Chatbot / Support', color: 'blue' },
              { name: 'Analyse de risque', color: 'red' },
              { name: 'Autre', color: 'gray' }
            ]
          }
        },

        'Source': {
          select: {
            options: [
              { name: 'Site web - /businesses', color: 'blue' },
              { name: 'Référence client', color: 'green' },
              { name: 'LinkedIn', color: 'purple' },
              { name: 'Conférence', color: 'orange' },
              { name: 'Email direct', color: 'pink' },
              { name: 'Autre', color: 'gray' }
            ]
          }
        },

        'Notes internes': {
          rich_text: {}
        },

        'Valeur potentielle': {
          number: {
            format: 'euro'
          }
        },

        'Taille entreprise': {
          select: {
            options: [
              { name: 'TPE (1-10)', color: 'gray' },
              { name: 'PME (11-250)', color: 'blue' },
              { name: 'ETI (251-5000)', color: 'green' },
              { name: 'Grande entreprise (5000+)', color: 'purple' }
            ]
          }
        },

        'Responsable': {
          people: {}
        }
      }
    });

    console.log('✅ Database options updated successfully!\n');
    console.log('📋 Updated/Added properties:');
    console.log('   ✅ Profil - Added "business" option');
    console.log('   ✅ Statut - All 9 pipeline stages configured');
    console.log('   ✅ Budget range - All 5 budget options');
    console.log('   ✅ Timeline - All 4 urgency levels');
    console.log('   ✅ Date de réponse - Added');
    console.log('   ✅ Secteur - 8 industry options');
    console.log('   ✅ Cas d\'usage - 10 use case categories');
    console.log('   ✅ Source - 6 lead source options');
    console.log('   ✅ Notes internes - Added');
    console.log('   ✅ Valeur potentielle - Added (€ format)');
    console.log('   ✅ Taille entreprise - 4 company sizes');
    console.log('   ✅ Responsable - Added (person field)');

    console.log('\n🔗 Database URL: https://www.notion.so/' + databaseId.replace(/-/g, ''));
    console.log('\n✨ Your business database is fully configured!');
    console.log('\n📝 Next: Test the form at http://localhost:3000/businesses');

  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    throw error;
  }
}

updateDatabaseOptions();
