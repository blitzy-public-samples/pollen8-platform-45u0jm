import mongoose, { Schema, Document } from 'mongoose';
import { IInvite } from '../interfaces/invite.interface';
import { InviteAnalytics } from '../types/analytics.types';

/**
 * Mongoose schema for the Invite document
 * @description Defines the structure and validation for invite documents in MongoDB
 */
const InviteSchema: Schema = new Schema<IInvite>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Invite name is required'],
    trim: true,
    maxlength: [100, 'Invite name cannot be more than 100 characters'],
  },
  code: {
    type: String,
    required: [true, 'Invite code is required'],
    unique: true,
    trim: true,
    maxlength: [20, 'Invite code cannot be more than 20 characters'],
  },
  clickCount: {
    type: Number,
    default: 0,
    min: [0, 'Click count cannot be negative'],
  },
  dailyClickData: {
    type: Map,
    of: Number,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/**
 * Virtual for generating the full invite URL
 */
InviteSchema.virtual('url').get(function(this: IInvite) {
  return `https://pollen8.com/i/${this.code}`;
});

/**
 * Pre-save hook to generate a unique invite code
 */
InviteSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.code = await generateUniqueCode();
  }
  next();
});

/**
 * Static method to find an invite by its code
 */
InviteSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code, isActive: true });
};

/**
 * Method to increment the click count and update daily click data
 */
InviteSchema.methods.incrementClickCount = async function() {
  const today = new Date().toISOString().split('T')[0];
  this.clickCount += 1;
  this.dailyClickData.set(today, (this.dailyClickData.get(today) || 0) + 1);
  return this.save();
};

/**
 * Method to get analytics data for the invite
 */
InviteSchema.methods.getAnalytics = function(): InviteAnalytics {
  const dailyTrend = Array.from(this.dailyClickData.entries()).map(([date, clicks]) => ({
    date,
    clicks,
  }));

  return {
    totalClicks: this.clickCount,
    dailyTrend,
  };
};

/**
 * Generates a unique, URL-friendly code for invite links
 * @returns A unique code for the invite URL
 */
async function generateUniqueCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const codeLength = 8;
  let code: string;

  do {
    code = Array.from({ length: codeLength }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
  } while (await mongoose.model('Invite').findOne({ code }));

  return code;
}

/**
 * Interface for the Invite document with Mongoose document methods
 */
export interface InviteDocument extends IInvite, Document {
  url: string;
  incrementClickCount(): Promise<InviteDocument>;
  getAnalytics(): InviteAnalytics;
}

/**
 * Mongoose model for the Invite document
 */
export const InviteModel = mongoose.model<InviteDocument>('Invite', InviteSchema);

/**
 * @fileoverview This file defines the MongoDB schema for invite documents in the Pollen8 platform,
 * ensuring data consistency and validation at the database level.
 * 
 * It addresses the following requirements:
 * 1. Invitation System: Define database schema for trackable invite links (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 2. Analytics Visualization: Structure schema to support invite performance tracking (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 3. Data-Driven Networking: Enable quantifiable tracking of invite effectiveness (Technical Specification/1.2 Scope/Benefits)
 * 
 * Notes:
 * - The schema includes methods for incrementing click count and retrieving analytics data
 * - A pre-save hook ensures that each invite has a unique code
 * - The virtual 'url' field generates the full invite URL
 * - The schema supports the storage of daily click data for detailed analytics
 */