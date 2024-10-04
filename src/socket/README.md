# Pollen8 WebSocket Server

This document provides an overview of the Pollen8 WebSocket server, which is responsible for delivering real-time networking capabilities with a focus on industry-specific connections and quantifiable network value.

## Overview

The Pollen8 WebSocket server provides real-time networking capabilities for the platform, enabling instant updates for connections, invites, and network value calculations. Built with Socket.IO and Redis, it ensures scalable and secure real-time communication.

## Features

- Real-time network updates
- Industry-specific event broadcasting
- Secure WebSocket connections with JWT authentication
- Scalable architecture using Redis adapter
- Network value calculation (3.14 per connection)
- Comprehensive logging and metrics collection
- Black and white theme in logs and messages

## Prerequisites

- Node.js 16.0 or higher
- Redis server
- MongoDB connection (for user verification)

## Event Types

1. `connection.new`
   - Purpose: New network connection
   - Payload: `{ userId: string, industries: string[] }`

2. `invite.created`
   - Purpose: New invite generated
   - Payload: `{ inviteId: string, creatorId: string }`

3. `network.update`
   - Purpose: Network value change
   - Payload: `{ userId: string, newValue: number }`

## Environment Variables

| Name | Purpose | Example |
|------|---------|---------|
| PORT | Server port | 3001 |
| REDIS_URL | Redis connection URL | redis://localhost:6379 |
| JWT_SECRET | JWT verification key | your-secret-key |

## Metrics

- Connection count by industry
- Event processing time
- Redis adapter latency
- Network value calculation frequency

## Common Issues

1. Redis connection failures
2. JWT verification errors
3. Rate limit exceeded

## Implementation Details

The WebSocket server is implemented using Socket.IO and integrates with Redis for scalability. It uses JWT for authentication and ensures secure connections. The server is designed to handle industry-specific events and calculate network values in real-time.

### Key Components

1. `src/socket/src/app.ts`: Main application class
2. `src/socket/src/server.ts`: Server initialization
3. `src/socket/src/config/index.ts`: Configuration management
4. `src/socket/src/handlers/`: Event handlers for different socket events
5. `src/socket/src/middleware/`: Authentication and rate limiting middleware
6. `src/socket/src/services/`: Redis and event emitter services

### Security Considerations

- JWT authentication for all connections
- Rate limiting to prevent abuse
- Secure WebSocket connections (WSS)
- Input validation for all incoming events

### Scalability

The use of Redis as a Socket.IO adapter allows for horizontal scaling of the WebSocket servers. This architecture supports multiple server instances sharing connection information and broadcasting capabilities.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see Environment Variables section)
4. Start the server: `npm run start`

## Testing

Run the test suite using: `npm run test`

## License

Proprietary - All rights reserved

---

For more detailed information about the Pollen8 platform, please refer to the main project documentation.