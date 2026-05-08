const router = require('express').Router();
const { listOpportunities, createOpportunity, getOpportunity, updateOpportunity, changeStage, addComment, getPipeline } = require('../controllers/opportunityController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/pipeline', authenticate, getPipeline);
router.get('/', authenticate, listOpportunities);
router.post('/', authenticate, authorize('super_admin', 'admin', 'sales_manager', 'sales_executive'), createOpportunity);
router.get('/:id', authenticate, getOpportunity);
router.put('/:id', authenticate, updateOpportunity);
router.patch('/:id/stage', authenticate, changeStage);
router.post('/:id/comments', authenticate, addComment);

module.exports = router;
