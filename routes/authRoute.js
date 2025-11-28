import express from "express";
import { requireSignIn, isAdmin } from "../Middlewares/authMiddleware.js";
import {
  registerController,
  loginController,
  logoutController,
  forgotPasswordController,
  testController,
  updateProfileController,
  userCountController,
  getAllUsersController,
  getSubscriptionByUser,
  getAllSubscriptionByUser,
  getAllFeedbacksByUser,
} from "../controlllers/authController.js";
import {
  makeAdminController,
  removeAdminController,
  listUsersController,
} from "../controlllers/adminController.js";
import { User } from "../models/User.js";
const router = express.Router();

// Test database connection
router.get("/test-db", async (req, res) => {
  try {
    // Test database connection by counting users
    const userCount = await User.countDocuments();
    console.log("Database connection test successful");
    res.json({
      success: true,
      message: "Database connection successful",
      userCount,
    });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Admin auth check - This will be mounted at /api/v1/auth/admin-auth
router.get("/admin-auth", requireSignIn, isAdmin, async (req, res) => {
  try {
    // Get fresh user data
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      ok: true,
      message: "Admin access granted",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 1,
      },
    });
  } catch (error) {
    console.error("Admin auth check error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying admin status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get total user count - admin only
router.get("/user-count", requireSignIn, isAdmin, userCountController);

// Test route to check user data
router.get("/test-users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json({
      success: true,
      count: users.length,
      users: users.map((user) => ({
        ...user.toObject(),
        isAdmin: user.role === 1,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// Register route
router.post("/register", registerController);

// Logout route
router.post("/logout", logoutController);

// login
router.post("/login", loginController);

// forgot-password
router.post("/forgot-password", forgotPasswordController);

// jwt || get method test

router.get("/test", requireSignIn, isAdmin, testController);

// Get all feedbacks by user
router.get("/get-all-user-feedback", requireSignIn, getAllFeedbacksByUser);

// user auth protect routes || dashboard
router.get("/user-auth", requireSignIn, async (req, res) => {
  try {
    // Get fresh user data
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        ok: false,
      });
    }

    res.status(200).json({
      success: true,
      ok: true,
      message: "User authenticated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 1,
      },
    });
  } catch (error) {
    console.error("User auth check error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying user authentication",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// admin auth protect routes || admin dashboard
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).json({ ok: true });
});

// update profile
router.put("/user-profile", requireSignIn, updateProfileController);

// count profile
router.get("/total-user", userCountController);

// get users
router.get("/get-all-users", getAllUsersController);

router.get("/get-user-plan", requireSignIn, getSubscriptionByUser);

router.get("/get-all-user-plan", requireSignIn, getAllSubscriptionByUser);

router.get("/get-all-user-feedback", requireSignIn, getAllFeedbacksByUser);

// Admin management routes
router.get("/admin/users", requireSignIn, isAdmin, listUsersController);
router.put(
  "/admin/users/:userId/make-admin",
  requireSignIn,
  isAdmin,
  makeAdminController
);
router.put(
  "/admin/users/:userId/remove-admin",
  requireSignIn,
  isAdmin,
  removeAdminController
);

export default router;
