// models/BetaUsers.ts
import mongoose, { Schema, Document } from "mongoose";


export interface IBetaUsers extends Document {
  userId: string;
  email: string;
  formResponses: Record<string, any>;
  waitListId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BetaUsersSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    formResponses: {
      type: Schema.Types.Mixed,
      default: {},
    },
    waitListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaitList', // 👈 model name, not collection name
      required: true,
      unique: true, // Optional: enforces 1:1 mapping
    }
  },
  {
    timestamps: true,
    collection: "beta_users",
  }
);

// Add auto-increment functionality for userId with flexible format
BetaUsersSchema.pre('save', async function (next) {
    if (this.isNew && !this.userId) {
        try {
            let isUnique = false;
            let newUserId: string = '';

            while (!isUnique) {
                // Generate 2-3 random letters
                const letterCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 letters
                let letters = '';
                for (let i = 0; i < letterCount; i++) {
                    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
                    letters += Math.random() < 0.5 ? randomLetter : randomLetter.toLowerCase();
                }

                // Generate 4-5 random numbers to make total length around 7
                const numberCount = 7 - letterCount;
                const numbers = Math.floor(Math.random() * Math.pow(10, numberCount)).toString().padStart(numberCount, '0');

                // Ensure R and F are included (either uppercase or lowercase)
                const hasR = letters.toLowerCase().includes('r');
                const hasF = letters.toLowerCase().includes('f');

                if (!hasR) {
                    // Replace a random letter with R or r
                    const randomCase = Math.random() < 0.5 ? 'R' : 'r';
                    letters = letters.substring(0, Math.floor(Math.random() * letters.length)) + randomCase + letters.substring(Math.floor(Math.random() * letters.length) + 1);
                }

                if (!hasF) {
                    // Replace a random letter with F or f (but not the same position as R)
                    const availablePositions = [];
                    for (let i = 0; i < letters.length; i++) {
                        if (letters[i].toLowerCase() !== 'r') {
                            availablePositions.push(i);
                        }
                    }
                    if (availablePositions.length > 0) {
                        const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
                        const randomCase = Math.random() < 0.5 ? 'F' : 'f';
                        letters = letters.substring(0, randomPos) + randomCase + letters.substring(randomPos + 1);
                    }
                }

                // Combine letters and numbers in random positions
                const combined = (letters + numbers).split('');
                for (let i = combined.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [combined[i], combined[j]] = [combined[j], combined[i]];
                }

                newUserId = combined.join('');

                // Check if this userId already exists
                const existingUser = await (this.constructor as mongoose.Model<IBetaUsers>).findOne({ userId: newUserId });

                if (!existingUser) {
                    isUnique = true;
                }
            }

            this.userId = newUserId;
        } catch (error) {
            return next(error as Error);
        }
    }
    next();
});

// Create a compound index for better performance
BetaUsersSchema.index({ userId: 1 });
BetaUsersSchema.index({ email: 1 });

// Export the model
// Check if the model already exists before creating a new one to prevent overwrite errors
export default mongoose.models.BetaUsers || mongoose.model<IBetaUsers>("BetaUsers", BetaUsersSchema);