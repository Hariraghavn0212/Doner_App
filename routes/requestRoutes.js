const express = require('express');
const router = express.Router();
const { createRequest, getMyRequests, getRequestsForMyPosts, updateRequestStatus } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRequest);
router.get('/my', protect, getMyRequests);
router.get('/donor', protect, getRequestsForMyPosts);
router.put('/:id', protect, updateRequestStatus);

module.exports = router;
