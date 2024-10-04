import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Interface defining the structure of the SMS configuration object.
 * @interface
 */
export interface SMSConfig {
  /** Twilio account SID */
  accountSid: string;
  /** Twilio auth token */
  authToken: string;
  /** Twilio phone number for sending SMS */
  phoneNumber: string;
  /** Timeout for SMS message delivery in milliseconds */
  messageTimeout: number;
  /** Length of the verification code */
  verificationCodeLength: number;
  /** Expiry time for verification code in seconds */
  verificationCodeExpiry: number;
}

/**
 * SMS configuration object for the Pollen8 platform's phone verification system.
 * @constant
 */
export const SMS_CONFIG: SMSConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  messageTimeout: parseInt(process.env.SMS_MESSAGE_TIMEOUT || '30000', 10),
  verificationCodeLength: parseInt(process.env.VERIFICATION_CODE_LENGTH || '6', 10),
  verificationCodeExpiry: parseInt(process.env.VERIFICATION_CODE_EXPIRY || '300', 10),
};

/**
 * Validates the SMS configuration object to ensure all required properties are present and correctly formatted.
 * @function
 * @param {SMSConfig} config - The SMS configuration object to validate
 * @throws {Error} If validation fails
 */
export function validateSMSConfig(config: SMSConfig): void {
  // Check if all required properties are present
  const requiredProps = ['accountSid', 'authToken', 'phoneNumber', 'messageTimeout', 'verificationCodeLength', 'verificationCodeExpiry'];
  for (const prop of requiredProps) {
    if (!(prop in config)) {
      throw new Error(`Missing required SMS configuration property: ${prop}`);
    }
  }

  // Validate the format of each property
  if (typeof config.accountSid !== 'string' || config.accountSid.length === 0) {
    throw new Error('Invalid accountSid: must be a non-empty string');
  }

  if (typeof config.authToken !== 'string' || config.authToken.length === 0) {
    throw new Error('Invalid authToken: must be a non-empty string');
  }

  if (typeof config.phoneNumber !== 'string' || !/^\+\d{10,15}$/.test(config.phoneNumber)) {
    throw new Error('Invalid phoneNumber: must be a string in E.164 format');
  }

  if (typeof config.messageTimeout !== 'number' || config.messageTimeout <= 0) {
    throw new Error('Invalid messageTimeout: must be a positive number');
  }

  if (typeof config.verificationCodeLength !== 'number' || config.verificationCodeLength < 4 || config.verificationCodeLength > 10) {
    throw new Error('Invalid verificationCodeLength: must be a number between 4 and 10');
  }

  if (typeof config.verificationCodeExpiry !== 'number' || config.verificationCodeExpiry <= 0) {
    throw new Error('Invalid verificationCodeExpiry: must be a positive number');
  }
}

// Validate the SMS configuration on module load
try {
  validateSMSConfig(SMS_CONFIG);
} catch (error) {
  console.error('SMS Configuration Error:', error.message);
  process.exit(1);
}

export default SMS_CONFIG;