import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
  icon?: string;
}

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;
const FIREBASE_BATCH_SIZE = 500;

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private isFirebaseInitialized = false;

  get initialized(): boolean {
    return this.isFirebaseInitialized;
  }

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      if (admin.apps.length) {
        this.isFirebaseInitialized = true;
        return;
      }

      // Try to load from hardcoded JSON file paths
      const possiblePaths = [
        path.join(process.cwd(), 'firebase-google.json'),
        path.join(__dirname, '../../..', 'firebase-google.json'),
        '/app/firebase-google.json',
        './firebase-google.json',
      ];

      let serviceAccount: any = null;
      let loadedPath: string | null = null;

      for (const filePath of possiblePaths) {
        try {
          if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            serviceAccount = JSON.parse(fileContent);
            loadedPath = filePath;
            break;
          }
        } catch {
          // Continue to next path
        }
      }

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.isFirebaseInitialized = true;
        this.logger.log(
          `✅ Firebase Admin SDK initialized from: ${loadedPath}`,
        );
        return;
      }

      // Fallback: try env vars
      const projectId = this.configService.get<string>('fcm.projectId');
      const clientEmail = this.configService.get<string>('fcm.clientEmail');
      const privateKey = this.configService.get<string>('fcm.privateKey');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.includes('\\n')
              ? privateKey.replace(/\\n/g, '\n')
              : privateKey,
          }),
        });
        this.isFirebaseInitialized = true;
        this.logger.log(
          `✅ Firebase Admin SDK initialized from env vars — project: ${projectId}`,
        );
      } else {
        this.logger.error(
          `❌ Firebase initialization failed: firebase-google.json not found and FCM env vars not set`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  /** Expo push tokens start with ExponentPushToken[ or ExpoPushToken[ */
  private isExpoPushToken(token: string): boolean {
    return (
      token.startsWith('ExponentPushToken[') ||
      token.startsWith('ExpoPushToken[')
    );
  }

  async sendToMultiple(
    tokens: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const expoTokens = tokens.filter((t) => this.isExpoPushToken(t));
    const rawFcmTokens = tokens.filter((t) => !this.isExpoPushToken(t));

    let successCount = 0;
    let failureCount = 0;

    // Route Expo push tokens through Expo's Push Service
    if (expoTokens.length > 0) {
      const result = await this.sendViaExpoPushService(
        expoTokens,
        notification,
        data,
      );
      successCount += result.successCount;
      failureCount += result.failureCount;
    }

    // Route raw FCM tokens through Firebase Admin SDK
    if (rawFcmTokens.length > 0) {
      if (this.isFirebaseInitialized) {
        const result = await this.sendViaFirebase(
          rawFcmTokens,
          notification,
          data,
        );
        successCount += result.successCount;
        failureCount += result.failureCount;
      } else {
        this.logger.error(
          `Cannot send to ${rawFcmTokens.length} raw FCM token(s) — Firebase Admin SDK is NOT initialized. ` +
          `Check that FCM_PROJECT_ID, FCM_CLIENT_EMAIL, and FCM_PRIVATE_KEY are set in the server environment and the server was restarted after they were added.`,
        );
        failureCount += rawFcmTokens.length;
      }
    }

    return { successCount, failureCount };
  }

  private async sendViaExpoPushService(
    tokens: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    let successCount = 0;
    let failureCount = 0;

    try {
      for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
        const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);

        const messages: ExpoPushMessage[] = batch.map((token) => ({
          to: token,
          title: notification.title,
          body: notification.body,
          data: data ?? {},
          sound: 'default',
          priority: 'high',
          channelId: 'default',
          badge: 1,
          icon: '@file:ic_stat_adaptive_icon.png',
        }));

        const response = await fetch(EXPO_PUSH_ENDPOINT, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });

        if (!response.ok) {
          this.logger.error(
            `Expo Push API HTTP error: ${response.status} ${response.statusText}`,
          );
          failureCount += batch.length;
          continue;
        }

        const result = (await response.json()) as { data: ExpoTicket[] };
        for (const ticket of result.data ?? []) {
          if (ticket.status === 'ok') {
            successCount++;
          } else {
            failureCount++;
            this.logger.warn(
              `Expo push ticket error: ${ticket.message}`,
              ticket.details,
            );
          }
        }
      }

      this.logger.log(
        `Expo Push Service: ${successCount} sent, ${failureCount} failed`,
      );
    } catch (error: any) {
      this.logger.error('Expo Push Service request failed:', error.message);
      failureCount += tokens.length - successCount;
    }

    return { successCount, failureCount };
  }

  private async sendViaFirebase(
    tokens: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    let successCount = 0;
    let failureCount = 0;

    try {
      for (let i = 0; i < tokens.length; i += FIREBASE_BATCH_SIZE) {
        const batch = tokens.slice(i, i + FIREBASE_BATCH_SIZE);
        const message: admin.messaging.MulticastMessage = {
          tokens: batch,
          notification,
          data,
          android: { priority: 'high' },
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        successCount += response.successCount;
        failureCount += response.failureCount;

        // Log per-token failures for easier debugging
        response.responses.forEach((r, i) => {
          if (!r.success) {
            const tok = batch[i];
            this.logger.warn(
              `FCM token [${tok.slice(0, 30)}…] failed: ${r.error?.code} — ${r.error?.message}`,
            );
          }
        });
      }

      this.logger.log(
        `Firebase FCM: ${successCount} sent, ${failureCount} failed`,
      );
    } catch (error: any) {
      this.logger.error('Firebase multicast send failed:', error.message);
      failureCount += tokens.length - successCount;
    }

    return { successCount, failureCount };
  }

  /** Convenience wrapper for single-device sends */
  async sendToDevice(
    token: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<boolean> {
    const result = await this.sendToMultiple([token], notification, data);
    return result.successCount > 0;
  }
}
