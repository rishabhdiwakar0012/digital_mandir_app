import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../core/auth/guards';
import { ZodValidationPipe } from '../../common/pipes';
import { AdminUpdateUserSchema } from './schemas/users.schema';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@Controller('admin/users')
@Roles('admin', 'super_admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.usersService.findAll(
      { page: +page, limit: Math.min(+limit, 100), sortBy, sortOrder },
      {
        search,
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        dateFrom,
        dateTo,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AdminUpdateUserSchema)) data: any,
    @CurrentUser() currentUser: any,
  ) {
    // Role promotion authorization checks
    if (data.roles) {
      const requestingUserRoles: string[] = currentUser?.roles || [];
      const isSuperAdmin = requestingUserRoles.includes('super_admin');
      const isAdmin = requestingUserRoles.includes('admin');

      if (data.roles.includes('super_admin')) {
        if (!isSuperAdmin) {
          throw new ForbiddenException(
            'Only a super admin can promote users to super admin',
          );
        }
        // Demote the current super admin to admin (remove super_admin, keep admin)
        const currentUserId = currentUser.sub || currentUser.id;
        if (currentUserId) {
          await this.usersService.update(currentUserId, {
            roles: ['admin'],
          } as any);
        }
      } else if (data.roles.includes('admin')) {
        if (!isAdmin && !isSuperAdmin) {
          throw new ForbiddenException(
            'Only admins can promote users to admin',
          );
        }
      }
    }

    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Get(':id/devices')
  @ApiOperation({ summary: 'Get user devices' })
  async getUserDevices(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getUserDevices(id, { page: +page, limit: +limit });
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Get user login sessions' })
  async getUserSessions(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getUserSessions(id, {
      page: +page,
      limit: +limit,
    });
  }

  @Get(':id/jaap-history')
  @ApiOperation({ summary: 'Get user jaap history' })
  async getUserJaapHistory(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.getUserJaapHistory(id, {
      page: +page,
      limit: +limit,
    });
  }
}
