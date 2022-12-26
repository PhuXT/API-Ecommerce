import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/role.decorator';
import { USERS_ROLE_ENUM } from './users.constant';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { STATUS_ENUM } from '../shared/constants';
import { ApiCommonResponse } from '../decorators/common-response.decorator';
import { StatusRespone } from '../shared/respone.dto';
import { UpdateUserDto } from './users.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Get()
  @ApiCommonResponse()
  @ApiOperation({
    operationId: 'GetListUsers',
    description: 'Get list Facebook Users info',
  })
  @ApiQuery({
    name: 'status',
    enum: STATUS_ENUM,
    required: false,
    example: STATUS_ENUM.ACTIVE,
  })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'perPage', type: Number, required: false, example: 25 })
  @ApiQuery({ name: 'sortBy', type: String, required: false })
  @ApiQuery({
    name: 'role',
    enum: USERS_ROLE_ENUM,
    required: false,
    example: USERS_ROLE_ENUM.ADMIN,
  })
  @ApiQuery({
    name: 'sortType',
    enum: ['asc', 'desc'],
    required: false,
    example: 'desc',
  })
  getList(@Query() query) {
    return this.usersService.getList(query);
  }

  //
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @ApiCommonResponse()
  @ApiOkResponse({ type: StatusRespone })
  @ApiOperation({
    operationId: 'DeleteUser',
    description: 'Delete user',
  })
  @Delete(':id')
  delete(@Param('id') query: string) {
    return this.usersService.delete(query);
  }

  //
  @Roles(USERS_ROLE_ENUM.ADMIN, USERS_ROLE_ENUM.USER)
  @ApiOperation({
    operationId: 'UpdateUser',
    description: 'Update user',
  })
  @ApiCommonResponse()
  @ApiOkResponse({ type: StatusRespone })
  @Patch('')
  updateInfo(@Request() request, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(request, updateUserDto);
  }
}
