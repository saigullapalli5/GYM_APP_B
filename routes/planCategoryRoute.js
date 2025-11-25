import express from "express";
import { isAdmin, requireSignIn } from "../Middlewares/authMiddleware.js";
import {
  createplanController,
  updateplanController,
  deleteplanController,
  getAllPlanController,
  getPlanController,
  planCountController,
} from "../controlllers/PlanCategoryController.js";
const router = express.Router();

// @desc    Create a new plan (Admin only)
// @route   POST /api/v1/plan/create-plan
// @access  Private/Admin
router.post("/create-plan", requireSignIn, isAdmin, createplanController);

// @desc    Update a plan (Admin only)
// @route   PUT /api/v1/plan/update-plan/:planid
// @access  Private/Admin
router.put(
  "/update-plan/:planid",
  requireSignIn,
  isAdmin,
  updateplanController
);

// @desc    Delete a plan (Admin only)
// @route   DELETE /api/v1/plan/delete-plan/:planid
// @access  Private/Admin
router.delete(
  "/delete-plan/:planid",
  requireSignIn,
  isAdmin,
  deleteplanController
);

// @desc    Get all active plans
// @route   GET /api/v1/plan/getall-plan
// @access  Public
router.get("/getall-plan", getAllPlanController);

// @desc    Get single plan by ID
// @route   GET /api/v1/plan/get-plan/:planid
// @access  Public
router.get("/get-plan/:planid", getPlanController);

// @desc    Get count of all active plans
// @route   GET /api/v1/plan/plan-count
// @access  Public
router.get("/plan-count", planCountController);

export default router;
