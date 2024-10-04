# Pollen8 Frontend

This directory contains the frontend application for the Pollen8 platform, a minimalist, data-driven professional networking solution built with React.js.

## Overview

Pollen8's frontend is designed with the following key points in mind:
- Minimalist black and white design
- Interactive network visualization
- Industry-focused professional networking
- Quantifiable network value display

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
cd src/frontend
npm install
```

### Development

To start the development server:

```bash
npm run dev
```

### Building

To create a production build:

```bash
npm run build
```

### Testing

Run all tests:

```bash
npm run test
```

Run unit tests:

```bash
npm run test:unit
```

Run end-to-end tests:

```bash
npm run test:e2e
```

## Architecture

### Key Components

#### Pages

- `Welcome.tsx`: Landing page with phone verification
- `Profile.tsx`: User profile with industry selection
- `Network.tsx`: Network visualization and management
- `Invite.tsx`: Invite generation and analytics

#### Shared Components

- `Button.tsx`: Styled button component
- `Input.tsx`: Form input component
- `LoadingSpinner.tsx`: Loading indicator
- `NetworkGraph.tsx`: D3.js network visualization

#### Contexts

- `AuthContext.tsx`: Authentication state management
- `ThemeContext.tsx`: Theme customization

#### Hooks

- `useAuth.ts`: Authentication logic
- `useNetwork.ts`: Network data management
- `useInvite.ts`: Invite functionality
- `useWebSocket.ts`: Real-time updates

## Environment Variables

| Name | Description | Default |
|------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:3000 |
| VITE_WS_URL | WebSocket server URL | ws://localhost:3001 |

## Technical Details

### User-Centric Design

The frontend implements a minimalist black and white interface, adhering to the user-centric design principle outlined in the Technical Specification (Section 1.1 System Objectives).

### Frontend Architecture

The React.js component structure and design patterns are carefully crafted to ensure a modular and maintainable codebase, as specified in the Technical Specification (Section 2.3.1 Frontend Components).

### Visualization

D3.js is integrated for network visualization, providing interactive and dynamic representations of user connections, as detailed in the Technical Specification (Section 1.2 Technical Scope).

### Responsive Design

Tailwind CSS is utilized to implement a responsive design, ensuring cross-device compatibility and a consistent user experience across various screen sizes, as outlined in the Technical Specification (Section 1.1 System Objectives).

## Dependencies

### Internal Dependencies

- Shared interfaces: `src/shared/interfaces`
- Shared constants: `src/shared/constants`
- API documentation: `src/api/README.md`

### External Dependencies

- React: UI library for component-based development
- Tailwind CSS: Utility-first CSS framework for styling
- D3.js: Data visualization library for network graphs
- Vite: Build tool and development server

## Contributing

Please refer to the main project README for contribution guidelines and coding standards.

## License

This project is licensed under the terms specified in the main project LICENSE file.