const express = require('express');
const router = express.Router();
const { createOrganization, listOrganizations, verifyOrganization } = require('../controllers/organization.controller');
const auth = require('../middleware/auth.middleware');
const allowedRoles = require('../middleware/roles.middleware');

router.post('/', auth, allowedRoles('dispatcher', 'admin'), createOrganization);
router.get('/', auth, allowedRoles('dispatcher', 'authority', 'admin'), listOrganizations);
router.put('/:id/verify', auth, allowedRoles('dispatcher', 'authority', 'admin'), verifyOrganization);

module.exports = router;
