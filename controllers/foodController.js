const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Create new food post
// @route   POST /api/food
// @access  Private (Donor)
const createFoodPost = asyncHandler(async (req, res) => {
    console.log('Food Post Request Body:', req.body);
    const { foodType, foodItems, quantity, cookedTime, expiryTime, location, contactPhone } = req.body;

    if (!foodType || !foodItems || !quantity || !cookedTime || !expiryTime || !location || !contactPhone) {
        console.log('Missing fields in food post:', { foodType, foodItems, quantity, cookedTime, expiryTime, location, contactPhone });
        res.status(400);
        throw new Error('Please add all fields');
    }

    const { data: foodPost, error } = await supabase
        .from('food_posts')
        .insert([
            {
                donor_id: req.user.id,
                food_type: foodType,
                food_items: foodItems,
                quantity,
                cooked_time: cookedTime,
                expiry_time: expiryTime,
                location,
                contact_phone: contactPhone,
                status: 'Available'
            }
        ])
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error('Error creating food post: ' + error.message);
    }

    res.status(201).json(foodPost);
});

// @desc    Get all available food posts
// @route   GET /api/food
// @access  Private (Receiver)
const getFoodPosts = asyncHandler(async (req, res) => {
    const { type } = req.query; // ?type=Vegetarian

    let query = supabase
        .from('food_posts')
        .select(`
            *,
            donor:users (name)
        `)
        .eq('status', 'Available')
        .gt('expiry_time', new Date().toISOString());

    if (type) {
        query = query.eq('food_type', type);
    }

    const { data: foodPosts, error } = await query;

    if (error) {
        res.status(400);
        throw new Error('Error fetching food posts: ' + error.message);
    }

    res.status(200).json(foodPosts);
});

// @desc    Get donor's posts
// @route   GET /api/food/my
// @access  Private (Donor)
const getMyPosts = asyncHandler(async (req, res) => {
    const { data: foodPosts, error } = await supabase
        .from('food_posts')
        .select('*')
        .eq('donor_id', req.user.id);

    if (error) {
        res.status(400);
        throw new Error('Error fetching your food posts: ' + error.message);
    }

    res.status(200).json(foodPosts);
});

// @desc    Delete food post
// @route   DELETE /api/food/:id
// @access  Private (Donor)
const deleteFoodPost = asyncHandler(async (req, res) => {
    // Check if post exists and belongs to user
    const { data: foodPost, error: fetchError } = await supabase
        .from('food_posts')
        .select('donor_id')
        .eq('id', req.params.id)
        .single();

    if (!foodPost || fetchError) {
        res.status(404);
        throw new Error('Food post not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the creator
    if (foodPost.donor_id !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const { error: deleteError } = await supabase
        .from('food_posts')
        .delete()
        .eq('id', req.params.id);

    if (deleteError) {
        res.status(400);
        throw new Error('Error deleting food post: ' + deleteError.message);
    }

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    createFoodPost,
    getFoodPosts,
    getMyPosts,
    deleteFoodPost,
};
