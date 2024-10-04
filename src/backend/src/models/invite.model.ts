import mongoose, { Schema, Document, Model } from 'mongoose';
import { IInvite } from '@shared/interfaces/invite.interface';
import { UserModel } from './user.model';

// Define the collection name as a constant
const COLLECTION_NAME = 'invites';

// Extend the IInvite interface to include Document methods
interface IInviteDocument extends IInvite, Document {
  generateUniqueCode(): Promise<string>;
  updateClickCount(date: Date): Promise<void>;
}

// Define the Mongoose schema for the invite document structure
const InviteSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    maxlength: 8,
  },
  clickCount: {
    type: Number,
    default: 0,
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
});

// Generate a unique 8-character alphanumeric code for the invite link
InviteSchema.methods.generateUniqueCode = async function(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if the code already exists in the database
    const existingInvite = await this.constructor.findOne({ code });
    if (!existingInvite) {
      isUnique = true;
    }
  }

  return code;
};

// Increment the click count and update daily click data
InviteSchema.methods.updateClickCount = async function(date: Date): Promise<void> {
  this.clickCount += 1;
  const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const currentCount = this.dailyClickData.get(dateString) || 0;
  this.dailyClickData.set(dateString, currentCount + 1);
  await this.save();
};

// Pre-save hook to generate a unique code before saving a new invite
InviteSchema.pre<IInviteDocument>('save', async function(next) {
  if (this.isNew) {
    this.code = await this.generateUniqueCode();
  }
  next();
});

// Create and export the Mongoose model for Invite documents
const InviteModel: Model<IInviteDocument> = mongoose.model<IInviteDocument>(COLLECTION_NAME, InviteSchema);

export { InviteModel, IInviteDocument };

/**
 * @fileoverview This file defines the Mongoose model for invites in the Pollen8 platform.
 * It implements the data structure for trackable invite links with analytics capabilities.
 * 
 * Requirements addressed:
 * 1. Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Implements data model for trackable invite links
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Stores and structures invite performance data
 * 3. One-click Sharing (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Defines database schema for easily shareable invites
 * 
 * Key features:
 * - Automatic generation of unique 8-character alphanumeric codes
 * - Tracking of total click count and daily click data
 * - Integration with user model for invite ownership
 * - Support for invite activation/deactivation
 * 
 * Note: This model works in conjunction with the InviteService and InviteRepository
 * to provide full functionality for invite management and analytics.
 */