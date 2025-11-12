const express = require('express');
const router = express.Router();
const { createRequest, listRequests, getRequest, updateRequest } = require('../controllers/request.controller');
const auth = require('../middleware/auth.middleware');
const allowedRoles = require('../middleware/roles.middleware');

router.post('/', createRequest);
router.get('/', auth, allowedRoles('dispatcher', 'authority', 'admin'), listRequests);
router.get('/:id', auth, allowedRoles('dispatcher', 'authority', 'admin'), getRequest);
router.put('/:id', auth, allowedRoles('dispatcher', 'authority', 'admin'), updateRequest);

module.exports = router;
