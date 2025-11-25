import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    contact: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit contact number']
    },
    role: {
        type: Number,
        required: true,
        default: 0,
        enum: [0, 1], // 0 = user, 1 = admin
        validate: {
            validator: Number.isInteger,
            message: 'Role must be an integer (0 or 1)'
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for isAdmin
userSchema.virtual('isAdmin').get(function() {
    return this.role === 1;
});

const User = mongoose.model("User", userSchema);

// export default User;
export {User};

