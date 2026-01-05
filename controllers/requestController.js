const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Create new request
// @route   POST /api/requests
// @access  Private (Receiver)
const createRequest = asyncHandler(async (req, res) => {
    // foodPostId OR resourcePostId
    const { foodPostId, resourcePostId, message, selectedItems } = req.body;

    let targetPost;
    let query = { receiver_id: req.user.id };

    if (foodPostId) {
        const { data: fp, error } = await supabase
            .from('food_posts')
            .select('*')
            .eq('id', foodPostId)
            .single();
        targetPost = fp;
        query.food_post_id = foodPostId;
    } else if (resourcePostId) {
        const { data: rp, error } = await supabase
            .from('resource_posts')
            .select('*')
            .eq('id', resourcePostId)
            .single();
        targetPost = rp;
        query.resource_post_id = resourcePostId;
    }

    if (!targetPost) {
        res.status(404);
        throw new Error('Post not found');
    }

    if (targetPost.status !== 'Available') {
        res.status(400);
        throw new Error('Item is not available');
    }

    // Check if already requested
    let checkQuery = supabase.from('requests').select('id').eq('receiver_id', req.user.id);
    if (foodPostId) checkQuery = checkQuery.eq('food_post_id', foodPostId);
    if (resourcePostId) checkQuery = checkQuery.eq('resource_post_id', resourcePostId);

    const { data: existingRequest } = await checkQuery.single();

    if (existingRequest) {
        res.status(400);
        throw new Error('You have already requested this item');
    }

    const { data: request, error: insertError } = await supabase
        .from('requests')
        .insert([
            {
                receiver_id: req.user.id,
                food_post_id: foodPostId || null,
                resource_post_id: resourcePostId || null,
                message,
                selected_items: selectedItems || [],
                status: 'Pending'
            }
        ])
        .select()
        .single();

    if (insertError) {
        res.status(400);
        throw new Error('Error creating request: ' + insertError.message);
    }

    res.status(201).json(request);
});

// @desc    Get my requests
// @route   GET /api/requests/my
// @access  Private (Receiver)
const getMyRequests = asyncHandler(async (req, res) => {
    const { data: requests, error } = await supabase
        .from('requests')
        .select(`
            *,
            food_posts (*),
            resource_posts (*)
        `)
        .eq('receiver_id', req.user.id);

    if (error) {
        res.status(400);
        throw new Error('Error fetching your requests: ' + error.message);
    }

    // Map back to expected structure if needed (frontend uses foodPost, resourcePost)
    const formattedRequests = requests.map(r => ({
        ...r,
        foodPost: r.food_posts,
        resourcePost: r.resource_posts
    }));

    res.status(200).json(formattedRequests);
});

// @desc    Get requests for my posts
// @route   GET /api/requests/donor
// @access  Private (Donor)
const getRequestsForMyPosts = asyncHandler(async (req, res) => {
    // Find all food posts by this donor
    const { data: myFoodPosts } = await supabase
        .from('food_posts')
        .select('id')
        .eq('donor_id', req.user.id);
    const foodPostIds = myFoodPosts.map(post => post.id);

    // Find all resource posts by this donor
    const { data: myResourcePosts } = await supabase
        .from('resource_posts')
        .select('id')
        .eq('donor_id', req.user.id);
    const resourcePostIds = myResourcePosts.map(post => post.id);

    // Find requests for these posts
    const { data: requests, error } = await supabase
        .from('requests')
        .select(`
            *,
            receiver:users (name, phone, address),
            foodPost:food_posts (*),
            resourcePost:resource_posts (*)
        `)
        .or(`food_post_id.in.(${foodPostIds.join(',')}),resource_post_id.in.(${resourcePostIds.join(',')})`);

    if (error) {
        res.status(400);
        throw new Error('Error fetching requests for your posts: ' + error.message);
    }

    res.status(200).json(requests);
});

// @desc    Update request status
// @route   PUT /api/requests/:id
// @access  Private (Donor)
const updateRequestStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // Accepted, Rejected

    const { data: request, error: fetchError } = await supabase
        .from('requests')
        .select(`
            *,
            foodPost:food_posts (*),
            resourcePost:resource_posts (*)
        `)
        .eq('id', req.params.id)
        .single();

    if (!request || fetchError) {
        res.status(404);
        throw new Error('Request not found');
    }

    // Verify donor owns the post
    const post = request.foodPost || request.resourcePost;

    if (!post) {
        res.status(404);
        throw new Error('Associated post not found');
    }

    if (post.donor_id !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const { data: updatedRequest, error: updateError } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', req.params.id)
        .select()
        .single();

    if (updateError) {
        res.status(400);
        throw new Error('Error updating request status: ' + updateError.message);
    }

    // If accepted, mark relevant post as Claimed
    if (status === 'Accepted') {
        if (request.food_post_id) {
            await supabase
                .from('food_posts')
                .update({ status: 'Claimed' })
                .eq('id', request.food_post_id);
        } else if (request.resource_post_id) {
            await supabase
                .from('resource_posts')
                .update({ status: 'Claimed' })
                .eq('id', request.resource_post_id);
        }
    }

    res.status(200).json(updatedRequest);
});

module.exports = {
    createRequest,
    getMyRequests,
    getRequestsForMyPosts,
    updateRequestStatus,
};
