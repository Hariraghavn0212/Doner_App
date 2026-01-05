const express = require('express');
const router = express.Router();
const { createFoodPost, getFoodPosts, getMyPosts, deleteFoodPost } = require('../controllers/foodController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createFoodPost)
    .get(protect, getFoodPosts);

router.get('/my', protect, getMyPosts);
router.delete('/:id', protect, deleteFoodPost);

module.exports = router;
