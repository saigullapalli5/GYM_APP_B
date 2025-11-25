import mongoose from 'mongoose';
import Plan from "../models/Plan.js";
// import User from "../models/User.js";
import { User } from "../models/User.js";
import Subscription from "../models/Subscription.js";
// const createSubscriptionPlanController = async (req, res) => {
//     try {
//         const {userName, planType, planAmount, planId  } = req.body;
//         if (!userName) {
//             return res.json({ message: "username is Required" });
//         }
//         if (!planType) {
//             return res.json({ message: "planType is Required" });
//         }
//          const userId = req.user._id;

//         const user = await User.findById(userId);
//         const plan = await Plan.findById(planId);

//         if (!user) {
//             return res.status(400).json({message:"user not found", success:false});
//         }

//         if (!plan) {
//             return res.status(400).json({message:"plan not found", success:false});
//         }
        
//         const newSubscription = await new Subscription({
//             userName,
//             planType,
//             planAmount,
//             plan:planId, 
//             user:userId 
//         }).save();

//         return res.status(200).json({
//             message: "subscription created successfully",
//             success: true,
//             newSubscription
//         });


//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "error in subscription",
//             error
//         });
//     }

// }

const createSubscriptionPlanController = async (req, res) => {
    try {
        console.log("Subscription creation request received:", {
            body: req.body,
            user: req.user,
            params: req.params
        });

        const { userName, planType, planAmount, planId, startDate, endDate, status, paymentStatus } = req.body;
        
        if (!userName) {
            console.log("Username is required");
            return res.status(400).json({ 
                success: false,
                message: "Username is required" 
            });
        }
        
        if (!planType) {
            console.log("Plan type is required");
            return res.status(400).json({ 
                success: false,
                message: "Plan type is required" 
            });
        }
        
        if (!req.user || !req.user._id) {
            console.log("User not authenticated");
            return res.status(401).json({ 
                success: false,
                message: "User not authenticated" 
            });
        }
        
        const userId = req.user._id;
        console.log("User ID from token:", userId);

        // Find user and plan
        const [user, plan] = await Promise.all([
            User.findById(userId),
            Plan.findById(planId)
        ]);

        if (!user) {
            console.log("User not found with ID:", userId);
            return res.status(400).json({ 
                success: false,
                message: "User not found" 
            });
        }

        if (!plan) {
            console.log("Plan not found with ID:", planId);
            return res.status(400).json({ 
                success: false,
                message: "Plan not found" 
            });
        }

        // Check for existing subscription
        const existingSubscription = await Subscription.findOne({ user: userId });
        console.log("Existing subscription check:", existingSubscription);
        
        if (existingSubscription) {
            console.log("User already has an active subscription");
            return res.status(400).json({ 
                success: false,
                message: "You already have an active subscription" 
            });
        }

        // Create new subscription
        const subscriptionData = {
            userName,
            planType,
            planAmount,
            plan: planId,
            user: userId,
            startDate,
            endDate,
            status: status || 'active',
            paymentStatus: paymentStatus || 'pending'
        };

        console.log("Creating subscription with data:", subscriptionData);
        const newSubscription = await new Subscription(subscriptionData).save();

        console.log("Subscription created successfully:", newSubscription);
        return res.status(201).json({
            success: true,
            message: "Subscription created successfully",
            subscription: newSubscription
        });

    } catch (error) {
        console.error("Error in subscription creation:", error);
        res.status(500).json({
            success: false,
            message: "Error creating subscription",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


// Get all subscriptions with pagination and search
const getAllSubscriptionsController = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Build search query
        const query = {};
        if (search) {
            query.$or = [
                { 'user.name': { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } },
                { 'plan.name': { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await Subscription.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Get paginated subscriptions with populated user and plan
        const subscriptions = await Subscription.find(query)
            .populate({
                path: 'user',
                select: 'name email phone'
            })
            .populate({
                path: 'plan',
                select: 'name duration price'
            })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            subscriptions,
            total,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error("Error getting subscriptions:", error);
        return res.status(500).json({
            success: false,
            message: "Error getting subscriptions",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


const getSubscriptionController = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const subscription = await Subscription.findById(subscriptionId).populate('user').populate('plan');
        if (!subscription) {
            return res.status(404).json({ success: false, message: "Subscription not found" });
        }
        return res.status(200).json({ success: true, subscription });
    } catch (error) {
        console.error("Error getting subscription:", error);
        return res.status(500).json({ success: false, message: "Internal server error || Error getting subscription:" });
    }
};


// Update a subscription
const updateSubscriptionController = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const update = req.body;
        const updatedSubscription = await Subscription.findByIdAndUpdate(subscriptionId, update, { new: true });
        if (!updatedSubscription) {
            return res.status(404).json({ success: false, message: "Subscription not found" });
        }
        return res.status(200).json({ success: true, message: "Subscription updated successfully", subscription: updatedSubscription });
    } catch (error) {
        console.error("Error updating subscription:", error);
        return res.status(500).json({ success: false, message: "Internal server error || erroe in updating subscription" });
    }
};


// Delete a subscription
const deleteSubscriptionController = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const deletedSubscription = await Subscription.findByIdAndDelete(subscriptionId);
        if (!deletedSubscription) {
            return res.status(404).json({ success: false, message: "Subscription not found" });
        }
        return res.status(200).json({ success: true, message: "Subscription deleted successfully" });
    } catch (error) {
        console.error("Error deleting subscription:", error);
        return res.status(500).json({ success: false, message: "Internal server error Error deleting subscription" });
    }
};

const subscriptionCountController = async (req, res) => {
    try {
        console.log('Fetching subscription count...');
        
        if (!Subscription || !mongoose.connection.readyState) {
            console.error('Database not connected or Subscription model not available');
            return res.status(500).json({
                success: false,
                message: 'Internal server error: Database connection issue'
            });
        }

        // Using countDocuments for more accurate count
        const total = await Subscription.countDocuments({});
        
        console.log(`Found ${total} subscriptions`);
        
        return res.status(200).json({
            success: true,
            total,
            message: 'Subscription count retrieved successfully'
        });
        
    } catch (error) {
        console.error('Error in subscriptionCountController:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get subscription count',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}



// Get total revenue
const getTotalRevenueController = async (req, res) => {
    try {
        const result = await Subscription.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$planAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            totalRevenue: result[0]?.totalRevenue || 0,
            totalSubscriptions: result[0]?.count || 0
        });
    } catch (error) {
        console.error('Error in getTotalRevenueController:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching total revenue',
            error: error.message
        });
    }
};

// Get recent subscriptions
const getRecentSubscriptionsController = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('plan', 'name price');
            
        res.status(200).json({
            success: true,
            subscriptions
        });
    } catch (error) {
        console.error('Error in getRecentSubscriptionsController:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent subscriptions',
            error: error.message
        });
    }
};

export { 
    createSubscriptionPlanController, 
    updateSubscriptionController, 
    getAllSubscriptionsController, 
    getSubscriptionController, 
    deleteSubscriptionController, 
    subscriptionCountController, 
    getTotalRevenueController, 
    getRecentSubscriptionsController 
};
