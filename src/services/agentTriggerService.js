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
      
    case 'resumeOptimizationAgent':
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
