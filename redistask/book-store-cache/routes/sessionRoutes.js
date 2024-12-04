const express = require('express');
const { createSession, extendSession, deleteSession } = require('../controllers/sessionController');

const router = express.Router();

router.post('/', createSession);
router.put('/:sessionId', extendSession);
router.delete('/:sessionId', deleteSession);

module.exports = router;
