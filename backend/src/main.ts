import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { urlencoded, json } from 'express';
import * as net from 'net';
import { AppModule } from './app.module';

/**
 * Check if a port is in use, and if so on Windows, kill the occupying process.
 * Prevents EADDRINUSE crashes during watch-mode restarts.
 */
async function ensurePortFree(port: number): Promise<void> {
  const inUse = await new Promise<boolean>((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(true))
      .once('listening', () => tester.close(() => resolve(false)))
      .listen(port);
  });

  if (!inUse) return;

  if (process.platform === 'win32') {
    const { execSync } = require('child_process');
    try {
      const output: string = execSync(
        `netstat -ano | findstr "LISTENING" | findstr ":${port}"`,
        { encoding: 'utf-8' },
      );
      const pids = new Set(
        output
          .trim()
          .split('\n')
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && pid !== '0'),
      );
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf-8' });
          console.log(
            `[Bootstrap] Killed stale process PID ${pid} on port ${port}`,
          );
        } catch {}
      }
    } catch {}
    // Give OS a moment to release the socket
    await new Promise((r) => setTimeout(r, 1000));
  } else {
    // Unix: fuser or lsof
    const { execSync } = require('child_process');
    try {
      execSync(`fuser -k ${port}/tcp`, { encoding: 'utf-8' });
      await new Promise((r) => setTimeout(r, 500));
    } catch {}
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  // Free port if a stale process is occupying it
  await ensurePortFree(port);
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  const corsOrigin = configService.get<string>('app.corsOrigin') || '*';

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Security
  app.use(helmet());

  // Body parser limits
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Language',
      'x-lang',
    ],
  });

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Digital Mandir API')
    .setDescription('Backend API for Digital Mandir application')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);

  console.log(`
🚀 Application is running on: http://localhost:${port}/${apiPrefix}
📚 Swagger documentation: http://localhost:${port}/docs
🌍 Environment: ${configService.get<string>('app.nodeEnv')}
  `);
}

bootstrap();
