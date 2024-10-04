import { Schema, model, Model } from 'mongoose';
import { ILocation } from '@shared/interfaces/location.interface';

/**
 * Mongoose schema for location data storage
 * @description This schema defines the structure for storing location information in MongoDB
 * It addresses the following requirements:
 * 1. Location-Aware User Profiles (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * 2. User-Centric Design (Technical Specification/1.1 System Objectives)
 */
const LocationSchema = new Schema<ILocation>({
  city: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  coordinates: {
    type: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    required: true
  }
}, {
  timestamps: true
});

// Add schema indexes for zipCode (unique) and coordinates (2dsphere)
LocationSchema.index({ zipCode: 1 }, { unique: true });
LocationSchema.index({ coordinates: '2dsphere' });

/**
 * Factory function that creates and returns the Mongoose model for locations
 * @returns Mongoose model for location data
 */
export function createLocationModel(): Model<ILocation> {
  return model<ILocation>('Location', LocationSchema);
}

// Create and export the Location model
const Location = createLocationModel();
export default Location;

/**
 * @description This type represents the document type for the Location model
 */
export type LocationDocument = ILocation & Document;

/**
 * @description This type represents the model type for the Location model
 */
export type LocationModel = Model<LocationDocument>;