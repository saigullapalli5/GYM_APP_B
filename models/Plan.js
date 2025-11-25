import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: [true, "Plan name is required"],
    trim: true,
    maxlength: [50, "Plan name cannot exceed 50 characters"],
    unique: true,
  },
  monthlyPlanAmount: {
    type: Number,
    required: [true, "Monthly plan amount is required"],
    min: [0, "Monthly amount cannot be negative"],
  },
  yearlyPlanAmount: {
    type: Number,
    required: [true, "Yearly plan amount is required"],
    min: [0, "Yearly amount cannot be negative"],
    validate: {
      validator: function (value) {
        // Yearly amount should be less than 12 * monthly amount
        return value <= this.monthlyPlanAmount * 12;
      },
      message:
        "Yearly amount should be less than or equal to 12 times the monthly amount",
    },
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  features: {
    waterStations: {
      type: Boolean,
      default: false,
    },
    lockerRooms: {
      type: Boolean,
      default: false,
    },
    wifiService: {
      type: Boolean,
      default: false,
    },
    cardioClass: {
      type: Boolean,
      default: false,
    },
    refreshment: {
      type: Boolean,
      default: false,
    },
    groupFitnessClasses: {
      type: Boolean,
      default: false,
    },
    personalTrainer: {
      type: Boolean,
      default: false,
    },
    specialEvents: {
      type: Boolean,
      default: false,
    },
    cafeOrLounge: {
      type: Boolean,
      default: false,
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index for frequently queried fields
planSchema.index({ planName: 1 });
planSchema.index({ isActive: 1 });
planSchema.index({ isPopular: 1, monthlyPlanAmount: 1 });

// Virtual for saving amount (in cents)
planSchema.virtual("monthlyAmountInCents").get(function () {
  return Math.round(this.monthlyPlanAmount * 100);
});

planSchema.virtual("yearlyAmountInCents").get(function () {
  return Math.round(this.yearlyPlanAmount * 100);
});

// Ensure virtuals are included in toJSON output
planSchema.set("toJSON", { virtuals: true });
planSchema.set("toObject", { virtuals: true });

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
