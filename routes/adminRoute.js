import express from "express";
import { isAdmin, requireSignIn } from "../Middlewares/authMiddleware.js";
import {
  subscriptionCountController,
  getTotalRevenueController,
  getRecentSubscriptionsController,
} from "../controlllers/subscriptionController.js";
import { deleteUserController } from "../controlllers/adminController.js";
import {
  contactCountController,
  getRecentContactsController,
} from "../controlllers/contactController.js";
import {
  feedbackCountController,
  getRecentFeedbacksController,
} from "../controlllers/feedbackController.js";
import {
  userCountController,
  getAllUsersController,
} from "../controlllers/authController.js";
import { planCountController } from "../controlllers/PlanCategoryController.js";
import { getAllSubscriptionsController } from "../controlllers/subscriptionController.js";

// Add request logging middleware
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

const router = express.Router();

// Apply request logging to all admin routes
router.use(logRequest);

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`Error in ${req.method} ${req.originalUrl}:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  });
};

// Subscribers list
router.get(
  "/subscribers",
  requireSignIn,
  isAdmin,
  asyncHandler(getAllSubscriptionsController)
);

// Dashboard statistics - count endpoints
router.get(
  "/users/count",
  requireSignIn,
  isAdmin,
  asyncHandler(userCountController)
);
router.get(
  "/plans/count",
  requireSignIn,
  isAdmin,
  asyncHandler(planCountController)
);
router.get(
  "/subscriptions/count",
  requireSignIn,
  isAdmin,
  asyncHandler(subscriptionCountController)
);
router.get(
  "/contacts/count",
  requireSignIn,
  isAdmin,
  asyncHandler(contactCountController)
);
router.get(
  "/feedbacks/count",
  requireSignIn,
  isAdmin,
  asyncHandler(feedbackCountController)
);
router.get(
  "/revenue/total",
  requireSignIn,
  isAdmin,
  asyncHandler(getTotalRevenueController)
);

// Data listing endpoints
router.get(
  "/users",
  requireSignIn,
  isAdmin,
  asyncHandler(getAllUsersController)
);
router.delete(
  "/users/:userId",
  requireSignIn,
  isAdmin,
  asyncHandler(deleteUserController)
);
router.get(
  "/subscriptions",
  requireSignIn,
  isAdmin,
  asyncHandler(getAllSubscriptionsController)
);

// Recent activities
router.get(
  "/recent-subscriptions",
  requireSignIn,
  isAdmin,
  asyncHandler(getRecentSubscriptionsController)
);
router.get(
  "/recent-contacts",
  requireSignIn,
  isAdmin,
  asyncHandler(getRecentContactsController)
);
router.get(
  "/recent-feedbacks",
  requireSignIn,
  isAdmin,
  asyncHandler(getRecentFeedbacksController)
);

// 404 handler for admin routes
router.use((req, res) => {
  console.warn(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

export default router;
