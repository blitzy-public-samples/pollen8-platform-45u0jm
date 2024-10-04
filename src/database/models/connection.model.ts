import mongoose, { Schema, Document } from 'mongoose';
import { IConnection, ConnectionStatus } from '../../shared/interfaces/connection.interface';
import { CONNECTIONS_COLLECTION } from '../constants/collections';

/**
 * Extends the IConnection interface to include Document properties for Mongoose
 */
export interface IConnectionDocument extends IConnection, Document {}

/**
 * Mongoose schema for the Connection model
 * @description Defines the structure and validation for connection documents in MongoDB
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * 4. Connection Data Structure (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
const connectionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  connectedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(ConnectionStatus),
    default: ConnectionStatus.PENDING,
    required: true
  },
  sharedIndustries: [{
    type: String,
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt fields
  collection: CONNECTIONS_COLLECTION // Use the standardized collection name
});

/**
 * Calculates and updates the shared industries between connected users
 * @description This method is called before saving a connection to ensure shared industries are up-to-date
 */
connectionSchema.methods.calculateSharedIndustries = async function(): Promise<void> {
  const User = mongoose.model('User');
  const [user, connectedUser] = await Promise.all([
    User.findById(this.userId),
    User.findById(this.connectedUserId)
  ]);

  if (user && connectedUser) {
    this.sharedIndustries = user.industries.filter(industry => 
      connectedUser.industries.includes(industry)
    );
  }
};

/**
 * Pre-save hook to update shared industries and user connection counts
 */
connectionSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === ConnectionStatus.ACCEPTED) {
    await this.calculateSharedIndustries();
    const User = mongoose.model('User');
    await Promise.all([
      User.findByIdAndUpdate(this.userId, { $inc: { connectionCount: 1 } }),
      User.findByIdAndUpdate(this.connectedUserId, { $inc: { connectionCount: 1 } })
    ]);
  }
  this.updatedAt = new Date();
  next();
});

/**
 * Post-remove hook to decrement user connection counts when an accepted connection is removed
 */
connectionSchema.post('remove', async function(doc) {
  if (doc.status === ConnectionStatus.ACCEPTED) {
    const User = mongoose.model('User');
    await Promise.all([
      User.findByIdAndUpdate(doc.userId, { $inc: { connectionCount: -1 } }),
      User.findByIdAndUser(doc.connectedUserId, { $inc: { connectionCount: -1 } })
    ]);
  }
});

/**
 * Compound index to ensure uniqueness of connections between users
 */
connectionSchema.index({ userId: 1, connectedUserId: 1 }, { unique: true });

/**
 * Mongoose model for the Connection schema
 */
export const ConnectionModel = mongoose.model<IConnectionDocument>('Connection', connectionSchema);

/**
 * @fileoverview This file defines the MongoDB schema and model for connection data in the Pollen8 platform,
 * implementing the data structure and validation for connection documents in the database.
 * It addresses the following requirements:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * 4. Connection Data Structure (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */