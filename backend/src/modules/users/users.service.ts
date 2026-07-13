import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  User,
  UserDocument,
  Device,
  DeviceDocument,
  Session,
  SessionDocument,
  JaapSession,
  JaapSessionDocument,
} from '../../common/database/schemas';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UsersFilter {
  search?: string;
  role?: string;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(JaapSession.name)
    private readonly jaapSessionModel: Model<JaapSessionDocument>,
  ) {}

  async findAll(pagination: PaginationOptions, filters: UsersFilter) {
    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { email: searchRegex },
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (filters.role) {
      query.roles = filters.role;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    const [items, totalItems] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    // Fetch latest devices for these users
    const userIds = items.map((u) => u._id);
    const devices = await this.deviceModel.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $sort: { lastActiveAt: -1 } },
      { $group: { _id: '$userId', deviceModel: { $first: '$deviceModel' } } },
    ]);

    const deviceMap = new Map(
      devices.map((d) => [d._id.toString(), d.deviceModel]),
    );

    return {
      items: items.map((u) => ({
        ...u,
        id: u._id.toString(),
        deviceModel: deviceMap.get(u._id.toString()) || null,
      })),
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: string) {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const user = await this.userModel.findById(id).select('-password').lean();

    if (!user) throw new NotFoundException('User not found');

    return { ...user, id: user._id.toString() };
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .select('-password')
      .lean();

    if (!user) throw new NotFoundException('User not found');

    return { ...user, id: user._id.toString() };
  }

  async deactivate(id: string) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .select('-password')
      .lean();

    if (!user) throw new NotFoundException('User not found');

    return { ...user, id: user._id.toString() };
  }

  async getUserDevices(userId: string, pagination: PaginationOptions) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const query = { userId: new Types.ObjectId(userId) };

    const [items, totalItems] = await Promise.all([
      this.deviceModel
        .find(query)
        .sort({ lastActiveAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.deviceModel.countDocuments(query),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async getUserSessions(userId: string, pagination: PaginationOptions) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const query = { userId: new Types.ObjectId(userId) };

    const [items, totalItems] = await Promise.all([
      this.sessionModel
        .find(query)
        .populate('deviceId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.sessionModel.countDocuments(query),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async getUserJaapHistory(userId: string, pagination: PaginationOptions) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const query = { userId: new Types.ObjectId(userId) };

    const [items, totalItems] = await Promise.all([
      this.jaapSessionModel
        .find(query)
        .populate('mantraId')
        .populate('deityId')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.jaapSessionModel.countDocuments(query),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async getTotalCount(): Promise<number> {
    return this.userModel.countDocuments({ isActive: true });
  }

  async getNewUsersCount(since: Date): Promise<number> {
    return this.userModel.countDocuments({
      createdAt: { $gte: since },
    });
  }

  async getActiveUsersCount(since: Date): Promise<number> {
    return this.userModel.countDocuments({
      lastLoginAt: { $gte: since },
      isActive: true,
    });
  }
}
