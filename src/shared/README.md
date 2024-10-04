# Shared Module - Pollen8 Platform

## Overview

The shared module is a critical component of the Pollen8 platform, containing common utilities, interfaces, types, and constants used across frontend, backend, and socket services. This module plays a crucial role in maintaining consistency and promoting code reuse throughout the platform.

## Directory Structure

```
src/shared/
├── interfaces/       # TypeScript interfaces
├── types/            # TypeScript types
├── constants/        # Shared constants
├── utils/            # Utility functions
├── config/           # Configuration constants
├── schemas/          # Validation schemas
├── validators/       # Validation functions
├── tests/            # Test files
└── README.md         # This documentation
```

## Key Components

### Interfaces

The `interfaces/` directory contains TypeScript interfaces that define the structure of core data models used throughout the platform. Key interfaces include:

- `IUser`: Defines the user profile structure
- `IConnection`: Defines the network connection structure
- `IInvite`: Defines the invitation structure

These interfaces address the "Verified Connections" requirement by including phone verification data structures (Technical Specification/1.1 System Objectives).

### Types

The `types/` directory contains important TypeScript types used across the platform, including:

- API request/response types
- Network-related types
- Analytics types

These types support the "Quantifiable Networking" objective by providing structures for network value calculations and analytics (Technical Specification/1.1 System Objectives).

### Constants

The `constants/` directory contains shared constants used throughout the application:

- Industry list
- Network value (3.14 per connection)
- Error codes

These constants address the "Industry Focus" requirement by providing a centralized list of industries (Technical Specification/1.1 System Objectives).

### Utilities

The `utils/` directory contains utility functions that are used across different parts of the application:

- Formatting utilities
- Validation utilities
- Network calculation utilities

These utilities support the "User-Centric Design" objective by providing consistent formatting and validation across the platform (Technical Specification/1.1 System Objectives).

## Usage Guidelines

To use the shared module in your code:

1. Import interfaces and types:
   ```typescript
   import { IUser } from '@shared/interfaces/user.interface';
   import { ApiResponse } from '@shared/types/api.types';
   ```

2. Use constants:
   ```typescript
   import { NETWORK_VALUE_PER_CONNECTION } from '@shared/constants';
   ```

3. Utilize utility functions:
   ```typescript
   import { calculateNetworkValue } from '@shared/utils/networkCalculation';
   ```

## Development Guidelines

When adding to or modifying the shared module:

1. Ensure new interfaces or types are thoroughly documented with JSDoc comments.
2. When creating utility functions, include unit tests in the `tests/` directory.
3. Maintain backwards compatibility when updating existing interfaces or types.
4. Ensure all components have 100% test coverage.

## Testing

To run tests for the shared module:

```bash
npm run test:shared
```

When writing new tests:

- Place test files in the `tests/` directory
- Follow the naming convention: `*.test.ts`
- Aim for 100% code coverage

## Additional Notes

- The shared module is used by frontend, backend, and socket services.
- All components must be thoroughly documented and tested.
- Follow TypeScript best practices for type definitions.
- Maintain backward compatibility when updating interfaces.

## Examples

### Using User Interfaces

```typescript
import { IUser } from '@shared/interfaces/user.interface';

const user: IUser = {
  _id: '123456',
  phoneNumber: '+1234567890',
  industries: ['Technology', 'Finance'],
  // ... other properties
};
```

### Implementing API Types

```typescript
import { ApiResponse } from '@shared/types/api.types';

const response: ApiResponse<IUser> = {
  success: true,
  data: user,
};
```

### Utilizing Network Calculation Utilities

```typescript
import { calculateNetworkValue } from '@shared/utils/networkCalculation';

const networkValue = calculateNetworkValue(user.connectionCount);
```

## Troubleshooting

Common issues and their solutions:

1. Type conflicts: Ensure you're using the latest version of the shared module.
2. Constant naming conflicts: Use namespaced imports to avoid conflicts.
3. Utility function usage problems: Check the function documentation for proper usage.

## Contributing

When contributing to the shared module:

1. Follow the established code style and naming conventions.
2. Include comprehensive documentation for all new components.
3. Write unit tests for all new functionality.
4. Submit a pull request with a clear description of your changes.

For more detailed contributing guidelines, please refer to the main project README.