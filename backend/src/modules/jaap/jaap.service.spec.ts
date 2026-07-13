/**
 * UNIT TESTS — JaapService
 *
 * Tests streak logic, getUserStats, recordSession, leaderboard.
 * Uses jest mock models — no real DB required.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { JaapService } from './jaap.service';
import { JaapSession } from '../../common/database/schemas/jaap-session.schema';
import { User } from '../../common/database/schemas/user.schema';

// ─── Helpers ────────────────────────────────────────────────────────────────

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Returns the UTC Date that represents midnight-IST for the given day offset from now */
function istMidnightUTC(dayOffset = 0): Date {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
  // Set to start of day IST
  const startIST = new Date(
    Date.UTC(
      nowIST.getUTCFullYear(),
      nowIST.getUTCMonth(),
      nowIST.getUTCDate() + dayOffset,
    ),
  );
  // Convert back to UTC
  return new Date(startIST.getTime() - IST_OFFSET_MS);
}

function makeUser(overrides: Partial<any> = {}): any {
  return {
    _id: new Types.ObjectId(),
    currentStreak: 0,
    lastStreakUpdateAt: null,
    totalCoins: 0,
    totalJaapSessions: 0,
    totalBeads: 0,
    totalRounds: 0,
    isActive: true,
    roles: ['user'],
    ...overrides,
  };
}

// ─── Mock factories ─────────────────────────────────────────────────────────

function makeMockJaapModel(createdDoc: any = {}) {
  return {
    create: jest.fn().mockResolvedValue(createdDoc),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
  };
}

function makeMockUserModel(user: any = null) {
  return {
    findById: jest.fn().mockResolvedValue(user),
    findByIdAndUpdate: jest.fn().mockResolvedValue(user),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
  };
}

// ─── Test suite ─────────────────────────────────────────────────────────────

describe('JaapService', () => {
  let service: JaapService;
  let mockJaapModel: ReturnType<typeof makeMockJaapModel>;
  let mockUserModel: ReturnType<typeof makeMockUserModel>;

  async function buildService(user: any) {
    mockJaapModel = makeMockJaapModel({ _id: new Types.ObjectId() });
    mockUserModel = makeMockUserModel(user);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JaapService,
        { provide: getModelToken(JaapSession.name), useValue: mockJaapModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<JaapService>(JaapService);
  }

  const userId = new Types.ObjectId().toString();
  const sessionData = {
    category: 'gayatri',
    rounds: 1,
    totalBeads: 108,
    duration: 300,
  };

  // ── recordSession — streak logic ───────────────────────────────────────────

  describe('recordSession — streak logic', () => {
    it('U-02: increments streak by 1 when last session was yesterday (IST)', async () => {
      const user = makeUser({
        currentStreak: 3,
        lastStreakUpdateAt: istMidnightUTC(-1), // yesterday IST
      });
      await buildService(user);

      await service.recordSession(userId, sessionData);

      const updateCall = mockUserModel.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.currentStreak).toBe(4);
    });

    it('U-03: resets streak to 1 when gap is > 1 day', async () => {
      const user = makeUser({
        currentStreak: 5,
        lastStreakUpdateAt: istMidnightUTC(-3), // 3 days ago
      });
      await buildService(user);

      await service.recordSession(userId, sessionData);

      const updateCall = mockUserModel.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.currentStreak).toBe(1);
    });

    it('U-04: streak stays unchanged when two sessions on the same IST day', async () => {
      const user = makeUser({
        currentStreak: 7,
        lastStreakUpdateAt: istMidnightUTC(0), // today IST
      });
      await buildService(user);

      await service.recordSession(userId, sessionData);

      const updateCall = mockUserModel.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.currentStreak).toBe(7);
    });

    it('U-03b: resets streak to 1 when gap is exactly 2 days', async () => {
      const user = makeUser({
        currentStreak: 10,
        lastStreakUpdateAt: istMidnightUTC(-2), // 2 days ago
      });
      await buildService(user);

      await service.recordSession(userId, sessionData);

      const updateCall = mockUserModel.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.currentStreak).toBe(1);
    });

    it('U-NEW: sets streak to 1 for a brand-new user (null lastStreakUpdateAt)', async () => {
      const user = makeUser({
        currentStreak: 0,
        lastStreakUpdateAt: null,
      });
      await buildService(user);

      await service.recordSession(userId, sessionData);

      const updateCall = mockUserModel.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.currentStreak).toBe(1);
    });
  });

  // ── recordSession — $inc counters ──────────────────────────────────────────

  describe('recordSession — aggregated counters', () => {
    it('U-01: increments totalRounds, totalBeads, totalJaapSessions', async () => {
      const user = makeUser({ currentStreak: 0, lastStreakUpdateAt: null });
      await buildService(user);

      const data = { ...sessionData, rounds: 3, totalBeads: 324, coinsEarned: 5 };
      await service.recordSession(userId, data);

      const updateCall = mockUserModel.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$inc.totalRounds).toBe(3);
      expect(updateCall[1].$inc.totalBeads).toBe(324);
      expect(updateCall[1].$inc.totalJaapSessions).toBe(1);
      expect(updateCall[1].$inc.totalCoins).toBe(5);
    });

    it('U-01b: totalCoins defaults to 0 when coinsEarned is omitted', async () => {
      const user = makeUser({ currentStreak: 0, lastStreakUpdateAt: null });
      await buildService(user);

      await service.recordSession(userId, sessionData);

      const updateCall = mockUserModel.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$inc.totalCoins).toBe(0);
    });
  });

  // ── getUserStats ───────────────────────────────────────────────────────────

  describe('getUserStats', () => {
    it('U-05: returns correct stats for an existing user', async () => {
      const user = makeUser({
        totalCoins: 100,
        totalJaapSessions: 10,
        totalBeads: 1080,
        totalRounds: 10,
        currentStreak: 5,
        lastStreakUpdateAt: istMidnightUTC(0),
        lastLoginAt: null,
      });
      await buildService(user);

      const stats = await service.getUserStats(userId);

      expect(stats.totalCoins).toBe(100);
      expect(stats.totalJaapSessions).toBe(10);
      expect(stats.totalBeads).toBe(1080);
      expect(stats.totalRounds).toBe(10);
      expect(stats.streak).toBe(5);
    });

    it('U-05b: returns zero stats when user not found', async () => {
      await buildService(null); // user not found

      const stats = await service.getUserStats(userId);

      expect(stats.totalCoins).toBe(0);
      expect(stats.totalJaapSessions).toBe(0);
      expect(stats.streak).toBe(0);
    });

    it('U-05c: resets displayed streak when gap > 1 day (stat view)', async () => {
      const user = makeUser({
        currentStreak: 7,
        lastStreakUpdateAt: istMidnightUTC(-3), // 3 days ago — broken streak
        totalCoins: 0,
        totalJaapSessions: 0,
        totalBeads: 0,
        totalRounds: 0,
        lastLoginAt: null,
      });
      await buildService(user);

      const stats = await service.getUserStats(userId);

      // getUserStats should NOT show a broken streak
      expect(stats.streak).toBe(0);
    });
  });

  // ── getLeaderboard ─────────────────────────────────────────────────────────

  describe('getLeaderboard', () => {
    it('U-06: returns items with correct rank assigned', async () => {
      const users = [
        { _id: new Types.ObjectId(), firstName: 'Alice', totalBeads: 500 },
        { _id: new Types.ObjectId(), firstName: 'Bob', totalBeads: 300 },
      ];

      await buildService(null);
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(users),
      });
      mockUserModel.countDocuments.mockResolvedValue(2);

      const result = await service.getLeaderboard({ page: 1, limit: 20 });

      expect(result.items[0].rank).toBe(1);
      expect(result.items[1].rank).toBe(2);
    });

    it('U-06b: page 2 rank starts at limit+1', async () => {
      const users = [{ _id: new Types.ObjectId(), firstName: 'Charlie', totalBeads: 100 }];

      await buildService(null);
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(users),
      });
      mockUserModel.countDocuments.mockResolvedValue(21);

      const result = await service.getLeaderboard({ page: 2, limit: 20 });

      expect(result.items[0].rank).toBe(21);
    });

    it('U-06c: enforces safeLimit max of 100', async () => {
      await buildService(null);
      const findMock = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      mockUserModel.find.mockReturnValue(findMock);
      mockUserModel.countDocuments.mockResolvedValue(0);

      await service.getLeaderboard({ page: 1, limit: 9999 });

      // The limit passed to .limit() call should be capped at 100
      expect(findMock.limit).toHaveBeenCalledWith(100);
    });
  });

  // ── getUserSessions ────────────────────────────────────────────────────────

  describe('getUserSessions', () => {
    it('U-07: returns paginated sessions for the requesting user', async () => {
      const sessions = [{ _id: new Types.ObjectId(), category: 'gayatri' }];
      await buildService(null);

      mockJaapModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(sessions),
      });
      mockJaapModel.countDocuments.mockResolvedValue(1);

      const result = await service.getUserSessions(userId, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
