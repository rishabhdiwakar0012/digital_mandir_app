/**
 * UNIT TESTS — AuthService (OTP flow + streak-on-login)
 *
 * Mocks all Mongoose models and JwtService — no real DB.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthService } from './auth.service';
import { User } from '../../common/database/schemas/user.schema';
import { Session } from '../../common/database/schemas/session.schema';
import { Otp } from '../../common/database/schemas/otp.schema';

// ─── Mock helpers ────────────────────────────────────────────────────────────

function makeOtpDoc(overrides: Partial<any> = {}) {
  return {
    _id: new Types.ObjectId(),
    type: 'email',
    email: 'user@test.com',
    otp: '123456',
    attempts: 0,
    expiresAt: new Date(Date.now() + 5 * 60_000),
    save: jest.fn().mockResolvedValue(undefined),
    deleteOne: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeUserDoc(overrides: Partial<any> = {}) {
  const doc: any = {
    _id: new Types.ObjectId(),
    email: 'user@test.com',
    roles: ['user'],
    isEmailVerified: false,
    currentStreak: 0,
    lastLoginAt: null,
    isActive: true,
    toObject: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  doc.toObject = jest.fn().mockReturnValue({ ...doc });
  return doc;
}

function makeOtpModel(foundDoc: any | null = null) {
  return {
    findOne: jest.fn().mockResolvedValue(foundDoc),
    deleteMany: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: new Types.ObjectId() })),
  };
}

function makeUserModel(foundDoc: any | null = null, createdDoc: any | null = null) {
  return {
    findOne: jest.fn().mockResolvedValue(foundDoc),
    findById: jest.fn().mockResolvedValue(foundDoc),
    findByIdAndUpdate: jest.fn().mockResolvedValue(foundDoc),
    create: jest.fn().mockResolvedValue(createdDoc || makeUserDoc()),
  };
}

function makeSessionModel() {
  return {
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    findOne: jest.fn().mockResolvedValue(null),
    deleteMany: jest.fn().mockResolvedValue({}),
  };
}

async function buildAuthService(
  otpDoc: any | null,
  userDoc: any | null,
  createdUser?: any,
): Promise<AuthService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: getModelToken(User.name), useValue: makeUserModel(userDoc, createdUser) },
      { provide: getModelToken(Session.name), useValue: makeSessionModel() },
      { provide: getModelToken(Otp.name), useValue: makeOtpModel(otpDoc) },
      {
        provide: JwtService,
        useValue: { sign: jest.fn().mockReturnValue('mock-jwt-token') },
      },
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn().mockImplementation((key: string) => {
            const map: Record<string, any> = {
              'jwt.refreshExpiration': '7d',
              'jwt.expiresIn': '1d',
              'email.provider': 'console',
            };
            return map[key] ?? null;
          }),
        },
      },
    ],
  }).compile();

  return module.get<AuthService>(AuthService);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService — verifyEmailOtp', () => {
  const email = 'user@test.com';
  const correctOtp = '123456';

  it('U-13: correct OTP returns tokens + isNewUser=false for existing user', async () => {
    const otpDoc = makeOtpDoc({ email, otp: correctOtp });
    const user = makeUserDoc({ email });
    const service = await buildAuthService(otpDoc, user);

    const result = await service.verifyEmailOtp(email, correctOtp);

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.isNewUser).toBe(false);
    expect(otpDoc.deleteOne).toHaveBeenCalled();
  });

  it('U-13b: correct OTP creates new user and returns isNewUser=true', async () => {
    const otpDoc = makeOtpDoc({ email, otp: correctOtp });
    // findOne returns null = no existing user
    const service = await buildAuthService(otpDoc, null);

    const result = await service.verifyEmailOtp(email, correctOtp);

    expect(result.isNewUser).toBe(true);
    expect(result.accessToken).toBe('mock-jwt-token');
  });

  it('U-14: wrong OTP increments attempts and throws BadRequestException', async () => {
    const otpDoc = makeOtpDoc({ email, otp: '999999', attempts: 0 });
    const user = makeUserDoc({ email });
    const service = await buildAuthService(otpDoc, user);

    await expect(service.verifyEmailOtp(email, '000000')).rejects.toThrow(
      BadRequestException,
    );
    expect(otpDoc.attempts).toBe(1);
    expect(otpDoc.save).toHaveBeenCalled();
  });

  it('U-15: expired/missing OTP throws BadRequestException', async () => {
    // otpDoc is null — simulates expired or no OTP
    const service = await buildAuthService(null, makeUserDoc({ email }));

    await expect(service.verifyEmailOtp(email, correctOtp)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('U-12: 5th wrong attempt deletes the OTP record (lockout)', async () => {
    const otpDoc = makeOtpDoc({ email, otp: '999999', attempts: 5 });
    const user = makeUserDoc({ email });
    const service = await buildAuthService(otpDoc, user);

    await expect(service.verifyEmailOtp(email, '000000')).rejects.toThrow(
      BadRequestException,
    );
    expect(otpDoc.deleteOne).toHaveBeenCalled();
  });

  it('U-OTP-SINGLE-USE: OTP is deleted after first successful use (not reusable)', async () => {
    const otpDoc = makeOtpDoc({ email, otp: correctOtp });
    const user = makeUserDoc({ email });
    const service = await buildAuthService(otpDoc, user);

    await service.verifyEmailOtp(email, correctOtp);

    // deleteOne should have been called — OTP is now gone
    expect(otpDoc.deleteOne).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService — sendEmailOtp', () => {
  const email = 'newuser@test.com';

  it('sends OTP for registration when email does not exist', async () => {
    // findOne returns null = email not yet registered
    const service = await buildAuthService(null, null);
    const result = await service.sendEmailOtp(email, 'register');
    expect(result.message).toBeDefined();
  });

  it('throws ConflictException when registering with an existing email', async () => {
    const user = makeUserDoc({ email });
    const service = await buildAuthService(null, user);

    await expect(service.sendEmailOtp(email, 'register')).rejects.toThrow();
  });

  it('throws BadRequestException when logging in with non-existent email', async () => {
    const service = await buildAuthService(null, null);

    await expect(service.sendEmailOtp('nobody@test.com', 'login')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rate-limits: throws when OTP already sent within 60 seconds', async () => {
    const recentOtp = makeOtpDoc({
      email,
      createdAt: new Date(), // just created
    });
    const user = makeUserDoc({ email });
    // The mock returns the recent OTP on the first findOne call
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: { ...makeUserModel(user), findOne: jest.fn().mockResolvedValue(null) },
        },
        { provide: getModelToken(Session.name), useValue: makeSessionModel() },
        {
          provide: getModelToken(Otp.name),
          useValue: { ...makeOtpModel(recentOtp) },
        },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('tok') } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('console') },
        },
      ],
    }).compile();

    const service = module.get<AuthService>(AuthService);

    await expect(service.sendEmailOtp(email, 'register')).rejects.toThrow(
      BadRequestException,
    );
  });
});
