import { Schema, model, Document } from 'mongoose';
import { IInvite } from '@shared/interfaces/invite.interface';
import { INVITES_COLLECTION } from '../constants/collections';

/**
 * Extends the IInvite interface with Mongoose Document properties
 */
export interface IInviteDocument extends IInvite, Document {}

/**
 * Mongoose schema for the Invite model
 * @description Implements the tracking and analytics requirements for the invitation system
 */
const InviteSchema = new Schema<IInviteDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
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
    index: true,
  },
  clickCount: {
    type: Number,
    default: 0,
    min: 0,
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
  collection: INVITES_COLLECTION,
});

/**
 * Indexes for optimizing query performance
 */
InviteSchema.index({ userId: 1, createdAt: -1 });
InviteSchema.index({ code: 1 }, { unique: true });

/**
 * Generates a unique code for new invite links
 * @returns A promise that resolves to a unique invite code
 */
InviteSchema.statics.generateUniqueCode = async function(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const codeLength = 8;
  let code: string;

  do {
    code = Array.from({ length: codeLength }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
  } while (await this.findOne({ code }));

  return code;
};

/**
 * Increments the click count and updates daily click data
 * @description Updates the document's click counts in real-time
 */
InviteSchema.methods.incrementClickCount = async function(): Promise<void> {
  this.clickCount += 1;
  const today = new Date().toISOString().split('T')[0];
  const dailyClicks = this.dailyClickData.get(today) || 0;
  this.dailyClickData.set(today, dailyClicks + 1);
  await this.save();
};

/**
 * Mongoose model for the Invite collection
 */
export const InviteModel = model<IInviteDocument>('Invite', InviteSchema);

/**
 * @fileoverview This file defines the MongoDB schema and model for invite documents in the Pollen8 platform,
 * implementing the tracking and analytics requirements for the invitation system.
 * 
 * Requirements addressed:
 * 1. Trackable Invite Links (Technical Specification/1.2 Scope/Core Functionalities/3):
 *    Defines schema for generating and tracking invite links
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3):
 *    Structures data for invite performance tracking
 * 3. One-click Sharing (Technical Specification/1.2 Scope/Core Functionalities/3):
 *    Implements unique code generation for easy link sharing
 * 
 * Notes:
 * - The schema includes indexes for optimizing query performance on frequently accessed fields
 * - The generateUniqueCode static method ensures that each invite has a unique, randomly generated code
 * - The incrementClickCount method provides real-time updating of click analytics
 * - The model uses the INVITES_COLLECTION constant to ensure consistency with other parts of the application
 */