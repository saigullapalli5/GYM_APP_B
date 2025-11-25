import JWT from "jsonwebtoken";
// import User from "../models/User.js";
import {User} from "../models/User.js";
import Subscription from "../models/Subscription.js";
// protected routes token based
const requireSignIn = async (req, res, next) => {
    try {
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return next();
        }

        // Try to get token from Authorization header first
        let token;
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // Extract token from Authorization header
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            // Fall back to cookie if no Authorization header
            token = req.cookies.token;
        }
        
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.'
            });
        }

        try {
            // Verify the token
            const decoded = JWT.verify(token, process.env.JWT_SECRET);
            
            // Check if token has required fields
            if (!decoded._id) {
                console.log('Invalid token format: missing user ID');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format: missing user ID'
                });
            }

            // Get fresh user data
            const user = await User.findById(decoded._id).select('-password');
            if (!user) {
                console.log('User not found for token');
                return res.status(401).json({
                    success: false,
                    message: 'User not found. Please log in again.'
                });
            }

            // Add user info to request object
            req.user = {
                _id: user._id,
                role: user.role || 0, // Default to regular user if role not specified
                isAdmin: user.role === 1
            };
            
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please log in again.'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token. Please log in again.'
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        
        let errorMessage = 'Authentication failed';
        if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Invalid token';
        } else if (error.name === 'TokenExpiredError') {
            errorMessage = 'Token has expired';
        }
        
        res.status(401).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// admin access 
const isAdmin = async (req, res, next) => {
    try {
        console.log('isAdmin middleware - User from token:', req.user);
        
        if (!req.user || !req.user._id) {
            console.error('No user in request');
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const user = await User.findById(req.user._id).select('role');
        
        if (!user) {
            console.error('User not found in database:', req.user._id);
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        console.log('User role from DB:', user.role, 'Type:', typeof user.role);
        
        if (user.role !== 1) {
            console.error('User is not an admin. Role:', user.role);
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        // Add user role to request for downstream middleware
        req.user.role = user.role;
        next();
    } catch (error) {
        console.error('Error in isAdmin middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying admin status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const isSubscribed = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const subscription = await Subscription.findOne({ user: userId });
        if (!subscription) {
            return res.status(403).json({
                success: false,
                message: "You need an active subscription to perform this action",
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export { requireSignIn, isAdmin, isSubscribed };

