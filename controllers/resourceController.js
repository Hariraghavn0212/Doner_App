const asyncHandler = require('express-async-handler');
const path = require('path');
const supabase = require('../config/supabase');

// @desc    Create new resource post
// @route   POST /api/resources
// @access  Private (Donor)
const createResourcePost = asyncHandler(async (req, res) => {
    console.log('Resource Post Request Body:', req.body);
    console.log('Resource Post Request Files:', req.files);

    const { category, itemName, description, quantity, location, contactPhone } = req.body;

    const images = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const fileName = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}${path.extname(file.originalname)}`;

            const { data, error: uploadError } = await supabase.storage
                .from('resources')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Supabase Storage Upload Error:', uploadError);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('resources')
                .getPublicUrl(fileName);

            images.push(publicUrl);
        }
    }

    if (!category || !itemName || !quantity || !location || !contactPhone) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    const { data: post, error } = await supabase
        .from('resource_posts')
        .insert([
            {
                donor_id: req.user.id,
                category,
                item_name: itemName,
                description,
                quantity,
                location,
                contact_phone: contactPhone,
                images: images,
                status: 'Available'
            }
        ])
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error('Error creating resource post: ' + error.message);
    }

    res.status(201).json(post);
});

// @desc    Get all available resource posts
// @route   GET /api/resources
// @access  Private (Receiver)
const getResourcePosts = asyncHandler(async (req, res) => {
    const { category } = req.query;

    let query = supabase
        .from('resource_posts')
        .select(`
            *,
            donor:users (name)
        `)
        .eq('status', 'Available');

    if (category) {
        query = query.eq('category', category);
    }

    const { data: posts, error } = await query;

    if (error) {
        res.status(400);
        throw new Error('Error fetching resource posts: ' + error.message);
    }

    res.status(200).json(posts);
});

// @desc    Get my resource posts
// @route   GET /api/resources/my
// @access  Private (Donor)
const getMyResourcePosts = asyncHandler(async (req, res) => {
    const { data: posts, error } = await supabase
        .from('resource_posts')
        .select('*')
        .eq('donor_id', req.user.id);

    if (error) {
        res.status(400);
        throw new Error('Error fetching your resource posts: ' + error.message);
    }

    res.status(200).json(posts);
});

// @desc    Delete resource post
// @route   DELETE /api/resources/:id
// @access  Private (Donor)
const deleteResourcePost = asyncHandler(async (req, res) => {
    // Check if post exists and belongs to user
    const { data: post, error: fetchError } = await supabase
        .from('resource_posts')
        .select('donor_id')
        .eq('id', req.params.id)
        .single();

    if (!post || fetchError) {
        res.status(404);
        throw new Error('Post not found');
    }

    if (post.donor_id !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const { error: deleteError } = await supabase
        .from('resource_posts')
        .delete()
        .eq('id', req.params.id);

    if (deleteError) {
        res.status(400);
        throw new Error('Error deleting resource post: ' + deleteError.message);
    }

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    createResourcePost,
    getResourcePosts,
    getMyResourcePosts,
    deleteResourcePost
};
