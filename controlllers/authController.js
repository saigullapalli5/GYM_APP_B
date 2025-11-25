// import User from "../models/User.js";
import { User } from "../models/User.js";
import Plan from "../models/Plan.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import Subscription from "../models/Subscription.js";
import Feedback from "../models/Feedback.js";


const registerController = async (req, res) => {
    try {
        const { name, email, password, city, contact, role } = req.body;

        console.log('Registration request received:', { name, email, role, type: typeof role });

        // Basic validations
        if (!name) return res.status(400).json({ message: "Name is Required" });
        if (!email) return res.status(400).json({ message: "Email is Required" });
        if (!password) return res.status(400).json({ message: "Password is Required" });
        if (!city) return res.status(400).json({ message: "City is Required" });
        if (!contact) return res.status(400).json({ message: "Contact is Required" });

        // Check if user already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered. Please login."
            });
        }

        // Process role - ensure it's a number (0 or 1)
        let userRole = 0; // Default to regular user
        const roleValue = parseInt(role, 10);
        if (roleValue === 1 || role === '1' || role === 'admin') {
            userRole = 1;
        }
        
        console.log('Role processing:', {
            rawRole: role,
            roleType: typeof role,
            parsedRole: roleValue,
            finalRole: userRole
        });
        
        console.log('Processing registration:', { 
            email,
            rawRole: role, 
            roleType: typeof role,
            finalRole: userRole 
        });

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        
        // Create user with explicit role
        const userData = {
            name,
            email,
            password: hashedPassword,
            city,
            contact,
            role: userRole
        };
        
        console.log('User data before save:', JSON.stringify(userData, null, 2));
        
        const user = new User(userData);
        console.log('User document before save:', JSON.stringify(user, null, 2));
        
        // Save and verify
        await user.save();
        
        // Fetch the saved user with virtual fields (without password)
        const savedUser = await User.findById(user._id)
            .select('-password')
            .lean();
            
        // Add isAdmin field based on role
        const userWithAdminFlag = {
            ...savedUser,
            isAdmin: savedUser.role === 1
        };
        
        // Log the saved user details
        console.log('User registration successful:', JSON.stringify({
            _id: savedUser._id,
            email: savedUser.email,
            role: savedUser.role,
            roleType: typeof savedUser.role,
            isAdmin: userWithAdminFlag.isAdmin
        }, null, 2));
        
        // Return success response with user data including isAdmin
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: userWithAdminFlag
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "error in registration",
            error
        });
    }

}

const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user and explicitly select the role field
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('Login failed: Email not found');
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            console.log('Login failed: Invalid password');
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Create JWT token with role
        const token = JWT.sign(
            { 
                _id: user._id, 
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: "7d" }
        );

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        // Prepare user data for response with isAdmin flag
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isAdmin: user.role === 1,
            city: user.city,
            contact: user.contact,
            token: token // Also include token in response for client-side storage if needed
        };

        console.log('Login successful:', { 
            userId: user._id, 
            role: user.role,
            isAdmin: userData.isAdmin,
            roleType: typeof user.role
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: userData,
            token
        });
    }

    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error in login",
            err
        })
    }

}



// forgotPassword controller
const forgotPasswordController = async (req, res) => {

    try {
        const { email, newPassword} = req.body;

        if (!email) {
            return res.json({ message: "Email is required" });
        }
        
        if (!newPassword) {
            return res.json({ message: "New Password is required" });
        }
        
        const user = await User.findOne({email});

        if (!user) {
           return res.status(404).json({
                message:"Wrong Email or Question",
                success:false,
            });
        }

        const hashedPassword = await hashPassword(newPassword);

        await User.findByIdAndUpdate(user._id, {password: hashedPassword});

        res.status(200).json({
            message:"password change successfully",
            success:true,
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"something went wrong",
            success:false,
            error
        });
    }

}


// update profile

const updateProfileController = async (req, res) => {
    try {
      const { name, email, password, city, contact } = req.body;
      const user = await User.findById(req.user._id);
      //password
      if (password && password.length < 6) {
        return res.json({ error: "Passsword is required and 6 character long" });
      }
      const hashedPassword = password ? await hashPassword(password) : undefined;
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          name: name || user.name,
          password: hashedPassword || user.password,
          contact: contact || user.contact,
          city: city || user.city,
        },
        { new: true }
      );
      res.status(200).send({
        success: true,
        message: "Profile Updated SUccessfully",
        updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({
        success: false,
        message: "Error WHile Update profile",
        error,
      });
    }
  };




// Logout controller
const logoutController = async (req, res) => {
    try {
        // Get token from header or cookies
        const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            return res.status(200).json({
                success: true,
                message: "Already logged out"
            });
        }

        // Clear the token cookie with all possible variations
        const cookieOptions = {
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined
        };

        // Clear all possible auth cookies
        ['token', 'auth_token', 'jwt', 'session'].forEach(cookieName => {
            res.cookie(cookieName, '', { ...cookieOptions, maxAge: 0 });
            // Clear for all possible domains
            res.cookie(cookieName, '', { ...cookieOptions, domain: `.${req.hostname}`, maxAge: 0 });
            res.cookie(cookieName, '', { ...cookieOptions, domain: req.hostname, maxAge: 0 });
        });

        // Clear the Authorization header
        res.removeHeader('Authorization');

        // Optionally: Add token to blacklist if using token blacklisting
        // await BlacklistedToken.create({ token });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Error during logout",
            error: error.message
        });
    }
};

const testController = (req, res) => {
    res.status(200).json({
       message:"routes is required",
       success:true,
   })
   console.log("routes protected");
   }

   
const userCountController = async (req, res) => {
    try {
        console.log('Fetching user count...');
        const total = await User.countDocuments({});
        console.log('Total users:', total);
        return res.status(200).json({
            success: true,
            total
        });
    } catch (error) {
        console.error('Error in userCountController:', error);
        return res.status(500).json({
            success: false, 
            message: "Error getting user count",
            error: error.message
        });
    }
};

const getAllUsersController = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Build search query
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await User.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Get paginated users
        const users = await User.find(query)
            .select('-password') // Exclude password field
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            users,
            total,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error in getAllUsersController:', error);
        res.status(500).json({
            success: false, 
            message: 'Error getting users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}



// Route to fetch user's subscription details
const getSubscriptionByUser = async (req, res) => {
    try {
        // Fetch subscription details including connected plan for the authenticated user
        const subscription = await Subscription.findOne({ user: req.user._id }).populate('plan');
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        res.status(200).json({success:true, subscription});
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllSubscriptionByUser = async (req, res) => {
    try {
        // Fetch subscription details including connected plan for the authenticated user
        const subscription = await Subscription.find({ user: req.user._id }).populate('plan');
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        res.status(200).json({success:true, subscription});
    } catch (error) {
        console.error('Error fetching All subscription:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const getAllFeedbacksByUser = async (req, res) => {
    try {
        // Fetch subscription details including connected plan for the authenticated user
        const newFeedback = await Feedback.find({ user: req.user._id }).populate('user');
        if (!newFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.status(200).json({success:true, newFeedback});
    } catch (error) {
        console.error('Error fetching All Feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//   // user plans
//   const getPlansController = async (req, res) => {
//     try {
//       const plans = await Plan
//         .find({ buyer: req.user._id })
//         .populate("plans")
//         .populate("buyer", "name");
//       res.status(200).json({success:true, plans });
//     } catch (error) {
//       console.log(error);
//       res.status(500).send({
//         success: false,
//         message: "Error WHile Geting Orders",
//         error,
//       });
//     }
//   };
  

// //   get all plans admin

// const getAllPlansController = async (req, res) => {
// try {
//     const plans = await Plan
//     .find({})
//     .populate("plans")
//     .populate("buyer", "name")
//     .sort({createdAt: "-1"})
//      res.status(200).json({success:true, plans });
// } catch (error) {
//     console.log(error);
//     res.status(500).json({
//         success: false,
//         message: "Error WHile Geting all admin plans",
//         error,
//     })
// }
// }


// // order status changes

// const getOrderStatusController = async (req, res) => {
//     try {
//         const {orderId} = req.params;
//         const {status} = req.body;
//         const orders = await Order.findByIdAndUpdate(orderId, {status}, {new:true});
//         res.status(200).json({
//             success: true, orders,
//         })
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             success: false, error, message: "Error in update order",
//         })
//     }
//     }
    




export {
    registerController,
    loginController,
    logoutController,
    forgotPasswordController,
    updateProfileController,
    testController,
    userCountController,
    getAllUsersController,
    getSubscriptionByUser,
    getAllSubscriptionByUser,
    getAllFeedbacksByUser
};