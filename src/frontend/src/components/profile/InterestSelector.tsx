import React, { useState, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { IInterest } from '@shared/interfaces/interest.interface';
import { INTERESTS, MIN_INTERESTS, MAX_INTERESTS, INTEREST_CATEGORIES } from '@shared/constants/interests';
import Input from '../common/Input';
import Button from '../common/Button';

interface InterestSelectorProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
  error?: string;
}

const InterestSelector: React.FC<InterestSelectorProps> = ({ selectedInterests, onChange, error }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredInterests, setFilteredInterests] = useState<IInterest[]>(INTERESTS);

  // Memoize the filtered and categorized interests
  const categorizedInterests = useMemo(() => {
    const categorized: { [key: string]: IInterest[] } = {};
    filteredInterests.forEach(interest => {
      if (!categorized[interest.category]) {
        categorized[interest.category] = [];
      }
      categorized[interest.category].push(interest);
    });
    return categorized;
  }, [filteredInterests]);

  const handleInterestToggle = useCallback((interestName: string) => {
    const isSelected = selectedInterests.includes(interestName);
    let updatedInterests: string[];

    if (isSelected) {
      updatedInterests = selectedInterests.filter(name => name !== interestName);
    } else {
      if (selectedInterests.length >= MAX_INTERESTS) {
        return; // Don't add if maximum is reached
      }
      updatedInterests = [...selectedInterests, interestName];
    }

    onChange(updatedInterests);
  }, [selectedInterests, onChange]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = INTERESTS.filter(interest => 
      interest.name.toLowerCase().includes(term) || 
      interest.category.toLowerCase().includes(term)
    );
    setFilteredInterests(filtered);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <Input
        type="text"
        placeholder="Search interests..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="mb-4 w-full"
      />
      
      {INTEREST_CATEGORIES.map(category => {
        const interestsInCategory = categorizedInterests[category] || [];
        if (interestsInCategory.length === 0) return null;

        return (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-white">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {interestsInCategory.map(interest => (
                <Button
                  key={interest.name}
                  onClick={() => handleInterestToggle(interest.name)}
                  className={classNames(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    selectedInterests.includes(interest.name)
                      ? 'bg-white text-black'
                      : 'bg-black text-white border border-white'
                  )}
                >
                  {interest.name}
                </Button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-4 text-white">
        <p>Selected: {selectedInterests.length} / {MAX_INTERESTS}</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {selectedInterests.length < MIN_INTERESTS && (
          <p className="text-yellow-500 mt-2">
            Please select at least {MIN_INTERESTS} interests.
          </p>
        )}
      </div>
    </div>
  );
};

export default InterestSelector;

/**
 * @fileoverview This component allows users to select multiple interests from predefined categories.
 * It addresses the following requirements:
 * 1. Multi-interest Selection: Enable selection of 3-7 interests per user (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * 2. User-Centric Design: Implement black and white minimalist interface (Technical Specification/1.1 System Objectives/User-Centric Design)
 * 3. Industry Focus: Complement industry selection with interests (Technical Specification/1.2 Scope/Core Functionalities)
 * 
 * The component features:
 * - A search input for filtering interests
 * - Categorized display of interests
 * - Visual feedback for selected interests
 * - Enforcement of minimum and maximum interest selection
 * - Error display for invalid selections
 * 
 * Note: This component assumes the existence of common Input and Button components,
 * as well as shared interfaces and constants for interests.
 */