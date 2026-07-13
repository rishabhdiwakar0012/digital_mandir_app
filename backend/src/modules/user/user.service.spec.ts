/**
 * UserService Unit Tests
 *
 * Tests: getUserProfile, updateProfile, updatePreferences,
 *        getPreferences, getOnboardingStatus, updateOnboardingStatus,
 *        deleteAccount, updateEmail
 *
 * All MongoDB calls are mocked — no real DB required.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../common/database/schemas';
import { Otp } from '../../common/database/schemas';

// ─── Mock factory helpers ─────────────────────────────────────────────────────

function makeUser(overrides: Record<string, any> = {}) {
  return {
    _id: { toString: () => 'user-id-123' },
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    avatar: null,
    phone: null,
    gender: null,
    dateOfBirth: null,
    bio: null,
    favoriteDeity: null,
    roles: ['user'],
    isEmailVerified: true,
    preferences: {
      language: 'en',
      theme: 'system',
      notifications: { email: true, push: true, sms: true },
    },
    onboardingCompleted: false,
    onboardingStep: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** chain: model.findById(id).select('-password').exec() */
function chainSelect(returnVal: any) {
  const exec = jest.fn().mockResolvedValue(returnVal);
  const select = jest.fn().mockReturnValue({ exec });
  return { select, exec };
}

/** chain: model.findByIdAndUpdate(...).select('-password').exec() */
function chainUpdate(returnVal: any) {
  return chainSelect(returnVal);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('UserService', () => {
  let service: UserService;
  let mockUserModel: any;
  let mockOtpModel: any;

  beforeEach(async () => {
    mockUserModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOne: jest.fn(),
    };

    mockOtpModel = {
      findOne: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Otp.name), useValue: mockOtpModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  // ─── getUserProfile ───────────────────────────────────────────────────────

  describe('getUserProfile', () => {
    it('returns mapped profile for existing user', async () => {
      const user = makeUser();
      const chain = chainSelect(user);
      mockUserModel.findById.mockReturnValue(chain);

      const profile = await service.getUserProfile('user-id-123');

      expect(profile.email).toBe('test@example.com');
      expect(profile.id).toBe('user-id-123');
      expect((profile as any).password).toBeUndefined();
    });

    it('throws NotFoundException when user does not exist', async () => {
      const chain = chainSelect(null);
      mockUserModel.findById.mockReturnValue(chain);

      await expect(service.getUserProfile('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updateProfile ────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('updates and returns new profile', async () => {
      const updated = makeUser({ firstName: 'NewName' });
      mockUserModel.findByIdAndUpdate.mockResolvedValue(updated);

      const profile = await service.updateProfile('user-id-123', {
        firstName: 'NewName',
      });

      expect(profile.firstName).toBe('NewName');
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id-123',
        { $set: { firstName: 'NewName' } },
        { returnDocument: 'after' },
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateProfile('bad-id', { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getPreferences ───────────────────────────────────────────────────────

  describe('getPreferences', () => {
    it('returns language, theme, notificationsEnabled', async () => {
      const user = makeUser({
        preferences: { language: 'hi', theme: 'dark', notifications: { email: true, push: true, sms: true } },
      });
      const chain = chainSelect(user);
      mockUserModel.findById.mockReturnValue(chain);

      const prefs = await service.getPreferences('user-id-123');

      expect(prefs.language).toBe('hi');
      expect(prefs.theme).toBe('dark');
      expect(prefs.notificationsEnabled).toBe(true);
    });

    it('throws NotFoundException for unknown user', async () => {
      const chain = chainSelect(null);
      mockUserModel.findById.mockReturnValue(chain);

      await expect(service.getPreferences('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updatePreferences ────────────────────────────────────────────────────

  describe('updatePreferences', () => {
    it('persists updated preferences', async () => {
      const user = makeUser({
        preferences: { language: 'sa', theme: 'system', notifications: { email: true, push: false, sms: true } },
      });
      mockUserModel.findByIdAndUpdate.mockResolvedValue(user);

      const prefs = await service.updatePreferences('user-id-123', {
        language: 'sa',
        notificationsEnabled: false,
      });

      expect(prefs.language).toBe('sa');
      expect(prefs.notificationsEnabled).toBe(false);
    });

    it('throws NotFoundException for unknown user', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.updatePreferences('bad-id', { language: 'en' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getOnboardingStatus ──────────────────────────────────────────────────

  describe('getOnboardingStatus', () => {
    it('returns onboardingCompleted and onboardingStep', async () => {
      const user = makeUser({ onboardingCompleted: true, onboardingStep: null });
      const chain = chainSelect(user);
      mockUserModel.findById.mockReturnValue(chain);

      const status = await service.getOnboardingStatus('user-id-123');

      expect(status.onboardingCompleted).toBe(true);
      expect(status.onboardingStep).toBeNull();
    });

    it('throws NotFoundException for unknown user', async () => {
      const chain = chainSelect(null);
      mockUserModel.findById.mockReturnValue(chain);

      await expect(service.getOnboardingStatus('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updateOnboardingStatus ───────────────────────────────────────────────

  describe('updateOnboardingStatus', () => {
    it('marks onboarding as complete', async () => {
      const user = makeUser({ onboardingCompleted: true, onboardingStep: 'done' });
      mockUserModel.findByIdAndUpdate.mockResolvedValue(user);

      const status = await service.updateOnboardingStatus('user-id-123', {
        onboardingCompleted: true,
        onboardingStep: 'done',
      });

      expect(status.onboardingCompleted).toBe(true);
      expect(status.onboardingStep).toBe('done');
    });

    it('throws NotFoundException for unknown user', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateOnboardingStatus('bad-id', { onboardingCompleted: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deleteAccount ────────────────────────────────────────────────────────

  describe('deleteAccount', () => {
    it('deletes the user and returns success message', async () => {
      const user = makeUser();
      mockUserModel.findById.mockResolvedValue(user);
      mockUserModel.findByIdAndDelete.mockResolvedValue(user);

      const result = await service.deleteAccount('user-id-123');

      expect(result.message).toBe('Account deleted successfully');
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith('user-id-123');
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.deleteAccount('bad-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  // ─── updateEmail ──────────────────────────────────────────────────────────

  describe('updateEmail', () => {
    const newEmail = 'newemail@example.com';
    const otp = '123456';

    function makeOtpDoc(overrides: Record<string, any> = {}) {
      return {
        otp,
        attempts: 0,
        save: jest.fn(),
        deleteOne: jest.fn(),
        ...overrides,
      };
    }

    it('updates email when OTP is valid', async () => {
      const otpDoc = makeOtpDoc();
      mockOtpModel.findOne.mockResolvedValue(otpDoc);
      // email not taken
      mockUserModel.findOne.mockResolvedValue(null);

      const updatedUser = makeUser({ email: newEmail, isEmailVerified: true });
      const chain = chainUpdate(updatedUser);
      mockUserModel.findByIdAndUpdate.mockReturnValue(chain);

      const profile = await service.updateEmail('user-id-123', newEmail, otp);

      expect(profile.email).toBe(newEmail);
      expect(otpDoc.deleteOne).toHaveBeenCalled();
    });

    it('throws BadRequestException when OTP is expired/not found', async () => {
      mockOtpModel.findOne.mockResolvedValue(null);

      await expect(
        service.updateEmail('user-id-123', newEmail, otp),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for wrong OTP', async () => {
      const otpDoc = makeOtpDoc({ otp: '999999' });
      mockOtpModel.findOne.mockResolvedValue(otpDoc);

      await expect(
        service.updateEmail('user-id-123', newEmail, '000000'),
      ).rejects.toThrow(BadRequestException);
      expect(otpDoc.save).toHaveBeenCalled();
      expect(otpDoc.attempts).toBe(1);
    });

    it('throws BadRequestException and deletes OTP after 5 wrong attempts', async () => {
      const otpDoc = makeOtpDoc({ otp: '999999', attempts: 4 });
      mockOtpModel.findOne.mockResolvedValue(otpDoc);

      await expect(
        service.updateEmail('user-id-123', newEmail, '000000'),
      ).rejects.toThrow(BadRequestException);
      expect(otpDoc.deleteOne).toHaveBeenCalled();
    });

    it('throws ConflictException when new email is already registered', async () => {
      const otpDoc = makeOtpDoc();
      mockOtpModel.findOne.mockResolvedValue(otpDoc);
      // email already taken by someone else
      mockUserModel.findOne.mockResolvedValue(makeUser({ email: newEmail }));

      await expect(
        service.updateEmail('user-id-123', newEmail, otp),
      ).rejects.toThrow(ConflictException);
    });
  });
});
