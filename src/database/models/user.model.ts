import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../shared/interfaces/user.interface';
import { USERS_COLLECTION } from '../constants/collections';

/**
 * Extends the IUser interface to include Document properties for Mongoose
 */
export interface IUserDocument extends IUser, Document {}

/**
 * Mongoose schema for the User model
 * @description This schema defines the structure and validation for user documents in MongoDB
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives): Implements phone number storage and validation
 * 2. Industry Focus (Technical Specification/1.1 System Objectives): Supports multi-industry selection storage
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives): Stores and calculates network value
 * 4. User Data Structure (Technical Specification/2.3.2 Backend Components/DataAccessLayer): Defines MongoDB schema for user data
 */
const userSchema: Schema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^\+[1-9]\d{1,14}$/.test(v); // E.164 format validation
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  industries: [{
    type: Schema.Types.ObjectId,
    ref: 'Industry',
    required: true,
    validate: {
      validator: function(v: mongoose.Types.ObjectId[]) {
        return v.length >= 1 && v.length <= 5; // Ensure at least 1 and at most 5 industries
      },
      message: 'User must have between 1 and 5 industries'
    }
  }],
  interests: [{
    type: Schema.Types.ObjectId,
    ref: 'Interest',
    required: true,
    validate: {
      validator: function(v: mongoose.Types.ObjectId[]) {
        return v.length >= 1 && v.length <= 10; // Ensure at least 1 and at most 10 interests
      },
      message: 'User must have between 1 and 10 interests'
    }
  }],
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
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: USERS_COLLECTION
});

/**
 * Pre-save middleware to update the network value before saving
 * Requirement addressed: Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
userSchema.pre('save', function(next) {
  if (this.isModified('connectionCount')) {
    this.networkValue = calculateNetworkValue(this.connectionCount);
  }
  next();
});

/**
 * Calculates the user's network value based on their connection count
 * @param connectionCount - The number of connections the user has
 * @returns The calculated network value
 */
function calculateNetworkValue(connectionCount: number): number {
  return connectionCount * 3.14; // As per the technical specification
}

/**
 * Mongoose model for User
 */
export const UserModel = mongoose.model<IUserDocument>('User', userSchema);

/**
 * @fileoverview This file defines the MongoDB schema and model for user data in the Pollen8 platform,
 * implementing the data structure and validation for user documents in the database.
 * It addresses several key requirements from the technical specification:
 * 1. Verified Connections: Implements phone number storage and validation
 * 2. Industry Focus: Supports multi-industry selection storage
 * 3. Quantifiable Networking: Stores and calculates network value
 * 4. User Data Structure: Defines MongoDB schema for user data
 */