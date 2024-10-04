import mongoose, { Schema, Document } from 'mongoose';
import { IConnection, ConnectionStatus } from '@shared/interfaces/connection.interface';
import { NETWORK_VALUE_PER_CONNECTION } from '@shared/constants/networkValue';

/**
 * Interface extending the base IConnection with Mongoose document methods
 * @description This interface adds Mongoose-specific functionality to the base IConnection interface
 */
export interface IConnectionDocument extends IConnection, Document {
  /**
   * Calculates and updates the shared industries between connected users
   * @returns Promise<void>
   */
  calculateSharedIndustries(): Promise<void>;

  /**
   * Updates the network values for both users in the connection
   * @returns Promise<void>
   */
  updateNetworkValues(): Promise<void>;
}

/**
 * Mongoose schema for connections
 * @description Defines the structure and behavior of connection documents in MongoDB
 */
const ConnectionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  connectedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(ConnectionStatus),
    default: ConnectionStatus.INITIATED,
    required: true,
  },
  sharedIndustries: [{
    type: String,
    ref: 'Industry',
  }],
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
});

/**
 * Calculate shared industries between connected users
 * @description This method fetches the industries of both users and updates the sharedIndustries field
 */
ConnectionSchema.methods.calculateSharedIndustries = async function(): Promise<void> {
  const User = mongoose.model('User');
  const [user, connectedUser] = await Promise.all([
    User.findById(this.userId).select('industries'),
    User.findById(this.connectedUserId).select('industries'),
  ]);

  if (user && connectedUser) {
    this.sharedIndustries = user.industries.filter(industry => 
      connectedUser.industries.includes(industry)
    );
    await this.save();
  }
};

/**
 * Update network values for both users in the connection
 * @description This method increments the network value for both users when a connection is accepted
 */
ConnectionSchema.methods.updateNetworkValues = async function(): Promise<void> {
  if (this.status === ConnectionStatus.ACCEPTED) {
    const User = mongoose.model('User');
    await User.updateMany(
      { _id: { $in: [this.userId, this.connectedUserId] } },
      { $inc: { networkValue: NETWORK_VALUE_PER_CONNECTION } }
    );
  }
};

/**
 * Pre-save hook to ensure userId !== connectedUserId
 */
ConnectionSchema.pre('save', function(next) {
  if (this.userId.equals(this.connectedUserId)) {
    next(new Error('A user cannot connect with themselves'));
  } else {
    next();
  }
});

/**
 * Pre-save hook to calculate shared industries
 */
ConnectionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('status')) {
    await this.calculateSharedIndustries();
  }
  next();
});

/**
 * Pre-save hook to update network values
 */
ConnectionSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === ConnectionStatus.ACCEPTED) {
    await this.updateNetworkValues();
  }
  next();
});

/**
 * Virtual property for network value
 * @description Returns the constant network value per connection as specified
 */
ConnectionSchema.virtual('networkValue').get(function() {
  return NETWORK_VALUE_PER_CONNECTION;
});

/**
 * Compound index on userId and connectedUserId for efficient queries
 */
ConnectionSchema.index({ userId: 1, connectedUserId: 1 }, { unique: true });

/**
 * Index on status for filtering connections
 */
ConnectionSchema.index({ status: 1 });

/**
 * Index on sharedIndustries for industry-based lookups
 */
ConnectionSchema.index({ sharedIndustries: 1 });

/**
 * Static method to find all connections for a given user
 */
ConnectionSchema.statics.findByUser = function(userId: string) {
  return this.find({ $or: [{ userId }, { connectedUserId: userId }] });
};

/**
 * Static method to find connections sharing specific industries
 */
ConnectionSchema.statics.findByIndustry = function(industry: string) {
  return this.find({ sharedIndustries: industry });
};

/**
 * Query helper to filter connections by status
 */
ConnectionSchema.query.byStatus = function(status: ConnectionStatus) {
  return this.where({ status });
};

/**
 * Query helper to filter connections by shared industry
 */
ConnectionSchema.query.byIndustry = function(industry: string) {
  return this.where({ sharedIndustries: industry });
};

/**
 * Connection model
 * @description Mongoose model for connections, implementing the IConnectionDocument interface
 */
export const Connection = mongoose.model<IConnectionDocument>('Connection', ConnectionSchema);

/**
 * @fileoverview This file defines the MongoDB model for connections between users in the Pollen8 platform.
 * It implements the data structure and business logic for professional networking relationships.
 * 
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives): Implements data model for authentic professional connections
 * 2. Industry Focus (Technical Specification/1.1 System Objectives): Enables industry-specific connection categorization in the database
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives): Supports network value calculation (3.14 per connection)
 */