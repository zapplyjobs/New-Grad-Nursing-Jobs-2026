/**
 * New-Grad-Nursing-Jobs-2026 Configuration
 *
 * Purpose: Per-repo customization for shared job board library
 * Version: 1.0 (2026-02-12)
 *
 * Template Variables:
 * - {totalCompanies} - Replaced with unique company count
 * - {currentJobs} - Replaced with active job count
 */

module.exports = {
  // Schema version
  version: 1,

  // Image configuration
  repoPrefix: 'nsj',
  headingImageAlt: 'Nursing Jobs 2026 - Illustration of healthcare professionals.',

  // Branding text
  title: 'Nursing Jobs 2026',
  tagline: '',  // No tagline for SEO repos

  // Description paragraphs (with template variables)
  descriptionLine1: '🚀 Real-time nursing, healthcare, and medical jobs from {totalCompanies}+ top companies and healthcare facilities. Updated every 15 minutes with {currentJobs}+ fresh opportunities for new nursing graduates, nursing students, and entry-level nurses.',
  descriptionLine2: '🎯 Includes roles across tech giants, fast-growing startups, and engineering-first companies like Chewy, CACI, and TD Bank.',

  // Note box
  noteType: 'TIP',
  noteText: '🛠 Help us grow! Add new jobs by submitting an issue! View contributing steps [here](CONTRIBUTING-GUIDE.md).',

  // Section headers
  jobsSectionHeader: 'Fresh Nursing Jobs 2026',

  // Feature flags
  features: {
    internships: false,
    moreResources: true
  },

  // Job categorization
  defaultCategory: 'registered_nurse'
};
