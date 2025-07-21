export const calculateJobMatches = (jobs, userPreferences, geminiAnalysis) => {
  try {
    if (!Array.isArray(jobs)) {
      throw new Error('Jobs must be an array');
    }

    const matchedJobs = jobs.map(job => {
      let score = 0;
      const matchReasons = [];

      // Title matching (3 points)
      const jobTitle = (job.title || '').toLowerCase();
      const preferredRole = (userPreferences?.preferredRole || '').toLowerCase();
      const suggestedTitle = (geminiAnalysis?.suggestedTitle || '').toLowerCase();

      if (preferredRole && jobTitle.includes(preferredRole)) {
        score += 3;
        matchReasons.push('Title matches preferred role');
      } else if (suggestedTitle && jobTitle.includes(suggestedTitle)) {
        score += 3;
        matchReasons.push('Title matches AI-suggested role');
      }

      // Skills matching (2 points per skill)
      if (geminiAnalysis?.skills && Array.isArray(geminiAnalysis.skills)) {
        const jobDescription = (job.description || '').toLowerCase();
        const requirements = (job.requirements || '').toLowerCase();
        const fullJobText = `${jobDescription} ${requirements}`;

        geminiAnalysis.skills.forEach(skill => {
          if (skill && fullJobText.includes(skill.toLowerCase())) {
            score += 2;
            matchReasons.push(`Skill match: ${skill}`);
          }
        });
      }

      // Location matching (2 points)
      const jobLocation = (job.location || '').toLowerCase();
      const preferredLocation = (userPreferences?.location || '').toLowerCase();

      if (preferredLocation && 
          (jobLocation.includes(preferredLocation) || 
           jobLocation === 'remote' || 
           preferredLocation === 'remote')) {
        score += 2;
        matchReasons.push('Location match');
      }

      // Salary matching (1 point)
      if (userPreferences?.salaryRange?.min && userPreferences?.salaryRange?.max) {
        const salaryMatch = checkSalaryMatch(
          job.salary, 
          userPreferences.salaryRange.min, 
          userPreferences.salaryRange.max
        );
        if (salaryMatch) {
          score += 1;
          matchReasons.push('Salary in range');
        }
      }

      return {
        ...job,
        matchScore: score,
        matchReasons: matchReasons
      };
    });

    // Sort by match score (highest first) and return top 10
    return matchedJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

  } catch (error) {
    console.error('Job matching error:', error);
    return [];
  }
};

// Helper function to check salary match
const checkSalaryMatch = (jobSalary, minSalary, maxSalary) => {
  if (!jobSalary) return false;

  // Extract numbers from salary string (e.g., "$70,000 - $90,000")
  const salaryNumbers = jobSalary.match(/\d+,?\d*/g);
  if (!salaryNumbers || salaryNumbers.length === 0) return false;

  // Convert to numbers and remove commas
  const salaryValues = salaryNumbers.map(s => parseInt(s.replace(/,/g, '')));
  
  if (salaryValues.length === 1) {
    // Single salary value
    return salaryValues[0] >= minSalary && salaryValues[0] <= maxSalary;
  } else if (salaryValues.length >= 2) {
    // Salary range
    const jobMinSalary = Math.min(...salaryValues);
    const jobMaxSalary = Math.max(...salaryValues);
    
    // Check for overlap between ranges
    return !(jobMaxSalary < minSalary || jobMinSalary > maxSalary);
  }

  return false;
};