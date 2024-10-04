import React from 'react';
import classNames from 'classnames';
import { IConnection } from '@shared/interfaces/connection.interface';
import { Button } from '../common/Button';
import { formatNetworkValue } from '../../utils/networkCalculation';
import { useNetwork } from '../../hooks/useNetwork';

interface ConnectionCardProps {
  connection: IConnection;
  onRemove?: (connectionId: string) => void;
  className?: string;
}

/**
 * ConnectionCard component
 * 
 * Renders an individual connection card in the Pollen8 platform, displaying user connection details
 * in a minimalist black and white design.
 * 
 * @param {ConnectionCardProps} props - The props for the ConnectionCard component
 * @returns {React.ReactElement} The ConnectionCard component
 */
export const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onRemove, className }) => {
  const { removeConnection } = useNetwork();

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRemove) {
      onRemove(connection._id.toString());
    } else {
      await removeConnection(connection._id.toString());
    }
  };

  const cardClasses = classNames(
    'bg-white border border-black rounded-lg p-4 shadow-md transition-all duration-300 hover:shadow-lg',
    className
  );

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{connection.connectedUserId.toString()}</h3>
        <span className="text-sm text-gray-500">{formatNetworkValue(3.14)}</span>
      </div>
      <div className="mb-3">
        <p className="text-sm text-gray-700">Shared Industries:</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {connection.sharedIndustries.map((industry, index) => (
            <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
              {industry}
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="small"
          onClick={handleRemove}
          className="text-xs"
        >
          Remove Connection
        </Button>
      </div>
    </div>
  );
};

/**
 * @fileoverview This file implements the ConnectionCard component, which displays individual connection details.
 * It addresses the following requirements:
 * 1. User-Centric Design (Technical Specification/1.1 System Objectives)
 *    - Implements black and white minimalist interface for connection display
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Shows shared industries between connected users
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Displays contribution to network value (3.14)
 */

export default ConnectionCard;