import { Module, Global, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  UserSchema,
  Device,
  DeviceSchema,
  Session,
  SessionSchema,
  Otp,
  OtpSchema,
  Deity,
  DeitySchema,
  Mantra,
  MantraSchema,
  Content,
  ContentSchema,
  JaapSession,
  JaapSessionSchema,
  Notification,
  NotificationSchema,
  NotificationReceipt,
  NotificationReceiptSchema,
  ContentVersion,
  ContentVersionSchema,
} from './schemas';

const MODELS = [
  { name: User.name, schema: UserSchema },
  { name: Device.name, schema: DeviceSchema },
  { name: Session.name, schema: SessionSchema },
  { name: Otp.name, schema: OtpSchema },
  { name: Deity.name, schema: DeitySchema },
  { name: Mantra.name, schema: MantraSchema },
  { name: Content.name, schema: ContentSchema },
  { name: JaapSession.name, schema: JaapSessionSchema },
  { name: Notification.name, schema: NotificationSchema },
  { name: NotificationReceipt.name, schema: NotificationReceiptSchema },
  { name: ContentVersion.name, schema: ContentVersionSchema },
];

async function resolveMongoUri(uri: string): Promise<string> {
  const isLocal =
    uri.includes('localhost') ||
    uri.includes('127.0.0.1') ||
    uri.includes('::1');
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isLocal || isProduction) return uri;

  // Try to reach local MongoDB first
  const net = await import('net');
  const canConnect = await new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: 27017 });
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => resolve(false));
  });

  if (canConnect) return uri;

  // Fall back to in-memory MongoDB
  const logger = new Logger('DatabaseModule');
  logger.warn(
    'Local MongoDB not found – starting in-memory MongoDB for development',
  );

  // Lazy import so it's only loaded in dev

  const { MongoMemoryServer } =
    require('mongodb-memory-server-core') as typeof import('mongodb-memory-server-core');
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27017, dbName: 'mantra_jaap' },
  });
  const memUri = mongod.getUri();
  logger.log(`In-memory MongoDB started at ${memUri}`);
  return memUri;
}

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const configuredUri =
          configService.get<string>('database.mongoUri') ??
          'mongodb://localhost:27017/mantra_jaap';
        const uri = await resolveMongoUri(configuredUri);
        return { uri, autoIndex: true };
      },
    }),
    MongooseModule.forFeature(MODELS),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
