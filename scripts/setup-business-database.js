require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = '294cfc52-0644-80e0-9ea3-cbc2ce09112a';

async function setupBusinessDatabase() {
  console.log('🔧 Setting up Business Database properties...\n');

  try {
    // Update database schema with required properties
    const response = await notion.databases.update({
      database_id: databaseId,
      properties: {
        // 1. Nom (Title) - Should already exist, but let's ensure it
        'Nom': {
          title: {}
        },

        // 2. Email - Required for contact
        'Email': {
          email: {}
        },

        // 3. Profil - Required for categorization
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

        // 4. Commentaires - Required for storing form details
        'Commentaires': {
          rich_text: {}
        },

        // RECOMMENDED PROPERTIES FOR LEAD MANAGEMENT

        // 5. Statut - Pipeline tracking
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

        // 6. Date de soumission
        'Date de soumission': {
          date: {}
        },

        // 7. Budget estimé
        'Budget estimé': {
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

        // 8. Timeline
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

        // 9. Responsable
        'Responsable': {
          people: {}
        },

        // 10. Date de réponse
        'Date de réponse': {
          date: {}
        },

        // 11. Secteur
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

        // 12. Cas d'usage
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

        // 13. Source
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

        // 14. Notes internes
        'Notes internes': {
          rich_text: {}
        },

        // 15. Valeur potentielle
        'Valeur potentielle': {
          number: {
            format: 'euro'
          }
        },

        // 16. Taille entreprise
        'Taille entreprise': {
          select: {
            options: [
              { name: 'TPE (1-10)', color: 'gray' },
              { name: 'PME (11-250)', color: 'blue' },
              { name: 'ETI (251-5000)', color: 'green' },
              { name: 'Grande entreprise (5000+)', color: 'purple' }
            ]
          }
        }
      }
    });

    console.log('✅ Database properties configured successfully!\n');
    console.log('📋 Properties added:');
    console.log('   ✅ Nom (Title)');
    console.log('   ✅ Email');
    console.log('   ✅ Profil (with business option)');
    console.log('   ✅ Commentaires');
    console.log('   ✅ Statut (9 pipeline stages)');
    console.log('   ✅ Date de soumission');
    console.log('   ✅ Budget estimé (5 options)');
    console.log('   ✅ Timeline (4 urgency levels)');
    console.log('   ✅ Responsable');
    console.log('   ✅ Date de réponse');
    console.log('   ✅ Secteur (8 industries)');
    console.log('   ✅ Cas d\'usage (10 categories)');
    console.log('   ✅ Source (6 lead sources)');
    console.log('   ✅ Notes internes');
    console.log('   ✅ Valeur potentielle (€)');
    console.log('   ✅ Taille entreprise (4 sizes)');

    console.log('\n🔗 Database URL: https://www.notion.so/' + databaseId.replace(/-/g, ''));
    console.log('\n✨ Your business database is ready to receive leads!');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    throw error;
  }
}

setupBusinessDatabase();
