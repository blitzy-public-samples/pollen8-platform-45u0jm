import mongoose, { Schema, Document, Model } from 'mongoose';
import { IInterest } from '../../../shared/interfaces/interest.interface';

/**
 * Extends the IInterest interface to include mongoose Document properties
 */
export interface IInterestDocument extends IInterest, Document {}

/**
 * Defines the Mongoose schema for the Interest model
 */
const InterestSchema: Schema = new Schema<IInterestDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  versionKey: false,
});

/**
 * Validates that the interest name is unique within its category
 * @param name The name of the interest to validate
 * @returns A Promise that resolves to a boolean indicating whether the interest name is unique in its category
 */
InterestSchema.statics.validateInterestName = async function(name: string): Promise<boolean> {
  const existingInterest = await this.findOne({ name: name.trim().toLowerCase() });
  return !existingInterest;
};

/**
 * Finds all interests within a specific category
 * @param category The category to search for
 * @returns A Promise that resolves to an array of interests in the specified category
 */
InterestSchema.statics.findByCategory = async function(category: string): Promise<IInterest[]> {
  return this.find({ category: category.trim().toLowerCase() });
};

/**
 * Retrieves the most popular interests based on user selection
 * @param limit The maximum number of interests to return
 * @returns A Promise that resolves to an array of popular interests
 */
InterestSchema.statics.findPopularInterests = async function(limit: number): Promise<IInterest[]> {
  return this.aggregate([
    {
      $lookup: {
        from: 'userinterests',
        localField: '_id',
        foreignField: 'interestId',
        as: 'users'
      }
    },
    {
      $project: {
        name: 1,
        category: 1,
        userCount: { $size: '$users' }
      }
    },
    { $sort: { userCount: -1 } },
    { $limit: limit }
  ]);
};

/**
 * Pre-save middleware to ensure the interest name is unique within its category
 */
InterestSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    const isUnique = await (this.constructor as IInterestModel).validateInterestName(this.name);
    if (!isUnique) {
      next(new Error('Interest name must be unique within its category'));
    }
  }
  next();
});

/**
 * Defines the Interest model interface with custom static methods
 */
export interface IInterestModel extends Model<IInterestDocument> {
  validateInterestName(name: string): Promise<boolean>;
  findByCategory(category: string): Promise<IInterest[]>;
  findPopularInterests(limit: number): Promise<IInterest[]>;
}

/**
 * Creates and exports the Mongoose model for Interest
 */
export const InterestModel = mongoose.model<IInterestDocument, IInterestModel>('Interest', InterestSchema);

/**
 * @fileoverview This file defines the Mongoose model for interests in the Pollen8 platform,
 * providing the database schema and model methods for interest-related operations.
 * 
 * Requirements addressed:
 * 1. Industry Focus (Technical Specification/1.1 System Objectives): Supports interest-based networking
 * 2. Multi-interest Selection (Technical Specification/1.2 Scope/User Authentication and Profile Management): Enables users to select multiple interests
 * 3. User-Centric Design (Technical Specification/1.2 Scope/Core Functionalities): Facilitates interest-based user categorization
 * 
 * This model ensures that:
 * - Interest names are unique within categories
 * - Interests can be easily queried by category
 * - Popular interests can be identified for platform insights
 * - The schema aligns with the IInterest interface from the shared types
 */