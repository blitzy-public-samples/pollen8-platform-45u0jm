import React, { useState, useEffect } from 'react';
import { useInvite } from '../hooks/useInvite';
import InviteCard from '../components/invite/InviteCard';
import InviteAnalytics from '../components/invite/InviteAnalytics';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { IInvite } from '@shared/interfaces/invite.interface';
import classNames from 'classnames';

/**
 * InvitePage Component
 * 
 * This component serves as the invite management hub in the Pollen8 platform,
 * allowing users to create, track, and analyze their invite links while adhering
 * to the minimalist black and white design aesthetic.
 * 
 * @returns {JSX.Element} The rendered InvitePage component
 * 
 * Requirements addressed:
 * - Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 * - Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 * - User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 */
const InvitePage: React.FC = () => {
  const { invites, createInvite, deleteInvite, isLoading, error } = useInvite();
  const [isCreating, setIsCreating] = useState(false);
  const [newInviteName, setNewInviteName] = useState('');
  const [selectedInvite, setSelectedInvite] = useState<string | null>(null);

  const INVITE_NAME_MAX_LENGTH = 50;

  useEffect(() => {
    if (invites.length > 0 && !selectedInvite) {
      setSelectedInvite(invites[0]._id);
    }
  }, [invites, selectedInvite]);

  const handleCreateInvite = async (name: string) => {
    if (name.trim().length === 0 || name.length > INVITE_NAME_MAX_LENGTH) {
      // Show error message to user
      return;
    }
    try {
      await createInvite(name);
      setIsCreating(false);
      setNewInviteName('');
    } catch (error) {
      console.error('Failed to create invite:', error);
      // Show error message to user
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    if (window.confirm('Are you sure you want to delete this invite?')) {
      try {
        await deleteInvite(inviteId);
        if (selectedInvite === inviteId) {
          setSelectedInvite(invites.length > 1 ? invites[0]._id : null);
        }
      } catch (error) {
        console.error('Failed to delete invite:', error);
        // Show error message to user
      }
    }
  };

  const pageClasses = classNames(
    'min-h-screen bg-black text-white p-8',
    'font-proxima-nova'
  );

  const headerClasses = classNames(
    'flex justify-between items-center mb-8'
  );

  const inviteGridClasses = classNames(
    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'
  );

  if (isLoading) {
    return (
      <div className={pageClasses}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={pageClasses}>
        <p>Error loading invites. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className={pageClasses}>
      <header className={headerClasses}>
        <h1 className="text-3xl font-semibold">Invite Management</h1>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          Create New Invite
        </Button>
      </header>

      {isCreating && (
        <div className="mb-8 p-4 border border-white rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create New Invite</h2>
          <Input
            type="text"
            value={newInviteName}
            onChange={(e) => setNewInviteName(e.target.value)}
            placeholder="Enter invite name"
            maxLength={INVITE_NAME_MAX_LENGTH}
            className="mb-4"
          />
          <div className="flex justify-end space-x-4">
            <Button
              variant="secondary"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateInvite(newInviteName)}
              disabled={newInviteName.trim().length === 0}
            >
              Create Invite
            </Button>
          </div>
        </div>
      )}

      <div className={inviteGridClasses}>
        {invites.map((invite: IInvite) => (
          <InviteCard
            key={invite._id}
            invite={invite}
            onDelete={() => handleDeleteInvite(invite._id)}
            onCopy={() => {/* Implement copy functionality */}}
          />
        ))}
      </div>

      {selectedInvite && (
        <InviteAnalytics
          inviteId={selectedInvite}
          className="mt-8"
        />
      )}
    </div>
  );
};

export default InvitePage;