import React, { useState, useCallback } from 'react';
import classNames from 'classnames';
import { IIndustry } from '@shared/interfaces/industry.interface';
import { INDUSTRIES, MIN_INDUSTRIES, MAX_INDUSTRIES } from '@shared/constants/industries';
import { Input } from '../common/Input';

/**
 * Props interface for the IndustrySelector component
 * @description Defines the expected props for the IndustrySelector component
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives)
 * @requirement Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 */
interface IndustrySelectorProps {
  selectedIndustries: string[];
  onChange: (industries: string[]) => void;
  error?: string;
}

/**
 * IndustrySelector component
 * @description A functional component that renders a multi-select interface for industries
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives)
 * @requirement Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 * @requirement User-Centric Design (Technical Specification/1.1 System Objectives)
 */
export const IndustrySelector: React.FC<IndustrySelectorProps> = ({ selectedIndustries, onChange, error }) => {
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Handles the toggling of industry selection within allowed limits
   * @param industryName - The name of the industry to toggle
   */
  const handleIndustryToggle = useCallback((industryName: string) => {
    const isSelected = selectedIndustries.includes(industryName);
    if (isSelected && selectedIndustries.length <= MIN_INDUSTRIES) {
      return; // Prevent deselection if at minimum industries
    }
    if (!isSelected && selectedIndustries.length >= MAX_INDUSTRIES) {
      return; // Prevent selection if at maximum industries
    }
    const updatedIndustries = isSelected
      ? selectedIndustries.filter(i => i !== industryName)
      : [...selectedIndustries, industryName];
    onChange(updatedIndustries);
  }, [selectedIndustries, onChange]);

  /**
   * Filters industries based on the search term
   */
  const filteredIndustries = INDUSTRIES.filter(industry =>
    industry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <Input
        type="text"
        placeholder="Search industries..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredIndustries.map((industry: IIndustry) => (
          <button
            key={industry._id.toString()}
            onClick={() => handleIndustryToggle(industry.name)}
            className={classNames(
              'p-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black',
              {
                'bg-black text-white': selectedIndustries.includes(industry.name),
                'bg-white text-black border border-black': !selectedIndustries.includes(industry.name),
              }
            )}
            aria-pressed={selectedIndustries.includes(industry.name)}
          >
            {industry.name}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      <p className="mt-4 text-sm text-gray-600">
        Select {MIN_INDUSTRIES}-{MAX_INDUSTRIES} industries (Selected: {selectedIndustries.length})
      </p>
    </div>
  );
};

/**
 * @fileoverview This file implements the IndustrySelector component for the Pollen8 platform.
 * It addresses the following requirements:
 * 1. Industry Focus: Enables selection of multiple industries (Technical Specification/1.1 System Objectives)
 * 2. Multi-industry selection: Allows users to select 3-5 industries (Technical Specification/1.2 Scope/Core Functionalities)
 * 3. User-Centric Design: Implements black and white minimalist interface (Technical Specification/1.1 System Objectives)
 * 
 * The component provides a searchable, grid-based selection interface for industries, enforcing the
 * minimum and maximum selection limits. It uses Tailwind CSS for styling, adhering to the black and white
 * minimalist design principle.
 */