import mongoose, { Schema, Document } from 'mongoose';
import { IInterest } from '../../shared/interfaces/interest.interface';
import { INTERESTS_COLLECTION } from '../constants/collections';

/**
 * Extends the IInterest interface to include Document properties for Mongoose
 */
export interface IInterestDocument extends IInterest, Document {}

/**
 * Mongoose schema for the Interest model
 * @description Defines the structure and validation for interest documents in MongoDB
 * Requirements addressed:
 * 1. Industry Focus (Technical Specification/1.1 System Objectives): Support interest categorization for targeted networking
 * 2. User-Centric Design (Technical Specification/1.2 Scope/User Authentication and Profile Management): Enable interest-based user profiling
 * 3. Data Structure (Technical Specification/2.3.2 Backend Components/DataAccessLayer): Define MongoDB schema for interest data
 */
const interestSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Interest name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Interest name cannot be more than 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Interest category is required'],
    trim: true,
    maxlength: [30, 'Interest category cannot be more than 30 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Compound index to ensure uniqueness of interest name within a category
 */
interestSchema.index({ name: 1, category: 1 }, { unique: true });

/**
 * Pre-save middleware to update the updatedAt timestamp
 */
interestSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

/**
 * Mongoose model for the Interest collection
 */
export const InterestModel = mongoose.model<IInterestDocument>(INTERESTS_COLLECTION, interestSchema);

/**
 * Helper function to create a new interest
 * @param name The name of the interest
 * @param category The category of the interest
 * @returns Promise resolving to the created interest document
 */
export async function createInterest(name: string, category: string): Promise<IInterestDocument> {
  return await InterestModel.create({ name, category });
}

/**
 * Helper function to find an interest by its ID
 * @param id The ID of the interest to find
 * @returns Promise resolving to the found interest document or null if not found
 */
export async function findInterestById(id: string): Promise<IInterestDocument | null> {
  return await InterestModel.findById(id);
}

/**
 * Helper function to find interests by category
 * @param category The category to search for
 * @returns Promise resolving to an array of interest documents
 */
export async function findInterestsByCategory(category: string): Promise<IInterestDocument[]> {
  return await InterestModel.find({ category });
}

/**
 * Helper function to update an interest
 * @param id The ID of the interest to update
 * @param updateData The data to update the interest with
 * @returns Promise resolving to the updated interest document or null if not found
 */
export async function updateInterest(id: string, updateData: Partial<IInterest>): Promise<IInterestDocument | null> {
  return await InterestModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
}

/**
 * Helper function to delete an interest
 * @param id The ID of the interest to delete
 * @returns Promise resolving to the deleted interest document or null if not found
 */
export async function deleteInterest(id: string): Promise<IInterestDocument | null> {
  return await InterestModel.findByIdAndDelete(id);
}

/**
 * @fileoverview This file defines the MongoDB schema and model for interest data in the Pollen8 platform,
 * implementing the data structure and validation for interest documents in the database.
 * It addresses several key requirements from the technical specification:
 * 1. Industry Focus: Supports interest categorization for targeted networking
 * 2. User-Centric Design: Enables interest-based user profiling
 * 3. Data Structure: Defines MongoDB schema for interest data
 * 
 * The file includes:
 * - Mongoose schema definition with field validations
 * - Compound index for ensuring uniqueness of interest name within a category
 * - Pre-save middleware for updating timestamps
 * - Model creation using the standardized collection name
 * - Helper functions for common database operations on interests
 * 
 * This implementation ensures type safety, data integrity, and provides a clean interface
 * for interacting with interest data in the MongoDB database.
 */