import axios from 'axios';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const analyzeResumeWithGemini = async (resumeText) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error('Resume text is empty');
    }

    const prompt = `
Analyze this resume text and return a JSON response with exactly this structure:
{
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "suggestedTitle": "Job Title",
  "seniority": "junior|mid|senior|lead|executive", 
  "summary": "Brief professional summary in 2-3 sentences"
}

Requirements:
- Extract exactly 5 most relevant technical skills
- Suggest the most appropriate job title based on experience
- Determine seniority level based on years of experience and responsibilities
- Create a concise professional summary highlighting key strengths

Resume text:
${resumeText}

Return only valid JSON without any additional text or formatting.`;

    const requestData = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const geminiResponse = response.data.candidates[0].content.parts[0].text;
    
    // Clean the response to ensure it's valid JSON
    const cleanResponse = geminiResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let analysisResult;
    try {
      analysisResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Gemini raw response:', geminiResponse);
      
      // Fallback analysis if JSON parsing fails
      analysisResult = {
        skills: extractSkillsFallback(resumeText),
        suggestedTitle: 'Professional',
        seniority: 'mid',
        summary: 'Experienced professional with diverse skill set and strong background.'
      };
    }

    // Validate and sanitize the analysis result
    const validatedResult = {
      skills: Array.isArray(analysisResult.skills) 
        ? analysisResult.skills.slice(0, 5).filter(skill => skill && typeof skill === 'string')
        : extractSkillsFallback(resumeText),
      suggestedTitle: typeof analysisResult.suggestedTitle === 'string' 
        ? analysisResult.suggestedTitle.trim() 
        : 'Professional',
      seniority: ['junior', 'mid', 'senior', 'lead', 'executive'].includes(analysisResult.seniority)
        ? analysisResult.seniority
        : 'mid',
      summary: typeof analysisResult.summary === 'string' 
        ? analysisResult.summary.trim() 
        : 'Experienced professional with strong technical background.'
    };

    return validatedResult;

  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Return fallback analysis if Gemini fails
    return {
      skills: extractSkillsFallback(resumeText),
      suggestedTitle: 'Professional',
      seniority: 'mid',
      summary: 'Experienced professional with diverse technical skills and strong background in their field.'
    };
  }
};
const extractSkillsFallback1 = (resumeText) => {
  // Simple fallback skill extraction logic
  const words = resumeText.split(/\s+/);
  const skillSet = new Set();

  for (const word of words) {
    if (word.length > 2 && !skillSet.has(word)) {
      skillSet.add(word);
    }
    if (skillSet.size >= 5) break;
  }

  return Array.from(skillSet).slice(0, 5);
};
const extractSkillsFallback = (text) => {
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML', 'CSS', 'SQL',
    'MongoDB', 'Express', 'Angular', 'Vue', 'TypeScript', 'AWS', 'Docker',
    'Git', 'REST API', 'GraphQL', 'Redux', 'Spring Boot', 'Django', 'Flask'
  ];

  const textUpper = text.toUpperCase();
  const foundSkills = commonSkills.filter(skill => 
    textUpper.includes(skill.toUpperCase())
  );

  return foundSkills.slice(0, 5);
};