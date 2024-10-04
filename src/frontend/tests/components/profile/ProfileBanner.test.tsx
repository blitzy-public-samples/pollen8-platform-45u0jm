import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileBanner from '@components/profile/ProfileBanner';
import { useNetwork } from '@hooks/useNetwork';
import { mockUseNetwork } from '../utils/testing';
import { IUser } from '@shared/interfaces/user.interface';

// Mock the useNetwork hook
jest.mock('@hooks/useNetwork');

// Mock the d3Helpers module
jest.mock('@utils/d3Helpers', () => ({
  createStarConstellation: jest.fn(() => ({ cleanup: jest.fn() })),
}));

describe('ProfileBanner', () => {
  const mockUser: IUser = {
    id: 'user123',
    name: 'John Doe',
    industries: ['Technology', 'Finance'],
    phoneNumber: '+1234567890',
    city: 'New York',
    zipCode: '10001',
    createdAt: new Date(),
    lastActive: new Date(),
    networkValue: 15.7,
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  const mockNetworkHook = (networkValue: number) => {
    (useNetwork as jest.Mock).mockReturnValue({ networkValue });
  };

  it('renders ProfileBanner correctly', () => {
    mockNetworkHook(15.7);
    render(<ProfileBanner user={mockUser} />);

    // Assert presence of user name
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Assert presence of industries
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();

    // Assert NetworkValue component is rendered
    expect(screen.getByTestId('network-value')).toBeInTheDocument();
  });

  it('applies correct animation classes', () => {
    mockNetworkHook(15.7);
    const { container } = render(<ProfileBanner user={mockUser} />);

    // Check for Framer Motion classes
    expect(container.firstChild).toHaveClass('relative w-full h-64 bg-black text-white overflow-hidden');
  });

  it('integrates with NetworkValue component and updates correctly', () => {
    mockNetworkHook(15.7);
    render(<ProfileBanner user={mockUser} />);

    // Assert initial network value
    expect(screen.getByText('15.7')).toBeInTheDocument();

    // Update mock network value
    mockNetworkHook(20.5);
    render(<ProfileBanner user={mockUser} />);

    // Assert updated network value
    expect(screen.getByText('20.5')).toBeInTheDocument();
  });

  it('applies correct responsive classes', () => {
    mockNetworkHook(15.7);
    const { container } = render(<ProfileBanner user={mockUser} />);

    // Check for responsive classes
    expect(container.firstChild).toHaveClass('w-full');
    expect(container.firstChild).toHaveClass('h-64');
  });

  // Additional tests can be added here to cover more scenarios
});