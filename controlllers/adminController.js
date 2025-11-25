import { User } from "../models/User.js";
import JWT from "jsonwebtoken";

// Make user admin
const makeAdminController = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find the user and update their role to admin (1)
        const user = await User.findByIdAndUpdate(
            userId,
            { role: 1 },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User role updated to admin',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
};

// Remove admin privileges
const removeAdminController = async (req, res) => {
    try {
        const { userId } = req.params;
        const requestingUserId = req.user._id;

        // Prevent removing admin from self
        if (userId === requestingUserId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove admin privileges from yourself'
            });
        }

        // Find the user and update their role to regular user (0)
        const user = await User.findByIdAndUpdate(
            userId,
            { role: 0 },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User role updated to regular user',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
};

// List all users (for admin)
const listUsersController = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Delete a user
const deleteUserController = async (req, res) => {
    try {
        const { userId } = req.params;
        const requestingUserId = req.user._id;

        // Prevent deleting self
        if (userId === requestingUserId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Find and delete the user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            deletedUser: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export {
    makeAdminController,
    removeAdminController,
    listUsersController,
    deleteUserController
};
