import mongoose, { Schema, Document } from 'mongoose';
import { IIndustry } from '@shared/interfaces/industry.interface';

/**
 * Mongoose schema for the Industry model
 * @description Defines the structure and constraints for industry documents in MongoDB
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives)
 * @requirement Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 * @requirement Industry-specific networks (Technical Specification/1.2 Scope/Core Functionalities)
 */
export const IndustrySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    description: 'Unique identifier name for the industry'
  },
  description: {
    type: String,
    required: true,
    trim: true,
    description: 'Brief description of the industry'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    description: 'Timestamp of industry creation'
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    description: 'Timestamp of last industry update'
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt fields
  toJSON: { virtuals: true }, // Include virtuals when document is converted to JSON
  toObject: { virtuals: true } // Include virtuals when document is converted to a plain object
});

/**
 * Index configuration for the Industry model
 * @description Defines indexes to optimize query performance
 */
IndustrySchema.index({ name: 1 }, { unique: true });
IndustrySchema.index({ createdAt: 1, updatedAt: 1 });

/**
 * Mongoose pre-save middleware to update the updatedAt timestamp
 * @description Automatically updates the updatedAt field before saving the document
 */
IndustrySchema.pre<IIndustry & Document>('save', function(next: mongoose.HookNextFunction) {
  this.updatedAt = new Date();
  next();
});

/**
 * Mongoose model for the Industry collection
 * @description Provides an interface to interact with industry documents in the database
 */
export const IndustryModel = mongoose.model<IIndustry & Document>('Industry', IndustrySchema);

/**
 * @fileoverview This file defines the MongoDB model for industries in the Pollen8 platform.
 * It addresses the following requirements:
 * 1. Industry Focus: Defines database model for industry data (Technical Specification/1.1 System Objectives)
 * 2. Multi-industry selection: Supports database operations for industry categorization (Technical Specification/1.2 Scope/Core Functionalities)
 * 3. Industry-specific networks: Enables querying and storage of industry data (Technical Specification/1.2 Scope/Core Functionalities)
 * 
 * The model includes:
 * - A schema definition with fields for name, description, and timestamps
 * - Indexing for optimized query performance
 * - Pre-save middleware to automatically update timestamps
 * - A Mongoose model for database operations
 */