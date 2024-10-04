# Pollen8 Backend Service

This README provides comprehensive information about the Node.js implementation that powers the professional networking features of the Pollen8 platform.

## Overview

The Pollen8 backend service is built using Node.js and TypeScript, offering high-performance data processing, scalable architecture, external service integration, and real-time capabilities. It serves as the core engine for the professional networking platform, handling user authentication, network management, and data analytics.

## Getting Started

### Prerequisites

- Node.js 16+
- MongoDB
- Redis
- AWS account for S3

### Installation

1. Clone the repository
2. Navigate to the `src/backend` directory
3. Run `npm install` to install dependencies

### Configuration

1. Copy `.env.example` to `.env`
2. Edit the `.env` file with your specific configuration values

## Development

### Local Development

To run the server locally:

```
npm run dev
```

### Building for Production

To compile TypeScript and prepare for production:

```
npm run build
```

### Testing

Run all tests:

```
npm run test
```

Run unit tests only:

```
npm run test:unit
```

Run integration tests only:

```
npm run test:int
```

## Architecture

### Core Components

1. Models: Data structure definitions
2. Repositories: Data access layer
3. Services: Business logic implementation
4. Jobs: Background tasks and scheduled processes

## External Services Integration

### SMS Verification

Twilio integration is used for phone number validation. This ensures that users provide authentic contact information, enhancing the credibility of the network.

### Geolocation Services

Google Maps integration is utilized for location-based features, allowing for more accurate user profiling and location-aware networking capabilities.

## Data Management

### Caching

Redis is implemented as a caching layer to improve performance and reduce database load for frequently accessed data.

### Database

MongoDB is used as the primary database, with optimizations for efficient querying and data storage.

## Security

### Encryption

- Data at-rest encryption is implemented for sensitive information stored in the database.
- Data in-transit encryption is ensured through HTTPS protocols.

### Validation

- Request payload validation and sanitization are performed to prevent injection attacks and ensure data integrity.

## Deployment

### Docker

Build the Docker image:

```
docker build -t pollen8-backend .
```

Run the Docker container:

```
docker run -p 4000:4000 pollen8-backend
```

### Environment Variables

Key environment variables include:

- `PORT`: Server port (default: 4000)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection URL
- `AWS_ACCESS_KEY`: AWS access key for S3 integration
- `TWILIO_ACCOUNT_SID`: Twilio account SID for SMS services
- `GOOGLE_MAPS_API_KEY`: Google Maps API key for geolocation services

## Monitoring

### Logging

- Request logging: Tracks incoming API requests
- Error logging: Captures and formats error information
- Performance logging: Monitors system performance metrics

### Metrics

Key metrics tracked include:

- Connection count
- Network value calculations
- API response times

## Contributing

### Code Standards

- TypeScript strict mode is enabled
- ESLint is used for code linting
- Unit tests are required for all new features

### Pull Request Process

1. Create feature branches from `develop`
2. Ensure all tests pass and linting rules are followed
3. Submit a pull request for review
4. CI/CD pipeline will run automated checks

## Dependencies

### Internal Dependencies

- Shared interfaces: `src/shared/interfaces`
- Database models: `src/database/models`
- Configuration: `src/backend/src/config`

### External Dependencies

- Node.js: JavaScript runtime environment
- TypeScript: Type-safe development
- MongoDB: Database driver
- Redis: Caching layer
- Twilio: SMS verification service
- Google Maps: Geolocation services

## Global Constants

- `NETWORK_VALUE_PER_CONNECTION`: 3.14 (used in network value calculations)

For more detailed information on specific components or processes, please refer to the inline documentation within the source code or contact the development team.