const router = require('express').Router();
const { listClients, createClient, getClient, updateClient, getClientProfile, exportClients } = require('../controllers/clientController');
const { authenticate, authorize } = require('../middleware/auth');

const noViewer = ['super_admin', 'admin', 'sales_manager', 'sales_executive', 'backend_ops'];

router.get('/export', authenticate, exportClients);
router.get('/', authenticate, listClients);
router.post('/', authenticate, authorize(...noViewer), createClient);
router.get('/:id', authenticate, getClient);
router.get('/:id/profile', authenticate, getClientProfile);
router.put('/:id', authenticate, authorize(...noViewer), updateClient);

module.exports = router;
