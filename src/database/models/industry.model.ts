import { Schema, model, Document } from 'mongoose';
import { IIndustry } from '../../shared/interfaces/industry.interface';
import { INDUSTRIES } from '../../shared/constants/industries';

/**
 * Collection name for the Industry model
 * @description Defines the name of the MongoDB collection for industries
 * @requirement Data Integrity (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
export const COLLECTION_NAME = 'industries';

/**
 * Interface for Industry document, extending IIndustry and Document
 * @description Extends the shared IIndustry interface with MongoDB document properties
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 */
export interface IIndustryDocument extends IIndustry, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for Industry documents
 * @description Defines the structure and validation for industry data in MongoDB
 * @requirement Data Integrity (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * @requirement Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 */
const IndustrySchema = new Schema<IIndustryDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (value: string) => INDUSTRIES.some(industry => industry.name === value),
        message: 'Invalid industry name'
      }
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME
  }
);

/**
 * Index definition for the Industry model
 * @description Ensures unique industry names for data integrity
 * @requirement Data Integrity (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
IndustrySchema.index({ name: 1 }, { unique: true });

/**
 * Mongoose model for Industry documents
 * @description Creates a MongoDB model for industries based on the defined schema
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 */
export const IndustryModel = model<IIndustryDocument>('Industry', IndustrySchema);

/**
 * @fileoverview This file defines the MongoDB schema and model for industries in the Pollen8 platform,
 * ensuring consistent data structure and validation for industry-related data.
 * 
 * Key features and requirements addressed:
 * 1. Industry Focus: Defines database schema for industry data (Technical Specification/1.1 System Objectives/Industry Focus)
 * 2. Multi-industry selection: Supports data structure for multiple industries (Technical Specification/1.2 Scope/Core Functionalities)
 * 3. Data Integrity: Ensures consistent and validated industry data (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * 
 * The schema enforces the black and white minimalist design by keeping the data structure simple and focused.
 * Industry names are validated against the predefined list in INDUSTRIES constant.
 * Timestamps are automatically managed for creation and updates.
 * The model supports the platform's industry-specific networking feature by providing a robust data structure.
 * The unique index on the name field ensures data integrity and prevents duplicate industries.
 */