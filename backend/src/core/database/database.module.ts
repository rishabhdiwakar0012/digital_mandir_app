import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserSchema } from './schemas';

/**
 * Database Module
 *
 * TODO: MongoDB Integration Instructions
 * =======================================
 *
 * This module sets up the MongoDB connection for the application.
 * It uses Mongoose to interact with MongoDB.
 *
 * SETUP STEPS:
 *
 * 1. Install MongoDB:
 *    Option A - Local Installation:
 *      - Download from: https://www.mongodb.com/try/download/community
 *      - Install MongoDB Community Server
 *      - Start MongoDB service:
 *        Windows: Services -> MongoDB Server -> Start
 *        Mac: brew services start mongodb-community
 *        Linux: sudo systemctl start mongod
 *
 *    Option B - MongoDB Atlas (Cloud):
 *      - Sign up at: https://www.mongodb.com/cloud/atlas
 *      - Create a free cluster
 *      - Get connection string from "Connect" -> "Connect your application"
 *
 * 2. Install Dependencies:
 *    Run: npm install
 *    This will install @nestjs/mongoose and mongoose
 *
 * 3. Configure Environment:
 *    Create .env file (copy from .env.example)
 *    Set DATABASE_URL:
 *      Local: DATABASE_URL=mongodb://localhost:27017/digital_mantra
 *      Atlas: DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/digital_mantra
 *
 * 4. Start Application:
 *    Run: npm run start:dev
 *    You should see: "MongoDB connected successfully" in logs
 *
 * FEATURES:
 * - Automatic connection handling
 * - Connection pooling
 * - Auto-reconnection on failure
 * - Supports both local MongoDB and MongoDB Atlas
 */

@Global()
@Module({
  imports: [
    // MongoDB Connection Setup
    // This will connect to the database URL specified in .env
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri =
          configService.get<string>('database.url') ||
          'mongodb://localhost:27017/digital_mantra';

        console.log('🔌 Connecting to MongoDB...');
        // TODO: MongoDB Setup - Uncomment the line below once MongoDB is installed
        // console.log('📍 MongoDB URI:', uri?.replace(/\/\/.*@/, '//<credentials>@')); // Hide credentials in logs

        return {
          uri,
          // Connection options
          retryAttempts: 3,
          retryDelay: 1000,
          // TODO: MongoDB Setup - Add additional options as needed
          // useNewUrlParser: true,
          // useUnifiedTopology: true,
        };
      },
    } as any),

    // Register User Model
    // This makes the User model available for injection throughout the app
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  exports: [
    // Export MongooseModule to make User model available in other modules
    MongooseModule,
  ],
})
export class DatabaseModule {
  constructor() {
    // TODO: MongoDB Setup - This will log when the module is initialized
    console.log('📦 Database Module initialized');
    console.log('⚠️  MongoDB connection will be established on first query');
    console.log(
      '💡 Make sure MongoDB is running and DATABASE_URL is set in .env',
    );
  }
}
