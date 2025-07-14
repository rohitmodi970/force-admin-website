import mongoose, { Schema, Document } from "mongoose";
import { nanoid } from "nanoid";

export interface IWaitList extends Document {
  email: string;
  userWaitlistId: string;
  formResponses: Record<string, any>;
  status?: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WaitListSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    userWaitlistId: {
      type: String,
      default: () => nanoid(10),
      unique: true,
      required: true,
    },
    formResponses: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true,
    collection: "wait_lists",
  }
);

// Add indexes for better performance
WaitListSchema.index({ email: 1 });
WaitListSchema.index({ userWaitlistId: 1 });
WaitListSchema.index({ createdAt: -1 });
WaitListSchema.index({ status: 1 });

export default mongoose.models.WaitList || mongoose.model<IWaitList>("WaitList", WaitListSchema);