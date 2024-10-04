import { AuthService } from '@api/services/auth.service';
import { IUser, UserResponse } from '@shared/interfaces/user.interface';
import { UserRole } from '@shared/enums/userRole.enum';
import { AUTH_ERRORS } from '@shared/constants/errorCodes';
import sinon from 'sinon';
import { expect } from 'chai';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockTwilioClient: any;
  let mockRedisClient: any;

  const testUser: IUser = {
    _id: 'testId',
    phoneNumber: '+1234567890',
    role: UserRole.USER,
    industries: [],
    interests: [],
    networkValue: 0,
    connectionCount: 0,
    createdAt: new Date(),
    lastActive: new Date(),
  };

  const testToken = 'mockJWTtoken';

  beforeEach(() => {
    mockUserRepository = {
      findByPhoneNumber: sinon.stub(),
      create: sinon.stub(),
      findById: sinon.stub(),
    };
    mockTwilioClient = {
      messages: {
        create: sinon.stub().resolves(),
      },
    };
    mockRedisClient = {
      set: sinon.stub().resolves('OK'),
      get: sinon.stub(),
      del: sinon.stub().resolves(1),
    };

    authService = new AuthService(mockUserRepository, mockTwilioClient, mockRedisClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('sendVerificationCode', () => {
    it('should successfully send verification code', async () => {
      const phoneNumber = '+1234567890';
      const result = await authService.sendVerificationCode(phoneNumber);

      expect(result).to.be.a('string');
      expect(mockRedisClient.set.calledOnce).to.be.true;
      expect(mockTwilioClient.messages.create.calledOnce).to.be.true;
    });

    it('should throw error for invalid phone number', async () => {
      const invalidPhoneNumber = '123';
      await expect(authService.sendVerificationCode(invalidPhoneNumber))
        .to.be.rejectedWith(AUTH_ERRORS.INVALID_PHONE_NUMBER);
    });

    it('should handle Twilio service errors', async () => {
      const phoneNumber = '+1234567890';
      mockTwilioClient.messages.create.rejects(new Error('Twilio error'));

      await expect(authService.sendVerificationCode(phoneNumber))
        .to.be.rejectedWith('Twilio error');
    });
  });

  describe('verifyCode', () => {
    it('should verify code and return user with token', async () => {
      const phoneNumber = '+1234567890';
      const code = '123456';
      mockRedisClient.get.resolves(code);
      mockUserRepository.findByPhoneNumber.resolves(testUser);
      sinon.stub(authService as any, 'generateToken').returns(testToken);

      const result = await authService.verifyCode(phoneNumber, code);

      expect(result).to.deep.equal({ user: testUser, token: testToken });
      expect(mockRedisClient.del.calledOnce).to.be.true;
    });

    it('should create new user if phone number not found', async () => {
      const phoneNumber = '+1234567890';
      const code = '123456';
      mockRedisClient.get.resolves(code);
      mockUserRepository.findByPhoneNumber.resolves(null);
      mockUserRepository.create.resolves(testUser);
      sinon.stub(authService as any, 'generateToken').returns(testToken);

      const result = await authService.verifyCode(phoneNumber, code);

      expect(result).to.deep.equal({ user: testUser, token: testToken });
      expect(mockUserRepository.create.calledOnce).to.be.true;
    });

    it('should throw error for invalid verification code', async () => {
      const phoneNumber = '+1234567890';
      const code = '123456';
      mockRedisClient.get.resolves('654321');

      await expect(authService.verifyCode(phoneNumber, code))
        .to.be.rejectedWith(AUTH_ERRORS.INVALID_VERIFICATION_CODE);
    });

    it('should throw error for expired verification code', async () => {
      const phoneNumber = '+1234567890';
      const code = '123456';
      mockRedisClient.get.resolves(null);

      await expect(authService.verifyCode(phoneNumber, code))
        .to.be.rejectedWith(AUTH_ERRORS.INVALID_VERIFICATION_CODE);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const token = (authService as any).generateToken(testUser);
      expect(token).to.be.a('string');
      // Additional checks for token validity could be added here
    });

    it('should include correct user data in token', () => {
      const token = (authService as any).generateToken(testUser);
      const decodedToken: any = jwt.decode(token);
      expect(decodedToken.id).to.equal(testUser._id);
      expect(decodedToken.phoneNumber).to.equal(testUser.phoneNumber);
      expect(decodedToken.role).to.equal(testUser.role);
    });
  });

  describe('validateToken', () => {
    it('should successfully validate and decode token', async () => {
      const validToken = 'validToken';
      const decodedToken = { id: testUser._id };
      sinon.stub(jwt, 'verify').returns(decodedToken);
      mockUserRepository.findById.resolves(testUser);

      const result = await authService.validateToken(validToken);

      expect(result).to.deep.equal(testUser);
    });

    it('should throw error for invalid token', async () => {
      const invalidToken = 'invalidToken';
      sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));

      await expect(authService.validateToken(invalidToken))
        .to.be.rejectedWith(AUTH_ERRORS.INVALID_TOKEN);
    });

    it('should throw error for expired token', async () => {
      const expiredToken = 'expiredToken';
      sinon.stub(jwt, 'verify').returns({});

      await expect(authService.validateToken(expiredToken))
        .to.be.rejectedWith(AUTH_ERRORS.INVALID_TOKEN);
    });
  });
});