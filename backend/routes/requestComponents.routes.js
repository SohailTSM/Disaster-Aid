const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const allowedRoles = require('../middleware/roles.middleware');
const {
  generateComponents,
  listComponents,
  assignComponent,
  updateComponentStatus
} = require('../controllers/requestComponent.controller');

router.post('/generate/:requestId', auth, allowedRoles('dispatcher', 'authority', 'admin'), generateComponents);
router.get('/', auth, allowedRoles('dispatcher', 'authority', 'ngo_member', 'admin'), listComponents);
router.put('/:id/assign', auth, allowedRoles('dispatcher', 'authority'), assignComponent);
router.put('/:id/status', auth, allowedRoles('ngo_member', 'dispatcher', 'authority'), updateComponentStatus);

module.exports = router;
