const express = require('express');
const router = express.Router();
const { createResourcePost, getResourcePosts, getMyResourcePosts, deleteResourcePost } = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.array('images', 5), createResourcePost);
router.get('/', protect, getResourcePosts);
router.get('/my', protect, getMyResourcePosts);
router.delete('/:id', protect, deleteResourcePost);

module.exports = router;
