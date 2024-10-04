import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { ILocation } from '@shared/interfaces/location.interface';
import ApiService from '@frontend/services/api';
import { validateZipCode } from '@frontend/utils/validation';
import Input from '@frontend/components/common/Input';

interface LocationPickerProps {
  onLocationChange: (location: Partial<ILocation>) => void;
  initialLocation?: Partial<ILocation>;
  error?: string;
}

/**
 * A React component that provides a minimalist, user-friendly interface for selecting and validating location information (city and ZIP code) in the Pollen8 platform.
 * 
 * Requirements addressed:
 * - User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * - Location-Aware Profiles (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * 
 * @param {LocationPickerProps} props - The component props
 * @returns {JSX.Element} Rendered component
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationChange,
  initialLocation,
  error
}) => {
  const [location, setLocation] = useState<Partial<ILocation>>(initialLocation || {});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | undefined>(error);

  // Set up debounced ZIP code validation function
  const debouncedZipCodeValidation = useCallback(
    debounce(async (zipCode: string) => {
      setIsLoading(true);
      try {
        const response = await ApiService.validateZipCode(zipCode);
        if (response.success && response.data) {
          setLocation(prevLocation => ({
            ...prevLocation,
            city: response.data.city,
            zipCode: zipCode,
            coordinates: response.data.coordinates
          }));
          setValidationError(undefined);
          onLocationChange({
            city: response.data.city,
            zipCode: zipCode,
            coordinates: response.data.coordinates
          });
        } else {
          setValidationError('Invalid ZIP code. Please try again.');
        }
      } catch (error) {
        setValidationError('Error validating ZIP code. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [onLocationChange]
  );

  // Handle ZIP code input changes
  const handleZipCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = event.target.value;
    const validationResult = validateZipCode(zipCode);
    
    if (validationResult.isValid) {
      setLocation(prevLocation => ({ ...prevLocation, zipCode }));
      debouncedZipCodeValidation(zipCode);
    } else {
      setValidationError(validationResult.error);
    }
  };

  // Handle city input changes
  const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const city = event.target.value;
    setLocation(prevLocation => ({ ...prevLocation, city }));
    onLocationChange({ ...location, city });
  };

  // Update component state when initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  return (
    <div className="space-y-4">
      <Input
        label="ZIP Code"
        variant="zipcode"
        value={location.zipCode || ''}
        onChange={handleZipCodeChange}
        error={validationError}
        disabled={isLoading}
        placeholder="Enter ZIP code"
      />
      <Input
        label="City"
        value={location.city || ''}
        onChange={handleCityChange}
        disabled={isLoading}
        placeholder="City will auto-populate"
      />
      {isLoading && (
        <div className="text-sm text-gray-500">Validating ZIP code...</div>
      )}
    </div>
  );
};

export default LocationPicker;