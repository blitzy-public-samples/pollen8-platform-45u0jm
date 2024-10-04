# Pollen8 API Service

This README provides comprehensive documentation for the API service of the Pollen8 platform, offering detailed information about the RESTful backend implementation.

## Overview

The Pollen8 API service is the backbone of our professional networking platform, providing robust and scalable endpoints for managing user profiles, connections, invitations, and network value calculations. Our API is designed with a focus on performance, security, and extensibility.

Key Features:
- Phone number verification system
- Industry-specific network management
- Quantifiable network value calculation
- Real-time updates via WebSocket

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Docker (for containerized development)

### Installation

```bash
cd src/api
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with appropriate values
```

## Development

### Local Run

```bash
npm run dev
```

### Build

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

Run integration tests:
```bash
npm run test:int
```

## API Documentation

### Authentication Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/api/v1/auth/verify` | POST | Initiate phone verification |
| `/api/v1/auth/confirm` | POST | Confirm verification code |

### User Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/api/v1/user/profile` | GET | Fetch user profile |
| `/api/v1/user/profile` | PUT | Update user profile |

### Network Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/api/v1/network/connections` | GET | Get user connections |
| `/api/v1/network/value` | GET | Calculate network value |

### Invite Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/api/v1/invite/create` | POST | Generate invite link |
| `/api/v1/invite/analytics` | GET | Get invite analytics |

## Security Measures

### Authentication
- JWT-based authentication
- Phone number verification

### Rate Limiting
- 100 requests per minute per IP
- 1000 requests per minute per user

### Data Validation
- Request payload validation
- Sanitization of inputs

## Deployment

### Docker

Build the Docker image:
```bash
docker build -t pollen8-api .
```

Run the Docker container:
```bash
docker run -p 3000:3000 pollen8-api
```

### Environment Variables

| Name | Description | Default |
|------|-------------|---------|
| PORT | API server port | 3000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017 |
| REDIS_URL | Redis connection string | redis://localhost:6379 |

## Architecture

The API service is built using Express.js and TypeScript, following a modular architecture for maintainability and scalability. Key components include:

- `app.ts`: Main application configuration
- `index.ts`: Server initialization
- `routes/index.ts`: API routes definition

## Contributing

Please refer to the main project repository for contribution guidelines.

## License

This project is proprietary and confidential. Unauthorized copying, transferring or reproduction of the contents of this file, via any medium is strictly prohibited.