const connectDB = require('../config/connectDB');

const db = connectDB();

async function getUserId(req) {
  const directUserId = req.body.userId || req.query.userId;
  if (directUserId) return directUserId;
  
  const email = req.body.email || req.query.email || (req.user && req.user.email);
  if (!email) return null;
  
  const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
  if (userQuery.empty) return null;
  
  return userQuery.docs[0].id;
}

const getCareerPlan = async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId or email required' });
    }
    
    const query = await db.collection('careerplans')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    if (query.empty) {
      return res.status(200).json({ success: true, careerPlan: null });
    }
    
    const docs = query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    
    res.status(200).json({ success: true, careerPlan: docs[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getResumeAnalysis = async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId or email required' });
    }
    
    const query = await db.collection('resumeanalyses')
      .where('userId', '==', userId)
      .get();
    
    if (query.empty) {
      return res.status(200).json({ success: true, resumeAnalysis: null });
    }
    
    const docs = query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    
    res.status(200).json({ success: true, resumeAnalysis: docs[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getJobMatches = async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId or email required' });
    }
    
    const status = req.query.status || 'new';
    const query = await db.collection('jobmatches')
      .where('userId', '==', userId)
      .where('status', '==', status)
      .get();
    
    const matches = query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    matches.sort((a, b) => new Date(b.matchedAt) - new Date(a.matchedAt));
    
    res.status(200).json({ success: true, jobMatches: matches.slice(0, 20) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAgentStatus = async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId or email required' });
    }
    
    const query = await db.collection('agentexecutions')
      .where('userId', '==', userId)
      .get();
    
    const executions = query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    executions.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));
    
    res.status(200).json({ success: true, executions: executions.slice(0, 10) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateJobMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;
    await db.collection('jobmatches').doc(matchId).update({ status });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getCareerPlan,
  getResumeAnalysis,
  getJobMatches,
  getAgentStatus,
  updateJobMatchStatus
};