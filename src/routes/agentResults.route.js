const express = require('express');
const { getCareerPlan, getResumeAnalysis, getJobMatches, getAgentStatus, updateJobMatchStatus } = require('../controllers/agentResults.controller');
const { tokenValidator } = require('../middlewares/auth/tokenValidation');

const router = express.Router();

router.get('/career-plan', tokenValidator, getCareerPlan);
router.get('/resume-analysis', tokenValidator, getResumeAnalysis);
router.get('/job-matches', tokenValidator, getJobMatches);
router.get('/agent-status', tokenValidator, getAgentStatus);
router.patch('/job-matches/:matchId', tokenValidator, updateJobMatchStatus);

module.exports = router;
