const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

            // Get user from the token using Supabase
            const { data: user, error } = await supabase
                .from('users')
                .select('id, name, email, role, phone, address')
                .eq('id', decoded.id)
                .single();

            if (error || !user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            req.user = user;

            next();
        } catch (error) {
            console.log(error);
            res.status(401);
            throw new Error('Not authorized');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect };
