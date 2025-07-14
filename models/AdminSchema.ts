import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Interface for the Admin document
export interface IAdmin extends Document {
  username: string;
  password: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: Date;
  loginAttempts: number;
  ipAddress: string[];
  sessionToken: string;
  tokenExpiry: Date;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  resetLoginAttempts(): Promise<void>;
  incLoginAttempts(): Promise<void>;
  addIpAddress(newIp: string): Promise<void>;
}

// Admin Schema
const AdminSchema = new Schema<IAdmin>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    required: true
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  ipAddress: [{
    type: String,
    required: false,
    validate: {
      validator: function(ip: string) {
        if (!ip) return true; // Allow empty IP
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
      },
      message: 'Please enter a valid IP address'
    }
  }],
  
  sessionToken: {
    type: String,
    required: false,
    select: false
  },
  
  tokenExpiry: {
    type: Date,
    required: false
  },
  
  profileImage: {
    type: String,
    required: false,
    default: null
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  versionKey: false
});

// Pre-save middleware to limit ipAddress array to 5 items
AdminSchema.pre('save', function(next) {
  if (this.ipAddress && this.ipAddress.length > 5) {
    this.ipAddress = this.ipAddress.slice(-5); // Keep only the last 5 IPs
  }
  next();
});

// Pre-save middleware to hash password
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
AdminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
AdminSchema.methods.incLoginAttempts = async function(): Promise<void> {
  return this.updateOne({ $inc: { loginAttempts: 1 } });
};

// Method to reset login attempts (call after successful login)
AdminSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({ 
    $set: { 
      loginAttempts: 0,
      lastLogin: new Date()
    } 
  });
};

// Static method to find admin by username or email
AdminSchema.statics.findByUsernameOrEmail = function(identifier: string) {
  return this.findOne({
    $or: [
      { username: identifier },
      { email: identifier }
    ]
  }).select('+password');
};

// Method to add new IP address (maintains max 5 IPs)
AdminSchema.methods.addIpAddress = async function(newIp: string): Promise<void> {
  // Add new IP and keep only last 5
  return this.updateOne({
    $push: {
      ipAddress: {
        $each: [newIp],
        $slice: -5 // Keep only the last 5 IPs
      }
    }
  });
};

// **FIX: Check if model already exists before creating it**
// This prevents the "Cannot overwrite model" error in Next.js
export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);