import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileBanner } from '@components/profile/ProfileBanner';
import { IndustrySelector } from '@components/profile/IndustrySelector';
import { InterestSelector } from '@components/profile/InterestSelector';
import { LocationPicker } from '@components/profile/LocationPicker';
import { useAuth } from '@hooks/useAuth';
import { ApiService } from '@services/api';
import { IUser } from '@shared/interfaces/user.interface';
import { MIN_INDUSTRIES, MIN_INTERESTS } from '@shared/constants';
import { Button } from '@components/common/Button';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

/**
 * Profile component
 * @description The main profile page component that orchestrates the display and management of user profile information.
 * @requirement User-Centric Design (Technical Specification/1.1 System Objectives)
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives)
 * @requirement Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
const Profile: React.FC = () => {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await ApiService.getProfileData();
        setProfileData(data);
      } catch (err) {
        setError('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchProfileData();
    }
  }, [isAuthenticated, user]);

  const handleProfileUpdate = async (updatedData: Partial<IUser>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedProfile = await ApiService.updateProfile(updatedData);
      setProfileData(updatedProfile);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!profileData) {
    return <div>No profile data available.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileBanner user={profileData} />
      
      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Industries</h2>
          <IndustrySelector
            selectedIndustries={profileData.industries}
            onChange={(industries) => handleProfileUpdate({ industries })}
            error={profileData.industries.length < MIN_INDUSTRIES ? `Please select at least ${MIN_INDUSTRIES} industries.` : undefined}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Interests</h2>
          <InterestSelector
            selectedInterests={profileData.interests}
            onChange={(interests) => handleProfileUpdate({ interests })}
            error={profileData.interests.length < MIN_INTERESTS ? `Please select at least ${MIN_INTERESTS} interests.` : undefined}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Location</h2>
          <LocationPicker
            currentLocation={profileData.location}
            onLocationChange={(location) => handleProfileUpdate({ location })}
          />
        </section>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <Button
          onClick={() => navigate('/network')}
          className="w-full"
        >
          View My Network
        </Button>
      </div>
    </div>
  );
};

export default Profile;

/**
 * @fileoverview This file implements the Profile page component for the Pollen8 platform.
 * It addresses the following requirements:
 * 1. User-Centric Design: Implements a minimalist black and white interface (Technical Specification/1.1 System Objectives)
 * 2. Industry Focus: Displays and enables management of industry-specific networks (Technical Specification/1.1 System Objectives)
 * 3. Quantifiable Networking: Showcases network value calculation and growth tracking (Technical Specification/1.1 System Objectives)
 * 
 * The component provides a comprehensive view of the user's profile, including their industries,
 * interests, and location. It uses various sub-components to manage different aspects of the profile,
 * adhering to the minimalist design principle while providing a rich, interactive user experience.
 * 
 * Key features:
 * - Authentication check and redirection
 * - Profile data fetching and error handling
 * - Industry and interest selection with minimum requirements
 * - Location picking functionality
 * - Real-time profile updates
 * - Responsive design using Tailwind CSS
 * - Accessibility considerations with proper heading structure and error messaging
 */