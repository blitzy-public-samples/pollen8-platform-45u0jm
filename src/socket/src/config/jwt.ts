import { ENVIRONMENTS } from '@shared/config/environments';
import jsonwebtoken from 'jsonwebtoken';

/**
 * Configuration class for JWT settings
 * @class
 * @description Addresses the "Security Protocols" requirement from Technical Specification/5. Security Considerations
 */
class JwtConfig {
  public readonly publicKey: string;
  public readonly algorithm: string;
  public readonly expiresIn: string;

  constructor(publicKey: string, algorithm: string, expiresIn: string) {
    this.publicKey = publicKey;
    this.algorithm = algorithm;
    this.expiresIn = expiresIn;
  }
}

/**
 * JWT secret key for token signing and verification
 * @constant
 * @type {string}
 * @description Addresses the "Enhanced Privacy" requirement from Technical Specification/1.2 Scope/Benefits
 */
export const JWT_SECRET: string = process.env.JWT_SECRET || 'default_jwt_secret_replace_in_production';

/**
 * JWT algorithm used for token signing
 * @constant
 * @type {string}
 */
export const JWT_ALGORITHM: 'RS256' = 'RS256';

/**
 * Token expiration time
 * @constant
 * @type {string}
 */
export const TOKEN_EXPIRY: '24h' = '24h';

/**
 * Public key for JWT verification
 * @constant
 * @type {string}
 * @description Addresses the "Verified Connections" requirement from Technical Specification/1.1 System Objectives
 */
export const PUBLIC_KEY: string = process.env.JWT_PUBLIC_KEY || '';

/**
 * Returns the JWT configuration object for the WebSocket server.
 * @function
 * @returns {JwtConfig} Configuration object for JWT settings
 * @description Addresses the "Security Protocols" requirement from Technical Specification/5. Security Considerations
 */
export function getJwtConfig(): JwtConfig {
  // Import environment-specific configurations
  const env = ENVIRONMENTS[process.env.NODE_ENV as keyof typeof ENVIRONMENTS] || ENVIRONMENTS.development;

  // Load public key from environment or default
  const publicKey = PUBLIC_KEY || env.aws.secretAccessKey; // Fallback to AWS secret key if public key is not set

  // Create and return JwtConfig instance
  return new JwtConfig(publicKey, JWT_ALGORITHM, TOKEN_EXPIRY);
}

/**
 * Verify JWT token
 * @function
 * @param {string} token - JWT token to verify
 * @returns {Promise<jsonwebtoken.JwtPayload>} Decoded JWT payload
 * @throws {Error} If token is invalid or verification fails
 * @description Addresses the "Verified Connections" requirement from Technical Specification/1.1 System Objectives
 */
export async function verifyJwtToken(token: string): Promise<jsonwebtoken.JwtPayload> {
  const config = getJwtConfig();
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, config.publicKey, { algorithms: [config.algorithm] }, (err, decoded) => {
      if (err) {
        reject(new Error('Invalid token'));
      } else {
        resolve(decoded as jsonwebtoken.JwtPayload);
      }
    });
  });
}

/**
 * Generate JWT token
 * @function
 * @param {object} payload - Data to be encoded in the token
 * @returns {Promise<string>} Generated JWT token
 * @description Addresses the "Enhanced Privacy" requirement from Technical Specification/1.2 Scope/Benefits
 */
export async function generateJwtToken(payload: object): Promise<string> {
  const config = getJwtConfig();
  return new Promise((resolve, reject) => {
    jsonwebtoken.sign(payload, JWT_SECRET, { algorithm: config.algorithm, expiresIn: config.expiresIn }, (err, token) => {
      if (err) {
        reject(new Error('Failed to generate token'));
      } else {
        resolve(token as string);
      }
    });
  });
}

export default {
  getJwtConfig,
  verifyJwtToken,
  generateJwtToken,
};