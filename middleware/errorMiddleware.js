/**
 * Error handling middleware for Express
 * Handles different types of errors and sends appropriate responses
 */

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.stack);

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = [];

  // Handle validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
    errors = [
      {
        field: Object.keys(err.keyPattern)[0],
        message: `This ${Object.keys(err.keyPattern)[0]} is already in use`,
      },
    ];
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  // Handle JWT expired error
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length ? errors : undefined,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

// 404 Not Found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export { errorHandler, notFound };
