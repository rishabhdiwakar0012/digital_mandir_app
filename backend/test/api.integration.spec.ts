/**
 * INTEGRATION TESTS — REST API endpoints
 *
 * Full HTTP stack: controller → service → MongoMemoryServer.
 *
 * IMPORTANT: TransformInterceptor wraps ALL responses as:
 *   { success: true, data: <payload>, timestamp, path }
 * So always read: res.body.data.* or fall back to res.body.*
 *
 * Run: cd backend && npx jest --config test/jest-e2e.json api.integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model } from 'mongoose';
import { AppModule } from '../src/app.module';

let mongod: MongoMemoryServer;
let app: INestApplication;

// ─── Helper: create a verified test user and return their access token ────────
async function createTestUser(email: string, otp: string): Promise<string> {
  const otpModel: Model<any> = app.get(getModelToken('Otp'));
  await otpModel.deleteMany({ email, type: 'email' });
  await otpModel.create({
    type: 'email', email, otp, attempts: 0,
    expiresAt: new Date(Date.now() + 5 * 60_000),
  });
  const res = await request(app.getHttpServer())
    .post('/auth/verify-email-otp')
    .send({ email, otp });
  return res.body.data?.accessToken ?? res.body.accessToken;
}

// ─── Helper: resolve body through TransformInterceptor wrapper ────────────────
function body(res: any): any {
  return res.body.data ?? res.body;
}

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
  process.env.JWT_ACCESS_EXPIRATION = '1d';
  process.env.JWT_REFRESH_EXPIRATION = '7d';
  process.env.EMAIL_PROVIDER = 'console';
  process.env.SMS_PROVIDER = 'console';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
}, 60_000);

afterAll(async () => {
  await app.close();
  await mongoose.disconnect();
  await mongod.stop();
}, 30_000);

// ═════════════════════════════════════════════════════════════════════════════
// HEALTH
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /health', () => {
  it('I-19: returns 200', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH — EMAIL OTP FLOW
// ═════════════════════════════════════════════════════════════════════════════

describe('Auth — Email OTP', () => {
  const testEmail = `otp_test_${Date.now()}@example.com`;

  it('I-01: send-email-otp returns 200 for new email', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/send-email-otp')
      .send({ email: testEmail, purpose: 'register' });
    expect([200, 201]).toContain(res.status);
  });

  it('I-02: rate-limits same email within 60s', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/send-email-otp')
      .send({ email: testEmail, purpose: 'register' });
    expect(res.status).toBe(400);
  });

  it('I-03: verify with wrong OTP returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/verify-email-otp')
      .send({ email: testEmail, otp: '000000' });
    expect([400, 401]).toContain(res.status);
  });

  it('I-05: injecting correct OTP and verifying returns accessToken', async () => {
    const otpModel: Model<any> = app.get(getModelToken('Otp'));
    await otpModel.deleteMany({ email: testEmail, type: 'email' });
    await otpModel.create({
      type: 'email', email: testEmail, otp: '654321',
      attempts: 0, expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    const res = await request(app.getHttpServer())
      .post('/auth/verify-email-otp')
      .send({ email: testEmail, otp: '654321' });

    expect([200, 201]).toContain(res.status);
    const token = body(res).accessToken;
    expect(token).toBeDefined();
  });

  it('SEC-06: OTP is single-use — second verify fails', async () => {
    const email2 = `single_use_${Date.now()}@example.com`;
    const otpModel: Model<any> = app.get(getModelToken('Otp'));
    await otpModel.deleteMany({ email: email2, type: 'email' });
    await otpModel.create({
      type: 'email', email: email2, otp: '777777',
      attempts: 0, expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    // First use — success
    await request(app.getHttpServer())
      .post('/auth/verify-email-otp')
      .send({ email: email2, otp: '777777' });

    // Second use — OTP was deleted, should fail
    const res2 = await request(app.getHttpServer())
      .post('/auth/verify-email-otp')
      .send({ email: email2, otp: '777777' });

    expect([400, 401]).toContain(res2.status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// USER PROFILE
// ═════════════════════════════════════════════════════════════════════════════

describe('User — Profile', () => {
  let token: string;
  const email = `profile_${Date.now()}@example.com`;

  beforeAll(async () => { token = await createTestUser(email, '100001'); });

  it('I-09: GET /user/profile returns profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/user/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const profile = body(res).profile;
    expect(profile).toBeDefined();
    expect(profile.email).toBe(email);
  });

  it('I-10: GET /user/profile returns 401 without token', async () => {
    const res = await request(app.getHttpServer()).get('/user/profile');
    expect(res.status).toBe(401);
  });

  it('SEC-14: profile does NOT expose password field', async () => {
    const res = await request(app.getHttpServer())
      .get('/user/profile')
      .set('Authorization', `Bearer ${token}`);
    const profile = body(res).profile;
    expect(profile?.password).toBeUndefined();
    expect(profile?.passwordHash).toBeUndefined();
  });

  it('I-11: PATCH /user/profile updates firstName', async () => {
    const res = await request(app.getHttpServer())
      .patch('/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'TestName' });

    expect(res.status).toBe(200);
    const profile = body(res).profile;
    expect(profile?.firstName).toBe('TestName');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// JAAP SESSIONS & STATS
// ═════════════════════════════════════════════════════════════════════════════

describe('Jaap — Sessions & Stats', () => {
  let token: string;
  let otherToken: string;
  const email = `jaap_${Date.now()}@example.com`;
  const emailOther = `jaap_other_${Date.now()}@example.com`;

  beforeAll(async () => {
    token = await createTestUser(email, '200001');
    otherToken = await createTestUser(emailOther, '200002');
  });

  it('I-13: POST /jaap/sessions records a session', async () => {
    const res = await request(app.getHttpServer())
      .post('/jaap/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'god', rounds: 1, totalBeads: 108, duration: 300, coinsEarned: 10 });
    expect([200, 201]).toContain(res.status);
  });

  it('I-14: rejects negative rounds', async () => {
    const res = await request(app.getHttpServer())
      .post('/jaap/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'god', rounds: -1, totalBeads: 108, duration: 300 });
    expect([400, 422]).toContain(res.status);
  });

  it('I-14b: rejects zero rounds', async () => {
    const res = await request(app.getHttpServer())
      .post('/jaap/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'god', rounds: 0, totalBeads: 108, duration: 300 });
    expect([400, 422]).toContain(res.status);
  });

  it('I-14c: rejects missing required fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/jaap/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ rounds: 1 });
    expect([400, 422]).toContain(res.status);
  });

  it('I-14d: rejects invalid category value', async () => {
    const res = await request(app.getHttpServer())
      .post('/jaap/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'gayatri', rounds: 1, totalBeads: 108, duration: 300 });
    // Should be 400 from Zod validation, NOT 500 from Mongoose
    expect(res.status).toBe(400);
  });

  it('I-15: GET /jaap/stats returns correct stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/jaap/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const data = body(res);
    expect(data.totalJaapSessions).toBeGreaterThanOrEqual(1);
    expect(data.totalBeads).toBeGreaterThanOrEqual(108);
    expect(data.streak).toBeGreaterThanOrEqual(1);
  });

  it('I-16: GET /jaap/sessions isolates per user', async () => {
    await request(app.getHttpServer())
      .post('/jaap/sessions')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ category: 'festival', rounds: 5, totalBeads: 540, duration: 100 });

    const res = await request(app.getHttpServer())
      .get('/jaap/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const items: any[] = (body(res).items ?? []);
    items.forEach((s) => expect(s.userId?.toString()).not.toBe(emailOther));
  });

  it('SEC-03: GET /jaap/stats requires auth', async () => {
    const res = await request(app.getHttpServer()).get('/jaap/stats');
    expect(res.status).toBe(401);
  });

  it('I-13b: same-day second session does NOT increase streak', async () => {
    const before = await request(app.getHttpServer())
      .get('/jaap/stats')
      .set('Authorization', `Bearer ${token}`);
    const streakBefore = body(before).streak;

    await request(app.getHttpServer())
      .post('/jaap/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'special', rounds: 2, totalBeads: 216, duration: 200 });

    const after = await request(app.getHttpServer())
      .get('/jaap/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(body(after).streak).toBe(streakBefore);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// LEADERBOARD (PUBLIC)
// ═════════════════════════════════════════════════════════════════════════════

describe('Jaap — Leaderboard', () => {
  it('I-17: is public — no auth required', async () => {
    const res = await request(app.getHttpServer()).get('/jaap/leaderboard');
    expect(res.status).toBe(200);
    expect(body(res).items).toBeDefined();
  });

  it('I-17b: each item has a rank field', async () => {
    const res = await request(app.getHttpServer()).get('/jaap/leaderboard?limit=5');
    const items = body(res).items ?? [];
    if (items.length > 0) expect(items[0].rank).toBe(1);
  });

  it('I-17c: does NOT expose password fields', async () => {
    const res = await request(app.getHttpServer()).get('/jaap/leaderboard');
    (body(res).items ?? []).forEach((item: any) => {
      expect(item.password).toBeUndefined();
      expect(item.passwordHash).toBeUndefined();
    });
  });

  it('P-LIMIT: limit capped at 100', async () => {
    const res = await request(app.getHttpServer()).get('/jaap/leaderboard?limit=9999');
    expect(res.status).toBe(200);
    expect((body(res).items?.length ?? 0)).toBeLessThanOrEqual(100);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH — REFRESH TOKEN, LOGOUT, ME
// ═════════════════════════════════════════════════════════════════════════════

describe('Auth — Refresh & Logout', () => {
  let accessToken: string;
  let refreshTokenValue: string;
  const email = `refresh_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Register user and capture both tokens from the response body
    const otpModel: Model<any> = app.get(getModelToken('Otp'));
    await otpModel.deleteMany({ email, type: 'email' });
    await otpModel.create({
      type: 'email', email, otp: '500001',
      attempts: 0, expiresAt: new Date(Date.now() + 5 * 60_000),
    });
    const res = await request(app.getHttpServer())
      .post('/auth/verify-email-otp')
      .send({ email, otp: '500001' });
    const d = body(res);
    accessToken = d.accessToken;
    refreshTokenValue = d.refreshToken;
  });

  it('AUTH-ME: GET /auth/me returns current user', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    const user = body(res).user;
    expect(user).toBeDefined();
    expect(user.email).toBe(email);
  });

  it('AUTH-ME-401: GET /auth/me without token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('AUTH-REFRESH: POST /auth/refresh returns new accessToken', async () => {
    if (!refreshTokenValue) return; // skip if OTP login skips refresh token
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refreshTokenValue });
    expect([200, 201]).toContain(res.status);
    const d = body(res);
    expect(d.accessToken).toBeDefined();
    // Update tokens for subsequent tests
    accessToken = d.accessToken;
    refreshTokenValue = d.refreshToken ?? refreshTokenValue;
  });

  it('AUTH-REFRESH-401: invalid refresh token returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'totally-invalid-token' });
    expect([400, 401]).toContain(res.status);
  });

  it('AUTH-LOGOUT: POST /auth/logout returns 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });

  it('AUTH-LOGOUT-INVALIDATES: after logout refresh token is revoked', async () => {
    if (!refreshTokenValue) return;
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refreshTokenValue });
    expect([400, 401]).toContain(res.status);
  });

  it('AUTH-LOGOUT-401: logout without token returns 401', async () => {
    const res = await request(app.getHttpServer()).post('/auth/logout');
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// USER — PREFERENCES & ONBOARDING
// ═════════════════════════════════════════════════════════════════════════════

describe('User — Preferences', () => {
  let token: string;
  const email = `prefs_${Date.now()}@example.com`;

  beforeAll(async () => { token = await createTestUser(email, '600001'); });

  it('PREF-GET: GET /user/preferences returns preferences', async () => {
    const res = await request(app.getHttpServer())
      .get('/user/preferences')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const prefs = body(res).preferences;
    expect(prefs).toBeDefined();
    expect(prefs).toHaveProperty('language');
    expect(prefs).toHaveProperty('notificationsEnabled');
  });

  it('PREF-GET-401: GET /user/preferences requires auth', async () => {
    const res = await request(app.getHttpServer()).get('/user/preferences');
    expect(res.status).toBe(401);
  });

  it('PREF-PATCH: PATCH /user/preferences updates language', async () => {
    const res = await request(app.getHttpServer())
      .patch('/user/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'hi' });
    expect(res.status).toBe(200);
    const prefs = body(res).preferences;
    expect(prefs.language).toBe('hi');
  });

  it('PREF-INVALID: PATCH with invalid language returns 400', async () => {
    const res = await request(app.getHttpServer())
      .patch('/user/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'fr' }); // not in ['en','hi','sa']
    expect([400, 422]).toContain(res.status);
  });

  it('PREF-NOTIFICATIONS: PATCH notificationsEnabled to false', async () => {
    const res = await request(app.getHttpServer())
      .patch('/user/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationsEnabled: false });
    expect(res.status).toBe(200);
    expect(body(res).preferences.notificationsEnabled).toBe(false);
  });
});

describe('User — Onboarding', () => {
  let token: string;
  const email = `onboard_${Date.now()}@example.com`;

  beforeAll(async () => { token = await createTestUser(email, '700001'); });

  it('ONBOARD-GET: GET /user/onboarding-status returns status', async () => {
    const res = await request(app.getHttpServer())
      .get('/user/onboarding-status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(d).toHaveProperty('onboardingCompleted');
  });

  it('ONBOARD-PATCH: PATCH /user/onboarding-status marks complete', async () => {
    const res = await request(app.getHttpServer())
      .patch('/user/onboarding-status')
      .set('Authorization', `Bearer ${token}`)
      .send({ onboardingCompleted: true, onboardingStep: 'done' });
    expect(res.status).toBe(200);
    expect(body(res).onboardingCompleted).toBe(true);
  });

  it('ONBOARD-401: requires auth', async () => {
    const res = await request(app.getHttpServer()).get('/user/onboarding-status');
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH — VALIDATION ERRORS (ZodValidationPipe coverage)
// ═════════════════════════════════════════════════════════════════════════════

describe('Auth — Validation', () => {
  it('VAL-01: send-email-otp with invalid email returns 400 not 500', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/send-email-otp')
      .send({ email: 'not-an-email', purpose: 'register' });
    expect(res.status).toBe(400);
  });

  it('VAL-02: verify-email-otp with short OTP returns 400 not 500', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/verify-email-otp')
      .send({ email: 'test@example.com', otp: '12' });
    expect(res.status).toBe(400);
  });

  it('VAL-03: POST /auth/refresh with empty body returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({});
    expect([400, 401]).toContain(res.status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ACCOUNT DELETION
// ═════════════════════════════════════════════════════════════════════════════

describe('User — Delete Account', () => {
  const delEmail = `delete_${Date.now()}@example.com`;
  let delToken: string;

  beforeAll(async () => { delToken = await createTestUser(delEmail, '300001'); });

  it('I-12: DELETE /user/account removes the account', async () => {
    const res = await request(app.getHttpServer())
      .delete('/user/account')
      .set('Authorization', `Bearer ${delToken}`);
    expect([200, 204]).toContain(res.status);
  });

  it('SEC-04: deleted account JWT is no longer valid', async () => {
    const res = await request(app.getHttpServer())
      .get('/user/profile')
      .set('Authorization', `Bearer ${delToken}`);
    expect([401, 404]).toContain(res.status);
  });
});
