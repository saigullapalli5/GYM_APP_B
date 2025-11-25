const { body, validationResult } = require("express-validator");
const { errorResponse } = require("../utils/responseHandler");

// Validation rules for plan creation/update
exports.validatePlan = [
  body("planName")
    .trim()
    .notEmpty()
    .withMessage("Plan name is required")
    .isLength({ max: 50 })
    .withMessage("Plan name cannot exceed 50 characters"),

  body("monthlyPlanAmount")
    .isFloat({ min: 0 })
    .withMessage("Monthly amount must be a positive number")
    .toFloat(),

  body("yearlyPlanAmount")
    .isFloat({ min: 0 })
    .withMessage("Yearly amount must be a positive number")
    .custom((value, { req }) => {
      if (parseFloat(value) > parseFloat(req.body.monthlyPlanAmount) * 12) {
        throw new Error(
          "Yearly amount cannot be more than 12 times the monthly amount"
        );
      }
      return true;
    })
    .toFloat(),

  body("isPopular")
    .optional()
    .isBoolean()
    .withMessage("isPopular must be a boolean value"),

  // Features validation
  body("features.waterStations")
    .optional()
    .isBoolean()
    .withMessage("Water stations must be a boolean value"),

  body("features.lockerRooms")
    .optional()
    .isBoolean()
    .withMessage("Locker rooms must be a boolean value"),

  body("features.wifiService")
    .optional()
    .isBoolean()
    .withMessage("WiFi service must be a boolean value"),

  body("features.personalTrainer")
    .optional()
    .isBoolean()
    .withMessage("Personal trainer must be a boolean value"),

  // Custom middleware to handle validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
      }));
      return errorResponse(res, "Validation failed", 400, {
        errors: errorMessages,
      });
    }
    next();
  },
];

// Middleware to check if plan exists
exports.checkPlanExists = async (req, res, next) => {
  try {
    const plan = await req.app.locals.db.models.Plan.findById(req.params.id);
    if (!plan) {
      return errorResponse(res, "Plan not found", 404);
    }
    req.plan = plan;
    next();
  } catch (error) {
    console.error("Error checking plan existence:", error);
    return errorResponse(res, "Error checking plan", 500);
  }
};
