import React, { useState } from 'react';
import classNames from 'classnames';
import { IInvite } from '@shared/interfaces/invite.interface';
import { Button } from '../common/Button';
import { useInvite } from '../../hooks/useInvite';

interface InviteCardProps {
  invite: IInvite;
  onCopy?: () => void;
  onDelete?: () => void;
}

/**
 * InviteCard Component
 * 
 * This component displays an individual invite card in the Pollen8 platform,
 * showing invite details and providing interaction options while adhering to
 * the minimalist black and white design aesthetic.
 * 
 * @param {InviteCardProps} props - The props for the InviteCard component
 * @returns {JSX.Element} The rendered InviteCard component
 * 
 * Requirements addressed:
 * - Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 * - User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * - Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 */
export const InviteCard: React.FC<InviteCardProps> = ({ invite, onCopy, onDelete }) => {
  const [isCopying, setIsCopying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { analytics } = useInvite();

  const inviteAnalytics = analytics[invite._id];

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(invite.url);
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    } finally {
      setIsCopying(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.();
    } catch (error) {
      console.error('Failed to delete invite:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cardClasses = classNames(
    'bg-white border border-black rounded-lg p-4 shadow-sm',
    'transition-all duration-300 ease-in-out',
    'hover:shadow-md'
  );

  const headerClasses = 'text-lg font-semibold mb-2 font-proxima-nova';
  const dateClasses = 'text-sm text-gray-500 mb-3';
  const statsClasses = 'flex justify-between items-center mb-4';
  const statValueClasses = 'text-2xl font-bold';
  const statLabelClasses = 'text-sm text-gray-500';

  return (
    <div className={cardClasses}>
      <h3 className={headerClasses}>{invite.name}</h3>
      <p className={dateClasses}>Created on {new Date(invite.createdAt).toLocaleDateString()}</p>
      
      <div className={statsClasses}>
        <div>
          <p className={statValueClasses}>{inviteAnalytics?.clickCount || 0}</p>
          <p className={statLabelClasses}>Total Clicks</p>
        </div>
        <div>
          <p className={statValueClasses}>
            {inviteAnalytics?.clickTrend === 'up' ? '↑' : inviteAnalytics?.clickTrend === 'down' ? '↓' : '–'}
          </p>
          <p className={statLabelClasses}>Trend</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          variant="primary"
          size="small"
          onClick={handleCopy}
          isLoading={isCopying}
          aria-label="Copy invite link"
        >
          Copy Link
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={handleDelete}
          isLoading={isDeleting}
          aria-label="Delete invite"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default InviteCard;