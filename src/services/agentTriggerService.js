const axios = require('axios');
const connectDB = require('../config/connectDB');
const moment = require('moment-timezone');

const db = connectDB();
const AGENT_URL = process.env.AGENT_API_URL || 'http://localhost:3000';

function toISTIso() {
  return moment().tz('Asia/Kolkata').toISOString();
}

async function runAgentImplicitly(agentName, userId, userProfile, triggerType = 'profile_update') {
  const startTime = Date.now();
  const executionData = {
    userId,
    agentName,
    triggerType,
    inputData: userProfile,
    status: 'pending',
    executedAt: toISTIso()
  };
  const executionRef = await db.collection('agentexecutions').add(executionData);
  console.log(`Agent execution started: ${agentName} for user ${userId}`);
  if (agentName === 'resumeOptimizer'){
    try {
      console.log(`Running resume optimizer for user ${userId}`);
      let agentOutput = {
  result: {
    atsScore: 70,
    rationale:
      "The resume is extremely brief and lacks the depth and detail typically expected for a Senior Full-Stack Engineer role. With only 3 years of experience, the candidate needs to significantly elaborate on their impact, technical contributions, and leadership to justify a senior title. Key sections like a professional summary, education, and detailed project descriptions are missing. The current bullet points are descriptive rather than achievement-oriented, and there's a significant absence of metrics, quantifiable results, and advanced technical keywords relevant to senior-level responsibilities.",
    topFixes: [
      "Develop a compelling professional summary or objective statement tailored to a Senior Full-Stack Engineer role, highlighting key skills and career aspirations.",
      "Expand each experience bullet point to include specific achievements, quantifiable results, and the impact of your work. Focus on 'how' you did things and 'what' the outcome was.",
      "Add a dedicated 'Education' section, including degrees, institutions, and graduation dates. Consider a 'Projects' section if you have significant personal or open-source contributions.",
      "Integrate more senior-level keywords such as 'architecture,' 'design patterns,' 'scalability,' 'mentorship,' 'CI/CD,' and 'performance optimization' throughout the resume.",
      "Address the experience gap for a 'Senior' role (typically 5+ years) by emphasizing leadership, complex problem-solving, and significant contributions within the 3 years of experience.",
    ],
    keywordGap: {
      missing: [
        "architecture",
        "design patterns",
        "scalability",
        "performance optimization",
        "security",
        "CI/CD",
        "unit testing",
        "integration testing",
        "mentorship",
        "code review",
        "cloud platforms (e.g., AWS, Azure, GCP)",
        "microservices",
        "TypeScript",
        "GraphQL",
      ],
      underrepresented: ["Node.js", "React", "PostgreSQL", "Docker"],
      recommendedAdditions: [
        {
          keyword: "architecture",
          where: "Professional Summary, Experience Bullets",
        },
        {
          keyword: "scalability",
          where: "Experience Bullets, Professional Summary",
        },
        {
          keyword: "CI/CD",
          where: "Experience Bullets, Skills Section",
        },
        {
          keyword: "mentorship",
          where: "Experience Bullets, Professional Summary",
        },
        {
          keyword: "AWS",
          where: "Skills Section, Experience Bullets (if applicable)",
        },
        {
          keyword: "TypeScript",
          where: "Skills Section, Experience Bullets (if applicable)",
        },
      ],
    },
    rewrittenBullets: [
      {
        original: "Built REST APIs using Node.js.",
        improved:
          "Designed and developed robust, scalable RESTful APIs using Node.js, handling complex business logic and data interactions for critical application features.",
      },
      {
        original: "Integrated APIs with React.",
        improved:
          "Implemented seamless integration between front-end React applications and back-end Node.js APIs, ensuring data consistency and enhancing real-time user experiences.",
      },
      {
        original: "Used PostgreSQL for data storage.",
        improved:
          "Managed and optimized PostgreSQL databases, including schema design, query tuning, and performance monitoring, to support high-volume API requests.",
      },
      {
        original: "Led team of 2 developers.",
        improved:
          "Provided technical leadership and mentorship to a team of 2 junior developers, guiding them through complex feature implementations and fostering skill development.",
      },
      {
        original: "Coordinated development efforts.",
        improved:
          "Coordinated project tasks and sprint planning for a 2-person development team, ensuring efficient workflow and on-time delivery of key features.",
      },
      {
        original: "Ensured code quality.",
        improved:
          "Conducted regular code reviews and established coding standards, significantly improving code quality, maintainability, and reducing technical debt across projects.",
      },
      {
        original: "Contributed to software development lifecycle.",
        improved:
          "Actively participated in the full software development lifecycle, from requirements analysis and design to deployment, testing, and post-launch support.",
      },
      {
        original: "Deployed applications with Docker.",
        improved:
          "Deployed and managed containerized applications using Docker, standardizing development environments and improving deployment reliability and efficiency.",
      },
      {
        original: "Collaborated with stakeholders.",
        improved:
          "Collaborated cross-functionally with product managers and UX/UI designers to translate business requirements into technical specifications and deliver user-centric solutions.",
      },
    ],
    skillsSection: {
      core: ["JavaScript", "React", "Node.js"],
      tools: ["Docker"],
      cloud: [],
      data: ["PostgreSQL"],
      other: [],
    },
    formattingNotes: [
      "Ensure consistent use of standard resume sections (e.g., 'Summary', 'Experience', 'Skills', 'Education') with clear headings for ATS parsing.",
      "Avoid using multi-column layouts, tables, or complex graphics, as these can confuse ATS and lead to misinterpretation of content.",
      "Use clear and consistent date formats (e.g., 'MM/YYYY - MM/YYYY' or 'Month Year - Month Year') for all experience and education entries.",
      "Utilize bullet points for describing responsibilities and achievements under each role, starting each bullet with a strong action verb.",
    ],
  },
  finishReason: "STOP",
  resumeFormatDetected: "text",
  generatedAt: "2026-01-08T04:46:23.902Z",
}
      await storeAgentResult(agentName, userId, agentOutput, userProfile);
      const prompt = buildPromptFromProfile(agentName, userProfile);
      const response = await axios.post(`${AGENT_URL}/api/resume/optimize`, { prompt } );
      console.log(response);
      console.log(`Agent ${agentName} response:`, response.data);
      const executionTimeMs = Date.now() - startTime;
      agentOutput = response.data.result;
      
      await executionRef.update({ status: 'success', outputData: agentOutput, executionTimeMs });
      
      return { success: true, agentOutput };
    } catch (error) {
      await executionRef.update({ status: 'error', errorMessage: error.message, executionTimeMs: Date.now() - startTime });
      return { success: false, error: error.message };
    }
  } else {
    try {
      const prompt = buildPromptFromProfile(agentName, userProfile);
      const response = await axios.post(`${AGENT_URL}/api/agent/${agentName}`, { prompt }, { timeout: 60000 });
      console.log(`Agent ${agentName} response:`, response.data);
      const executionTimeMs = Date.now() - startTime;
      const agentOutput = response.data.result;
      
      await storeAgentResult(agentName, userId, agentOutput, userProfile);
      await executionRef.update({ status: 'success', outputData: agentOutput, executionTimeMs });
      
      return { success: true, agentOutput };
    } catch (error) {
      await executionRef.update({ status: 'error', errorMessage: error.message, executionTimeMs: Date.now() - startTime });
      return { success: false, error: error.message };
    }
  }
}

function buildPromptFromProfile(agentName, userProfile) {
  const { role, skills, experience, targetRole, location, interests, resumeText, careerPath } = userProfile;
  
  switch (agentName) {
    // case 'careerPlanJsonAgent':
    //   return `Generate a career plan for: Role: ${role || 'Not specified'}, Skills: ${skills || 'Not specified'}, Experience: ${experience || 'Entry level'}, Interests: ${interests || 'Not specified'}`;
    // case 'skillGapRoadmapAgent':
    //   return `Create a roadmap for transitioning to ${targetRole || role}. Current skills: ${skills || 'None'}. Experience: ${experience || 'Entry level'}`;
    // case 'resumeOptimizationAgent':
    //   return `Analyze this resume for ${targetRole || role}: ${resumeText}`;
    // case 'jobSearchApplicationAgent':
    //   return `Find jobs matching: Role: ${targetRole || role}, Skills: ${skills}, Location: ${location || 'Remote'}`;
    // case 'jobPrepAgent':
    //   return `Create job prep plan for ${targetRole || role}. Skills: ${skills}. Career path: ${careerPath || 'job'}. Location: ${location}`;
    default:
      return `Analyze profile: ${JSON.stringify(userProfile)}`;
  }
}

async function storeAgentResult(agentName, userId, agentOutput, userProfile) {
  const timestamp = toISTIso();

  console.log(`Storing result for agent ${agentName} for user ${userId} agentOutput:`, agentOutput);
  
  switch (agentName) {
    case 'careerPlanJsonAgent':
      const activeQuery = await db.collection('careerplans').where('userId', '==', userId).where('status', '==', 'active').get();
      const batch = db.batch();
      activeQuery.docs.forEach(doc => batch.update(doc.ref, { status: 'archived' }));
      await batch.commit();
      
      const expiresAt = moment().add(30, 'days').toISOString();
      await db.collection('careerplans').add({
        userId,
        agentName: 'careerPlanJsonAgent',
        planContent: agentOutput,
        phases: agentOutput.phases || [],
        status: 'active',
        generatedAt: timestamp,
        expiresAt
      });
      console.log('Stored new career plan for user:', userId);
      break;
      
    case 'skillGapRoadmapAgent':
      const roadmapQuery = await db.collection('roadmaps').where('userId', '==', userId).limit(1).get();
      if (!roadmapQuery.empty) {
        await roadmapQuery.docs[0].ref.update({
          roadmapData: agentOutput,
          status: 'active',
          updatedAt: timestamp
        });
      } else {
        await db.collection('roadmaps').add({
          userId,
          roadmapData: agentOutput,
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
      break;
      
    case 'resumeOptimizer':
      await db.collection('resumeanalyses').add({
        userId,
        resumeText: userProfile.resumeText || '',
        targetRole: userProfile.targetRole || '',
        atsScore: agentOutput.atsScore || 0,
        analysisContent: agentOutput,
        recommendations: agentOutput.topFixes || [],
        generatedAt: timestamp
      });
      break;
      
    case 'jobSearchApplicationAgent':
      if (agentOutput.jobs && Array.isArray(agentOutput.jobs)) {
        const jobBatch = db.batch();
        agentOutput.jobs.slice(0, 10).forEach(job => {
          const ref = db.collection('jobmatches').doc();
          jobBatch.set(ref, {
            userId,
            jobId: job.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            jobTitle: job.title || '',
            company: job.company || '',
            location: job.location || '',
            relevanceScore: job.fitScore || 0.8,
            matchReason: job.reason || 'Skills match',
            status: 'new',
            matchedAt: timestamp
          });
        });
        await jobBatch.commit();
      }
      break;
  }
}

async function triggerMultipleAgents(userId, userProfile, triggerType) {
  const agentsToRun = ['careerPlanJsonAgent', 'skillGapRoadmapAgent'];
  if (userProfile.location) agentsToRun.push('jobSearchApplicationAgent');
  
  const promises = agentsToRun.map(agent => runAgentImplicitly(agent, userId, userProfile, triggerType));
  return Promise.allSettled(promises);
}

module.exports = { runAgentImplicitly, triggerMultipleAgents };
