import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

// Import the main Swagger/OpenAPI specification document
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/swagger.json'), 'utf8'));

// Import the YAML-based API specification for better readability
const apiYaml = yaml.load(fs.readFileSync(path.join(__dirname, '../docs/api.yaml'), 'utf8')) as Record<string, any>;

// Define Swagger options
const SWAGGER_OPTIONS: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pollen8 API',
      version: '1.0.0',
      description: 'API documentation for the Pollen8 professional networking platform',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

/**
 * Configures and initializes Swagger documentation middleware for the Express application.
 * @param app - The Express application instance
 */
export const setupSwagger = (app: Express): void => {
  // Generate Swagger specification
  const swaggerSpec = swaggerJsdoc(SWAGGER_OPTIONS);

  // Merge the generated spec with the imported documents
  const mergedSpec = {
    ...swaggerSpec,
    ...swaggerDocument,
    ...apiYaml,
  };

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(mergedSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  }));

  // Serve Swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(mergedSpec);
  });

  console.log('Swagger UI initialized at /api-docs');
};

// Export the Swagger options for potential reuse in tests or other modules
export { SWAGGER_OPTIONS };