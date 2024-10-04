import { Schema, Document } from 'mongoose';
import { IUser } from '../interfaces/user.interface';
import { UserRole } from '../enums/userRole.enum';

/**
 * MongoDB schema for user data in the Pollen8 platform
 * This schema ensures data consistency and validation at the database level
 * while adhering to the platform's minimalist, data-driven approach.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 *   Define schema for phone number verification
 * - Industry Focus (Technical Specification/1.1 System Objectives)
 *   Schema structure for multi-industry selection
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *   Schema fields for network value tracking
 * - User Data Integrity (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 *   Enforce data validation at schema level
 */

// Collection name constant
export const USER_COLLECTION = 'users';

// Minimum requirements constants
const MINIMUM_INDUSTRIES = 3;
const MINIMUM_INTERESTS = 3;
const NETWORK_VALUE_PER_CONNECTION = 3.14;

// User schema definition
export const UserSchema = new Schema<IUser & Document>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Add a custom validator for phone number format if needed
  },
  industries: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Industry' }],
    validate: [
      (v: any[]) => v.length >= MINIMUM_INDUSTRIES,
      `At least ${MINIMUM_INDUSTRIES} industries are required.`
    ]
  },
  interests: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Interest' }],
    validate: [
      (v: any[]) => v.length >= MINIMUM_INTERESTS,
      `At least ${MINIMUM_INTERESTS} interests are required.`
    ]
  },
  location: {
    city: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  networkValue: {
    type: Number,
    default: 0,
    min: 0
  },
  connectionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
UserSchema.index({ phoneNumber: 1 });
UserSchema.index({ industries: 1 });
UserSchema.index({ interests: 1 });
UserSchema.index({ 'location.zipCode': 1 });

/**
 * Calculate and update the user's network value based on connection count
 * This method adheres to the Quantifiable Networking objective
 */
UserSchema.methods.calculateNetworkValue = function(): number {
  this.networkValue = this.connectionCount * NETWORK_VALUE_PER_CONNECTION;
  return this.networkValue;
};

// Pre-save hook to ensure networkValue is calculated before saving
UserSchema.pre('save', function(next) {
  if (this.isModified('connectionCount')) {
    this.calculateNetworkValue();
  }
  next();
});

/**
 * This schema supports the core functionalities of the Pollen8 platform:
 * 1. User Authentication: Unique phone number for verification
 * 2. Profile Management: Industries, interests, and location data
 * 3. Network Management: Connection count and network value calculation
 * 4. Data Integrity: Validation rules and minimum requirements
 * 
 * The schema is designed to be efficient for querying and indexing,
 * supporting the platform's data-driven approach to professional networking.
 */

export default UserSchema;