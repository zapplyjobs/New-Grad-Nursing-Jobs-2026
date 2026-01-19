const fs = require("fs");
const companyCategory = require("./nursing.json");
const {
 companies,
 ALL_COMPANIES,
 getCompanyEmoji,
 getCompanyCareerUrl,
 formatTimeAgo,
 getExperienceLevel,
 getJobCategory,
 formatLocation,
 normalizeCompanyName,
 isJobOlderThanWeek,
} = require("./utils");

// Filter jobs by age - jobs posted within last 7 days are "current", older ones are "archived"
function filterJobsByAge(allJobs) {
  const currentJobs = [];
  const archivedJobs = [];

  allJobs.forEach((job) => {
    if (isJobOlderThanWeek(job.job_posted_at)) {
      archivedJobs.push(job);
    } else {
      currentJobs.push(job);
    }
  });

  console.log(`📅 Filtered: ${currentJobs.length} current (≤7 days), ${archivedJobs.length} archived (>7 days)`);
  return { currentJobs, archivedJobs };
}

// Filter out senior positions - only keep Entry-Level and Mid-Level
function filterOutSeniorPositions(jobs) {
  return jobs.filter(job => {
    const level = getExperienceLevel(job.job_title, job.job_description);
    return level !== "Senior";
  });
}

function generateJobTable(jobs) {
 console.log(
  `🔍 DEBUG: Starting generateJobTable with ${jobs.length} total jobs`
 );

// ADD THESE 2 LINES:
 jobs = filterOutSeniorPositions(jobs);
 console.log(`🔍 DEBUG: After filtering seniors: ${jobs.length} jobs remaining`);

if (jobs.length === 0) {
  return `| Company | Role | Location | Level | Apply Now | Age |
|---------|------|----------|-------|-----------|-----|
| *No current openings* | *Check back tomorrow* | *-* | *-* | *-* | *-* |`;
}

 // Create a map of lowercase company names to actual names for case-insensitive matching
 const companyNameMap = new Map();
 Object.entries(companyCategory).forEach(([categoryKey, category]) => {
  // Added safety check for category.companies to prevent iteration errors
  if (Array.isArray(category.companies)) {
   category.companies.forEach((company) => {
    companyNameMap.set(company.toLowerCase(), {
     name: company,
     category: categoryKey,
     categoryTitle: category.title,
    });
   });
  }
 });

 console.log(`🏢 DEBUG: Configured companies by category:`);
 Object.entries(companyCategory).forEach(([categoryKey, category]) => {
  console.log(
   ` ${category.emoji} ${category.title}: ${category.companies?.join(", ") || 'No companies configured'}`
  );
 });

 // Get unique companies from job data
 const uniqueJobCompanies = [...new Set(jobs.map((job) => job.employer_name))];
 console.log(
  `\n📊 DEBUG: Unique companies found in job data (${uniqueJobCompanies.length}):`,
  uniqueJobCompanies
 );

 // Group jobs by company - only include jobs from valid companies
 const jobsByCompany = {};
 const processedCompanies = new Set();
 const skippedCompanies = new Set();

 jobs.forEach((job) => {
  // Normalize company name first (e.g., 'HSHS' -> 'Hospital Sisters Health System')
  const normalizedCompanyName = normalizeCompanyName(job.employer_name);
  const employerNameLower = normalizedCompanyName.toLowerCase();
  const matchedCompany = companyNameMap.get(employerNameLower);

  // Only process jobs from companies in our category list
  if (matchedCompany) {
   console.log(
    `✅ MATCH: "${job.employer_name}" -> "${normalizedCompanyName}" in category "${matchedCompany.categoryTitle}" as "${matchedCompany.name}"`
   );
   processedCompanies.add(normalizedCompanyName);
   if (!jobsByCompany[matchedCompany.name]) {
    jobsByCompany[matchedCompany.name] = [];
   }
   jobsByCompany[matchedCompany.name].push(job);
  } else {
   // Debug: Check if this is a company name normalization issue
   console.log(`❌ NO MATCH: "${job.employer_name}" -> "${normalizedCompanyName}" (not found in nursing.json categories)`);
   console.log(`   Looking for: "${employerNameLower}"`);
   console.log(`   Available companies:`, [...companyNameMap.keys()]);
   skippedCompanies.add(job.employer_name);
  }
 });

 console.log(`\n✅ DEBUG: Companies INCLUDED (${processedCompanies.size}):`, [
  ...processedCompanies,
 ]);
 console.log(`\n❌ DEBUG: Companies SKIPPED (${skippedCompanies.size}):`, [
  ...skippedCompanies,
 ]);

 // New: Summarize configured companies that ended up with zero jobs after filtering
 console.log("\n📋 DEBUG: Category coverage summary (configured vs with jobs vs zero jobs)");
 Object.entries(companyCategory).forEach(([categoryKey, categoryData]) => {
  const configured = categoryData.companies || [];
  const withJobs = configured.filter((c) => jobsByCompany[c] && jobsByCompany[c].length > 0);
  const zeroJobs = configured.filter((c) => !withJobs.includes(c));
  console.log(
   ` 🗂️ ${categoryData.title}: configured=${configured.length}, withJobs=${withJobs.length}, zeroJobs=${zeroJobs.length}`
  );
  if (zeroJobs.length > 0) {
   console.log(`   ↪️ Configured but zero jobs:`, zeroJobs);
  }
 });

 // Log job counts by company
 console.log(`\n📈 DEBUG: Job counts by company:`);
 Object.entries(jobsByCompany).forEach(([company, jobs]) => {
  const companyInfo = companyNameMap.get(company.toLowerCase());
  console.log(
   ` ${company}: ${jobs.length} jobs (Category: ${
    companyInfo?.categoryTitle || "Unknown"
   })`
  );
 });

 let output = "";

 // Handle each category
 Object.entries(companyCategory).forEach(([categoryKey, categoryData]) => {
  // Filter companies that actually have jobs
  const companiesWithJobs = (categoryData.companies || []).filter(
   (company) => jobsByCompany[company] && jobsByCompany[company].length > 0
  );

  const companiesZeroJobs = (categoryData.companies || []).filter(
   (company) => !companiesWithJobs.includes(company)
  );

  console.log(
   `\n📦 DEBUG: Category "${categoryData.title}" configured companies:`,
   categoryData.companies || []
  );
  console.log(
   `📥 DEBUG: Category "${categoryData.title}" companies WITH jobs:`,
   companiesWithJobs
  );
  console.log(
   `📭 DEBUG: Category "${categoryData.title}" companies with ZERO jobs:`,
   companiesZeroJobs
  );

  if (companiesWithJobs.length > 0) {
   const totalJobs = companiesWithJobs.reduce(
    (sum, company) => sum + jobsByCompany[company].length,
    0
   );

   console.log(
    `\n📝 DEBUG: Processing category "${categoryData.title}" with ${companiesWithJobs.length} companies and ${totalJobs} total jobs:`
   );
   companiesWithJobs.forEach((company) => {
    console.log(` - ${company}: ${jobsByCompany[company].length} jobs`);
   });

   // Use singular/plural based on job count
   const positionText = totalJobs === 1 ? "position" : "positions";
   output += `### ${categoryData.emoji} **${categoryData.title}** (${totalJobs} ${positionText})\n\n`;

   // Handle ALL companies with their own sections (regardless of job count)
   companiesWithJobs.forEach((companyName) => {
    const companyJobs = jobsByCompany[companyName];
    const emoji = getCompanyEmoji(companyName);
    const positionText =
     companyJobs.length === 1 ? "position" : "positions";

    // Use collapsible details for companies with more than 15 jobs
    if (companyJobs.length > 15) {
     output += `<details>\n`;
     output += `<summary><h4>${emoji} <strong>${companyName}</strong> (${companyJobs.length} ${positionText})</h4></summary>\n\n`;
    } else {
     output += `#### ${emoji} **${companyName}** (${companyJobs.length} ${positionText})\n\n`;
    }

    output += `| Role | Location | Level | Apply Now | Age |\n`;
    output += `|------|----------|-------|-----------|-----|\n`;

    companyJobs.forEach((job) => {
      const role = job.job_title;
      const location = formatLocation(job.job_city, job.job_state);
      const posted = job.job_posted_at;
      const applyLink =
        job.job_apply_link || getCompanyCareerUrl(job.employer_name);

      // Get experience level and create badge
      const level = getExperienceLevel(job.job_title, job.job_description);
      let levelBadge = '';
      if (level === 'Entry-Level') {
        levelBadge = '![Entry](https://img.shields.io/badge/Entry-00C853)';
      } else if (level === 'Mid-Level') {
        levelBadge = '![Mid](https://img.shields.io/badge/-Mid-blue "Mid-Level")';
      } else if (level === 'Senior') {
        levelBadge = '![Senior](https://img.shields.io/badge/Senior-FF5252)';
      } else {
        levelBadge = '![Unknown](https://img.shields.io/badge/Unknown-9E9E9E)';
      }

      let statusIndicator = "";
      const description = (job.job_description || "").toLowerCase();
      if (
        description.includes("no sponsorship") ||
        description.includes("us citizen")
      ) {
        statusIndicator = " 🇺🇸";
      }
      if (description.includes("remote")) {
        statusIndicator += " 🏠";
      }

      output += `| ${role}${statusIndicator} | ${location} | ${levelBadge} | [<img src="images/apply.png" width="75" alt="Apply">](${applyLink}) | ${posted} |\n`;
    });

    if (companyJobs.length > 15) {
     output += `\n</details>\n\n`;
    } else {
     output += "\n";
    }
   });
  }
 });

 console.log(
  `\n🎉 DEBUG: Finished generating job table with ${
   Object.keys(jobsByCompany).length
  } companies processed`
 );
 return output;
}


function generateArchivedSection(archivedJobs, stats) {
 if (archivedJobs.length === 0) {
  return "";
 }

 // The old FAANG logic that could crash is safely commented out or removed.

 const archivedJobTable = generateJobTable(archivedJobs);

 return `<details>
<summary><h2>📁 <strong>Archived Data Jobs – ${archivedJobs.length} (7+ days old)</strong> - Click to Expand</h2></summary>

Either still hiring or useful for research.

### **Archived Job Stats**

📁 **Total Jobs:** ${archivedJobs.length} positions
🏢 **Companies:** ${Object.keys(stats?.totalByCompany || {}).length} companies


${archivedJobTable}

</details>`;
}

async function generateReadme(currentJobs, archivedJobs = [], internshipData = null, stats = null) {
 const currentDate = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
 });

 // Calculate actual displayed jobs (only from companies in nursing.json)
 const companyNameMap = new Map();
 Object.entries(companyCategory).forEach(([categoryKey, category]) => {
   if (Array.isArray(category.companies)) {
     category.companies.forEach((company) => {
       companyNameMap.set(company.toLowerCase(), company);
     });
   }
 });

 const displayedJobs = currentJobs.filter(job => {
   const normalizedName = normalizeCompanyName(job.employer_name);
   return companyNameMap.has(normalizedName.toLowerCase());
 });

// ADD THIS LINE:
 const filteredJobs = filterOutSeniorPositions(displayedJobs);

 const displayedJobCount = displayedJobs.length;
 const totalCompanies = [...new Set(displayedJobs.map(j => normalizeCompanyName(j.employer_name)))].length;

 const jobTable = generateJobTable(currentJobs);
 const archivedSection = generateArchivedSection(archivedJobs, stats);

 return `<div align="center">

<!-- Banner -->
<img src="images/nsj-heading.png" alt="Nursing Jobs 2026 - Illustration of people working in nursing.">

# Nursing Jobs 2026

<br>

<!-- Row 1: Job Stats (Custom Static Badges) -->
![Total Jobs](https://img.shields.io/badge/Total_Jobs-${displayedJobCount}-brightgreen?style=flat&logo=briefcase)
![Companies](https://img.shields.io/badge/Companies-${totalCompanies}-blue?style=flat&logo=building)
![Updated](https://img.shields.io/badge/Updated-Every_15_Minutes-orange?style=flat&logo=calendar)

</div>

<p align="center">🚀 Real-time nursing, healthcare, and medical job listings from ${totalCompanies}+ top institutions like Mayo Clinic, Cleveland Clinic, and Johns Hopkins Medicine. Updated every 24 hours with ${displayedJobCount}+ fresh opportunities for new graduates in registered nursing, allied health, and pharma.</p>

<p align="center">🎯 Includes roles across trusted organizations like Mass General Brigham, Kaiser Permanente, and NewYork-Presbyterian Hospital.</p>

> [!TIP]
> 🛠  Help us grow! Add new jobs by submitting an issue! View [contributing steps](CONTRIBUTING.md) here.

---

## Website & Autofill Extension

<img src="images/zapply.png" alt="Apply to jobs in seconds with Zapply.">

Explore Zapply's website and check out:

- Our chrome extension that auto-fills your job applications in seconds.
- A dedicated job board with the latest jobs for various types of roles.
- User account providing multiple profiles for different resume roles.
- Job application tracking with streaks to unlock commitment awards.

Experience an advanced career journey with us! 🚀

<p align="center">
  <a href="https://zapply.jobs/"><img src="images/zapply-button.png" alt="Visit Our Website" width="300"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href=""><img src="images/extension-button.png" alt="Install Our Extension - Coming Soon" width="300"></a>
</p>

---

## Explore Around

<img src="images/connect.png" alt="Explore Around">

Check out what we're doing on our socials, join our community to connect with fellow job seekers, get career advice, keep a lookout for free templates, and stay updated on the latest opportunities.

<p align="center">
  <a href="https://discord.gg/UswBsduwcD"><img src="images/socials-discord.png" alt="Discord" height="50"></a>
  &nbsp;&nbsp;
  <a href="https://www.instagram.com/zapplyjobs"><img src="images/socials-instagram.png" alt="Instagram" height="50"></a>
  &nbsp;&nbsp;
  <a href="https://www.tiktok.com/@zapplyjobs"><img src="images/socials-tiktok.png" alt="TikTok" height="50"></a>
  &nbsp;&nbsp;
  <a href="https://www.linkedin.com/company/zapply-jobs/"><img src="images/socials-linkedin.png" alt="LinkedIn" height="50"></a>
  &nbsp;&nbsp;
  <a href="https://www.reddit.com/r/Zapply/"><img src="images/socials-reddit.png" alt="Reddit" height="50"></a>
</p>

---

## Fresh Nursing Jobs 2026

<img src="images/nsj-listings.png" alt="Fresh 2026 job listings (under 1 week).">

${generateJobTable(currentJobs)}

---

## More Resources

Check out our other repos for jobs and free resources:

<p align="center">
  <a href="https://github.com/zapplyjobs/New-Grad-Software-Engineering-Jobs-2026"><img src="images/repo-sej.png" alt="Software Engineering Jobs" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/New-Grad-Data-Science-Jobs-2026"><img src="images/repo-dsj.png" alt="Data Science Jobs" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/New-Grad-Hardware-Engineering-Jobs-2026"><img src="images/repo-hej.png" alt="Hardware Engineering Jobs" height="40"></a>
</p>
<p align="center">
  <a href="https://github.com/zapplyjobs/New-Grad-Jobs-2026"><img src="images/repo-ngj.png" alt="New Grad Jobs" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/resume-samples-2026"><img src="images/repo-rss.png" alt="Resume Samples" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/interview-handbook-2026"><img src="images/repo-ihb.png" alt="Interview Handbook" height="40"></a>
</p>
<p align="center">
  <a href="https://github.com/zapplyjobs/Internships-2026"><img src="images/repo-int.png" alt="Internships 2026" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/Research-Internships-for-Undergraduates"><img src="images/repo-rifu.png" alt="Research Internships" height="40"></a>
  &nbsp;&nbsp;
  <a href="https://github.com/zapplyjobs/underclassmen-internships"><img src="images/repo-uci.png" alt="Underclassmen Internships" height="40"></a>
</p>

---

## Become a Contributor

<img src="images/contributor.png" alt="Become a Contributor">

Add new jobs to our listings keeping in mind the following:

- Located in the US, Canada, or Remote.
- Openings are currently accepting applications and not older than 1 week.
- Create a new issue to submit different job positions.
- Update a job by submitting an issue with the job URL and required changes.

Our team reviews within 24-48 hours and approved jobs are added to the main list!

Questions? Create a miscellaneous issue, and we'll assist! 🙏

${archivedSection}

<div align="center">

🎯 **${displayedJobCount} current opportunities from ${totalCompanies} elite companies.**

**Found this helpful? Give it a ⭐ to support us!**

*Not affiliated with any companies listed. All applications redirect to official career pages.*

**Last Updated:** ${currentDate} • **Next Update:** Daily at 9 AM UTC </div>`;
}

async function updateReadme(currentJobs, archivedJobs, internshipData, stats) {
 try {
  console.log("📝 Generating README content...");
  const readmeContent = await generateReadme(
   currentJobs,
   archivedJobs,
   internshipData,
   stats
  );
  fs.writeFileSync("README.md", readmeContent, "utf8");
  console.log(`✅ README.md updated with ${currentJobs.length} current jobs`);

  console.log("\n📊 Summary:");
  console.log(`- Total current: ${currentJobs.length}`);
  console.log(`- Archived:   ${archivedJobs.length}`);
  console.log(
   `- Companies:   ${Object.keys(stats?.totalByCompany || {}).length}`
  );
 } catch (err) {
  console.error("❌ Error updating README:", err);
  throw err;
 }
}

module.exports = {
 generateJobTable,
 generateArchivedSection,
 generateReadme,
 updateReadme,
 filterJobsByAge,
 filterOutSeniorPositions,  // ADD THIS
};
