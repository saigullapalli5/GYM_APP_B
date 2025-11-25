import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
// import User from "../models/User.js";

const createplanController = async (req, res) => {
  try {
    const {
      planName,
      monthlyPlanAmount,
      yearlyPlanAmount,
      isPopular = false,
      isActive = true,
      features = {}
    } = req.body;

    // Validate required fields
    if (!planName) {
      return res.status(400).json({
        success: false,
        message: "Plan name is required",
      });
    }
    if (!monthlyPlanAmount) {
      return res.status(400).json({
        success: false,
        message: "Monthly plan amount is required",
      });
    }
    if (!yearlyPlanAmount) {
      return res.status(400).json({
        success: false,
        message: "Yearly plan amount is required",
      });
    }

    // Check if plan with same name already exists (case insensitive)
    const existingPlan = await Plan.findOne({
      planName: { $regex: new RegExp(`^${planName}$`, "i") },
    });

    if (existingPlan) {
      return res.status(409).json({
        success: false,
        message: `A plan with the name "${planName}" already exists`,
      });
    }

    // Create features object with defaults
    const planFeatures = {
      waterStations: features.waterStations || false,
      lockerRooms: features.lockerRooms || false,
      wifiService: features.wifiService || false,
      cardioClass: features.cardioClass || false,
      refreshment: features.refreshment || false,
      groupFitnessClasses: features.groupFitnessClasses || false,
      personalTrainer: features.personalTrainer || false,
      specialEvents: features.specialEvents || false,
      cafeOrLounge: features.cafeOrLounge || false,
    };

    // Create new plan with features
    const newPlan = new Plan({
      planName,
      monthlyPlanAmount: Number(monthlyPlanAmount),
      yearlyPlanAmount: Number(yearlyPlanAmount),
      isPopular: !!isPopular,
      isActive: !!isActive,
      createdBy: req.user._id,
      features: planFeatures
    });
    
    console.log('Creating plan with data:', {
      planName,
      monthlyPlanAmount,
      yearlyPlanAmount,
      isPopular,
      isActive,
      features: planFeatures
    });

    const savedPlan = await newPlan.save();
    console.log('Plan saved successfully:', savedPlan);

    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan: newPlan,
    });
  } catch (error) {
    console.error("Error in createplanController:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// update plan by id:

const updateplanController = async (req, res) => {
  try {
    const {
      planName,
      monthlyPlanAmount,
      yearlyPlanAmount,
      isPopular,
      isActive,
      features = {}
    } = req.body;

    const { planid } = req.params;

    // Ensure all features have boolean values
    const updatedFeatures = {
      waterStations: Boolean(features.waterStations),
      lockerRooms: Boolean(features.lockerRooms),
      wifiService: Boolean(features.wifiService),
      cardioClass: Boolean(features.cardioClass),
      refreshment: Boolean(features.refreshment),
      groupFitnessClasses: Boolean(features.groupFitnessClasses),
      personalTrainer: Boolean(features.personalTrainer),
      specialEvents: Boolean(features.specialEvents),
      cafeOrLounge: Boolean(features.cafeOrLounge),
    };

    const updateData = {
      planName,
      monthlyPlanAmount: Number(monthlyPlanAmount),
      yearlyPlanAmount: Number(yearlyPlanAmount),
      isPopular: Boolean(isPopular),
      isActive: Boolean(isActive),
      features: updatedFeatures
    };

    console.log('Updating plan with data:', JSON.stringify(updateData, null, 2));

    const updateUserPlan = await Plan.findByIdAndUpdate(
      planid,
      updateData,
      { new: true }
    );

    return res.status(200).json({
      message: "plan updated successfully",
      success: true,
      updateUserPlan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "error in plan updating",
      error,
    });
  }
};

// delete by id

// const deleteplanController = async (req, res) => {
//     try {
//         const {planid} = req.params;
//         await Plan.findByIdAndDelete(planid);
//         return res.status(200).json({
//             message: "plan deleted successfully",
//             success: true,
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "error in plan deleting",
//             error
//         });
//     }

// }

//chat gpt code

const deleteplanController = async (req, res) => {
  try {
    const { planid } = req.params;

    // Find subscribers associated with the plan
    const subscribers = await Subscription.find({ plan: planid });

    // Check if there are subscribers associated with the plan
    if (subscribers.length > 0) {
      // Delete each subscriber associated with the plan
      for (const subscriber of subscribers) {
        try {
          // await subscriber.remove();
          await Subscription.deleteOne({ _id: subscriber._id });
        } catch (error) {
          console.error(
            `Error deleting subscriber with ID ${subscriber._id}: ${error.message}`
          );
        }
      }
    }

    // Delete the plan itself
    await Plan.findByIdAndDelete(planid);

    return res.status(200).json({
      message: "Plan and associated subscriptions deleted successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in plan and subscription deletion",
      error: error.message, // Send error message to client for debugging
    });
  }
};

// -------------------------------------------------------------

// get all plan

const getAllPlanController = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    // Add search functionality
    if (search) {
      query = {
        $or: [
          { planName: { $regex: search, $options: "i" } },
          { features: { $elemMatch: { $regex: search, $options: "i" } } },
        ],
      };
    }

    const plans = await Plan.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All plans accessed successfully",
      plans,
    });
  } catch (err) {
    console.error("Error in getAllPlanController:", err);
    res.status(500).json({
      success: false,
      message: "Error in accessing plans",
      error: err.message,
    });
  }
};

const getPlanController = async (req, res) => {
  try {
    const { planid } = req.params;
    const plan = await Plan.findById(planid);
    return res.status(200).json({
      success: true,
      message: "plan accessed successfully",
      plan,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "error in accessing a plan",
    });
  }
};

const planCountController = async (req, res) => {
  try {
    const total = await Plan.find({}).estimatedDocumentCount();
    res.status(200).json({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error,
      message: "Error in total Plan Count",
    });
  }
};

export {
  createplanController,
  updateplanController,
  deleteplanController,
  getAllPlanController,
  getPlanController,
  planCountController,
};
