# Pollen8

Pollen8 is a professional networking platform that revolutionizes the way professionals connect, focusing on verified connections, industry-specific networking, and quantifiable network growth.

## Key Features

- Verified connections through phone number authentication
- Multi-industry selection for targeted networking
- Quantifiable network value calculation (3.14 per connection)
- Minimalist black and white interface with smooth animations
- Real-time updates and interactive network visualizations

## Technology Stack

- Frontend: React.js, Tailwind CSS, D3.js
- Backend: Node.js
- Database: MongoDB
- Caching: Redis
- Real-time: Socket.io

## Getting Started

### Prerequisites

- Node.js 16.x
- npm 8.x

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-organization/pollen8.git
   cd pollen8
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration details.

4. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `src/`: Source code directory
  - `api/`: Backend API code
  - `frontend/`: React frontend code
  - `socket/`: WebSocket server code
  - `database/`: Database models and migrations
  - `shared/`: Shared types and utilities
- `infrastructure/`: Deployment and infrastructure configurations
- `tests/`: Test suites for all components

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build production-ready assets
- `npm run test`: Run test suites
- `npm run lint`: Run ESLint for code style checking

### Testing

We use Jest for unit and integration testing. Run tests with:

```
npm run test
```

### Code Style and Linting

We follow the Airbnb JavaScript Style Guide. ESLint is configured to enforce this style. Run the linter with:

```
npm run lint
```

## Deployment

### Environment Configurations

- `staging`: For pre-production testing
- `production`: Live environment

### Deployment Procedures

1. Ensure all tests pass and linting issues are resolved
2. Merge changes to the `main` branch
3. CI/CD pipeline will automatically deploy to staging
4. After staging verification, manually promote to production

### CI/CD Pipeline

We use GitHub Actions for our CI/CD pipeline. The workflow includes:

1. Running tests
2. Building Docker images
3. Deploying to AWS ECS

## Contributing

We welcome contributions to Pollen8! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code adheres to our style guide and passes all tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Team

For information about the project maintainers and contributors, please refer to the [CODEOWNERS](.github/CODEOWNERS) file.

---

Built with ❤️ by the Pollen8 Team