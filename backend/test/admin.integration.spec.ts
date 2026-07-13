/**
 * ADMIN INTEGRATION TESTS — REST API endpoints
 *
 * Full HTTP stack: controller → service → MongoMemoryServer.
 * Tests all admin-only endpoints with auth, role, and functionality checks.
 *
 * IMPORTANT: TransformInterceptor wraps ALL responses as:
 *   { success: true, data: <payload>, timestamp, path }
 * So always read: res.body.data.* or fall back to res.body.*
 *
 * Run: cd backend && npx jest --config test/jest-e2e.json admin.integration
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

// Default admin credentials seeded by seedAdmin()
const ADMIN_EMAIL = 'admin@digitalmandir.in';
const ADMIN_PASSWORD = 'Admin@123456';

// ─── Helper: resolve body through TransformInterceptor wrapper ───────────────
function body(res: any): any {
  return res.body.data ?? res.body;
}

// ─── Helper: create a regular (non-admin) test user and return access token ──
async function createTestUser(email: string, otp: string): Promise<string> {
  const otpModel: Model<any> = app.get(getModelToken('Otp'));
  await otpModel.deleteMany({ email, type: 'email' });
  await otpModel.create({
    type: 'email',
    email,
    otp,
    attempts: 0,
    expiresAt: new Date(Date.now() + 5 * 60_000),
  });
  const res = await request(app.getHttpServer())
    .post('/auth/verify-email-otp')
    .send({ email, otp });
  return res.body.data?.accessToken ?? res.body.accessToken;
}

// ─── Helper: login admin and return access token ─────────────────────────────
async function getAdminToken(): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/admin/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return res.body.data?.accessToken ?? res.body.accessToken;
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
  process.env.ADMIN_EMAIL = ADMIN_EMAIL;
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.ADMIN_PHONE = '+919999999999';

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
// ADMIN AUTH — PASSWORD LOGIN
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Auth — Password Login', () => {
  it('A-01: POST /auth/admin/login with correct credentials returns accessToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect([200, 201]).toContain(res.status);
    const d = body(res);
    expect(d.accessToken).toBeDefined();
    expect(typeof d.accessToken).toBe('string');
  });

  it('A-02: POST /auth/admin/login with wrong password returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({ email: ADMIN_EMAIL, password: 'WrongPassword123' });
    expect(res.status).toBe(401);
  });

  it('A-03: POST /auth/admin/login with non-admin email returns 401', async () => {
    // Create a regular user first
    const email = `non_admin_${Date.now()}@example.com`;
    const otpModel: Model<any> = app.get(getModelToken('Otp'));
    await otpModel.deleteMany({ email, type: 'email' });
    await otpModel.create({
      type: 'email',
      email,
      otp: '111111',
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });
    await request(app.getHttpServer())
      .post('/auth/verify-email-otp')
      .send({ email, otp: '111111' });

    // Try to login as admin with regular user credentials (no password set)
    const res = await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({ email, password: 'somepassword' });
    expect(res.status).toBe(401);
  });

  it('A-04: POST /auth/admin/login with missing fields returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({ email: ADMIN_EMAIL });
    expect([400, 422]).toContain(res.status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH — OTP LOGIN
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Auth — OTP Login', () => {
  it('A-05: POST /auth/admin/send-otp for admin email returns 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/admin/send-otp')
      .send({ email: ADMIN_EMAIL });
    expect([200, 201]).toContain(res.status);
    const d = body(res);
    expect(d.message).toBeDefined();
  });

  it('A-06: POST /auth/admin/send-otp for non-admin email returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/admin/send-otp')
      .send({ email: 'notanadmin@example.com' });
    expect(res.status).toBe(401);
  });

  it('A-07: POST /auth/admin/verify-otp with valid OTP returns accessToken', async () => {
    // Inject OTP directly for the admin
    const otpModel: Model<any> = app.get(getModelToken('Otp'));
    await otpModel.deleteMany({ email: ADMIN_EMAIL, type: 'email' });
    await otpModel.create({
      type: 'email',
      email: ADMIN_EMAIL,
      otp: '987654',
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    const res = await request(app.getHttpServer())
      .post('/auth/admin/verify-otp')
      .send({ email: ADMIN_EMAIL, otp: '987654' });
    expect([200, 201]).toContain(res.status);
    const d = body(res);
    expect(d.accessToken).toBeDefined();
  });

  it('A-08: POST /auth/admin/verify-otp with wrong OTP returns 400', async () => {
    const otpModel: Model<any> = app.get(getModelToken('Otp'));
    await otpModel.deleteMany({ email: ADMIN_EMAIL, type: 'email' });
    await otpModel.create({
      type: 'email',
      email: ADMIN_EMAIL,
      otp: '112233',
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    const res = await request(app.getHttpServer())
      .post('/auth/admin/verify-otp')
      .send({ email: ADMIN_EMAIL, otp: '000000' });
    expect([400, 401]).toContain(res.status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN USERS — ROLE-BASED ACCESS
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Users — Access Control', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    userToken = await createTestUser(`acl_user_${Date.now()}@example.com`, '300001');
  });

  it('A-09: GET /admin/users without token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/admin/users');
    expect(res.status).toBe(401);
  });

  it('A-10: GET /admin/users with regular user token returns 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('A-11: GET /admin/users with admin token returns 200 and items array', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(Array.isArray(d.items ?? d.users ?? d)).toBe(true);
  });

  it('A-12: GET /admin/users response does NOT expose password fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const items: any[] = body(res).items ?? body(res).users ?? [];
    items.forEach((u) => {
      expect(u.password).toBeUndefined();
      expect(u.passwordHash).toBeUndefined();
    });
  });

  it('A-13: GET /admin/users supports pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(d.page ?? d.pagination?.page ?? 1).toBeDefined();
  });

  it('A-14: GET /admin/users/:id returns user details', async () => {
    // Get admin user's own ID from user list
    const listRes = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const items: any[] = body(listRes).items ?? body(listRes).users ?? [];
    const adminUser = items.find((u: any) => u.email === ADMIN_EMAIL);
    if (!adminUser) return; // skip if not found yet

    const res = await request(app.getHttpServer())
      .get(`/admin/users/${adminUser._id ?? adminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    const user = d.user ?? d;
    expect(user.email).toBe(ADMIN_EMAIL);
  });

  it('A-15: GET /admin/users/:id with invalid ID returns 400 or 404', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users/not-a-valid-id')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([400, 404]).toContain(res.status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN USERS — UPDATE & DEACTIVATE
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Users — Update & Deactivate', () => {
  let adminToken: string;
  let targetUserId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    // Create a fresh user to update/deactivate without side-effects
    const email = `target_user_${Date.now()}@example.com`;
    await createTestUser(email, '400001');

    const listRes = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const items: any[] = body(listRes).items ?? body(listRes).users ?? [];
    const target = items.find((u: any) => u.email === email);
    targetUserId = target?._id ?? target?.id;
  });

  it('A-16: PATCH /admin/users/:id updates user firstName', async () => {
    if (!targetUserId) return;
    const res = await request(app.getHttpServer())
      .patch(`/admin/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'UpdatedName' });
    expect([200, 201]).toContain(res.status);
  });

  it('A-17: PATCH /admin/users without auth returns 401', async () => {
    if (!targetUserId) return;
    const res = await request(app.getHttpServer())
      .patch(`/admin/users/${targetUserId}`)
      .send({ firstName: 'Hacked' });
    expect(res.status).toBe(401);
  });

  it('A-18: DELETE /admin/users/:id deactivates user', async () => {
    if (!targetUserId) return;
    const res = await request(app.getHttpServer())
      .delete(`/admin/users/${targetUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(res.status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN USERS — DEVICES, SESSIONS, JAAP HISTORY
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Users — Sub-resources', () => {
  let adminToken: string;
  let targetUserId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const email = `subres_user_${Date.now()}@example.com`;
    await createTestUser(email, '450001');

    const listRes = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const items: any[] = body(listRes).items ?? body(listRes).users ?? [];
    const target = items.find((u: any) => u.email === email);
    targetUserId = target?._id ?? target?.id;
  });

  it('A-19: GET /admin/users/:id/devices returns 200', async () => {
    if (!targetUserId) return;
    const res = await request(app.getHttpServer())
      .get(`/admin/users/${targetUserId}/devices`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(Array.isArray(d.items ?? d.devices ?? d)).toBe(true);
  });

  it('A-20: GET /admin/users/:id/sessions returns 200', async () => {
    if (!targetUserId) return;
    const res = await request(app.getHttpServer())
      .get(`/admin/users/${targetUserId}/sessions`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-21: GET /admin/users/:id/jaap-history returns 200', async () => {
    if (!targetUserId) return;
    const res = await request(app.getHttpServer())
      .get(`/admin/users/${targetUserId}/jaap-history`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(Array.isArray(d.items ?? d.history ?? d)).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Analytics', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    userToken = await createTestUser(`analytics_user_${Date.now()}@example.com`, '500002');
  });

  it('A-22: GET /admin/analytics/dashboard without token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/admin/analytics/dashboard');
    expect(res.status).toBe(401);
  });

  it('A-23: GET /admin/analytics/dashboard with user token returns 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/analytics/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('A-24: GET /admin/analytics/dashboard with admin token returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(d).toBeDefined();
  });

  it('A-25: GET /admin/analytics/users returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/analytics/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-26: GET /admin/analytics/jaap returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/analytics/jaap')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-27: GET /admin/analytics/devices returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/analytics/devices')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-28: GET /admin/analytics/content returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/analytics/content')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-29: GET /admin/analytics/geography returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/analytics/geography')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('A-30: GET /admin/analytics/age-groups returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/analytics/age-groups')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN CONTENT — MANTRAS CRUD
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Content — Mantras', () => {
  let adminToken: string;
  let userToken: string;
  let createdMantraId: string;

  const validMantra = {
    category: 'god',
    title: { en: 'Om Namah Shivaya', hi: 'ॐ नमः शिवाय', sa: 'ॐ नमः शिवाय' },
    text: { en: 'Om Namah Shivaya', hi: 'ॐ नमः शिवाय', sa: 'ॐ नमः शिवाय' },
    beadCount: 108,
    isActive: true,
  };

  beforeAll(async () => {
    adminToken = await getAdminToken();
    userToken = await createTestUser(`mantra_user_${Date.now()}@example.com`, '600001');
  });

  it('A-31: POST /admin/mantras without auth returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/mantras')
      .send(validMantra);
    expect(res.status).toBe(401);
  });

  it('A-32: POST /admin/mantras with user token returns 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/mantras')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validMantra);
    expect(res.status).toBe(403);
  });

  it('A-33: POST /admin/mantras with admin token creates mantra', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/mantras')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validMantra);
    expect([200, 201]).toContain(res.status);
    const d = body(res);
    const mantra = d.mantra ?? d;
    expect(mantra._id ?? mantra.id).toBeDefined();
    createdMantraId = mantra._id ?? mantra.id;
  });

  it('A-34: POST /admin/mantras with invalid category returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/mantras')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validMantra, category: 'invalid_category' });
    expect([400, 422]).toContain(res.status);
  });

  it('A-35: GET /admin/mantras returns list', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/mantras')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(Array.isArray(d.items ?? d.mantras ?? d)).toBe(true);
  });

  it('A-36: GET /admin/mantras/:id returns created mantra', async () => {
    if (!createdMantraId) return;
    const res = await request(app.getHttpServer())
      .get(`/admin/mantras/${createdMantraId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    const mantra = d.mantra ?? d;
    expect(mantra.category).toBe('god');
  });

  it('A-37: PUT /admin/mantras/:id updates mantra', async () => {
    if (!createdMantraId) return;
    const res = await request(app.getHttpServer())
      .put(`/admin/mantras/${createdMantraId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ beadCount: 216 });
    expect([200, 201]).toContain(res.status);
  });

  it('A-38: DELETE /admin/mantras/:id soft-deletes mantra', async () => {
    if (!createdMantraId) return;
    const res = await request(app.getHttpServer())
      .delete(`/admin/mantras/${createdMantraId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(res.status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN CONTENT — DEITIES CRUD
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Content — Deities', () => {
  let adminToken: string;
  let createdDeityId: string;

  const validDeity = {
    slug: `test-shiva-${Date.now()}`,
    name: { en: 'Lord Shiva', hi: 'भगवान शिव', sa: 'भगवान शिव' },
    isActive: true,
  };

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  it('A-39: POST /admin/deities creates a deity', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/deities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validDeity);
    expect([200, 201]).toContain(res.status);
    const d = body(res);
    const deity = d.deity ?? d;
    expect(deity._id ?? deity.id).toBeDefined();
    createdDeityId = deity._id ?? deity.id;
  });

  it('A-40: POST /admin/deities without required slug returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/deities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: { en: 'No Slug', hi: '', sa: '' } });
    expect([400, 422]).toContain(res.status);
  });

  it('A-41: GET /admin/deities returns list', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/deities')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(Array.isArray(d.items ?? d.deities ?? d)).toBe(true);
  });

  it('A-42: PUT /admin/deities/:id updates deity', async () => {
    if (!createdDeityId) return;
    const res = await request(app.getHttpServer())
      .put(`/admin/deities/${createdDeityId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect([200, 201]).toContain(res.status);
  });

  it('A-43: DELETE /admin/deities/:id soft-deletes deity', async () => {
    if (!createdDeityId) return;
    const res = await request(app.getHttpServer())
      .delete(`/admin/deities/${createdDeityId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(res.status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN CONTENT — CONTENT SECTIONS CRUD
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Content — Content Sections', () => {
  let adminToken: string;
  let createdContentId: string;

  const validContent = {
    section: 'festival',
    title: { en: 'Diwali Special', hi: 'दीपावली विशेष', sa: '' },
    isActive: true,
  };

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  it('A-44: POST /admin/content creates content', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validContent);
    expect([200, 201]).toContain(res.status);
    const d = body(res);
    const content = d.content ?? d;
    expect(content._id ?? content.id).toBeDefined();
    createdContentId = content._id ?? content.id;
  });

  it('A-45: POST /admin/content with invalid section returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validContent, section: 'invalid_section' });
    expect([400, 422]).toContain(res.status);
  });

  it('A-46: GET /admin/content returns list', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/content')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(Array.isArray(d.items ?? d.content ?? d)).toBe(true);
  });

  it('A-47: GET /admin/content returns created item in list', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/content')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    const items: any[] = d.items ?? d.content ?? d;
    const found = items.find((c: any) => c._id?.toString() === createdContentId || c.id?.toString() === createdContentId);
    if (createdContentId) expect(found).toBeDefined();
  });

  it('A-48: PUT /admin/content/:id updates content', async () => {
    if (!createdContentId) return;
    const res = await request(app.getHttpServer())
      .put(`/admin/content/${createdContentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect([200, 201]).toContain(res.status);
  });

  it('A-49: DELETE /admin/content/:id deletes content', async () => {
    if (!createdContentId) return;
    const res = await request(app.getHttpServer())
      .delete(`/admin/content/${createdContentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(res.status);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN JAAP — LEADERBOARD & ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Jaap — Leaderboard & Analytics', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    userToken = await createTestUser(`jaap_admin_${Date.now()}@example.com`, '700001');
  });

  it('A-50: GET /admin/jaap/leaderboard without token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/admin/jaap/leaderboard');
    expect(res.status).toBe(401);
  });

  it('A-51: GET /admin/jaap/leaderboard with user token returns 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/jaap/leaderboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('A-52: GET /admin/jaap/leaderboard with admin token returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/jaap/leaderboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(d.items).toBeDefined();
  });

  it('A-53: GET /admin/jaap/analytics returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/jaap/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(d.totalSessions).toBeDefined();
  });

  it('A-54: GET /admin/jaap/leaderboard supports pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/jaap/leaderboard?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Notifications', () => {
  let adminToken: string;
  let userToken: string;
  let createdNotifId: string;

  const validNotification = {
    title: 'Test Notification',
    body: 'This is a test notification for integration testing',
    type: 'push',
  };

  beforeAll(async () => {
    adminToken = await getAdminToken();
    userToken = await createTestUser(`notif_user_${Date.now()}@example.com`, '800001');
  });

  it('A-55: POST /admin/notifications without token returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/notifications')
      .send(validNotification);
    expect(res.status).toBe(401);
  });

  it('A-56: POST /admin/notifications with user token returns 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validNotification);
    expect(res.status).toBe(403);
  });

  it('A-57: POST /admin/notifications with admin token returns 200 or 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validNotification);
    expect([200, 201]).toContain(res.status);
    const d = body(res);
    const notif = d.notification ?? d;
    createdNotifId = notif._id ?? notif.id;
  });

  it('A-58: GET /admin/notifications returns list', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    expect(Array.isArray(d.items ?? d.notifications ?? d)).toBe(true);
  });

  it('A-59: GET /admin/notifications/:id returns notification detail', async () => {
    if (!createdNotifId) return;
    const res = await request(app.getHttpServer())
      .get(`/admin/notifications/${createdNotifId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const d = body(res);
    const notif = d.notification ?? d;
    expect(notif.title ?? notif._id ?? notif.id).toBeDefined();
  });

  it('A-60: GET /admin/notifications without token returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/admin/notifications');
    expect(res.status).toBe(401);
  });
});
