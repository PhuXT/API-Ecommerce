import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IVoucher } from './entities/voucher.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { USERS_ROLE_ENUM } from '../users/users.constant';
import { VoucherSwanggerDto } from './dto/swangger/voucher-swangger.dto';
import {
  BadRequestDto,
  ConFlictExceptionDto,
  InternalServerErrorExceptionDto,
  NotFoundExceptionDto,
  UnauthorizedExceptionDto,
} from '../swangger/swangger.dto';

@ApiTags('vouchers')
@ApiInternalServerErrorResponse({
  type: InternalServerErrorExceptionDto,
  description: 'Server error',
})
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  // [POST] CREATE
  @ApiCreatedResponse({
    type: VoucherSwanggerDto,
    description: 'Return new voucher',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedExceptionDto,
    description: 'login with non-admin rights',
  })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description:
      'startTime must be future and startTime < endTime, category doesnt exist',
  })
  @ApiConflictResponse({
    type: ConFlictExceptionDto,
    description: 'Code voucher already exist',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Post()
  create(@Body() createVoucherDto: CreateVoucherDto): Promise<IVoucher> {
    return this.vouchersService.create(createVoucherDto);
  }

  // [GET] find all
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USERS_ROLE_ENUM.ADMIN, USERS_ROLE_ENUM.USER)
  @ApiOkResponse({
    type: [VoucherSwanggerDto],
    description: 'Return list voucher',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedExceptionDto,
    description: 'Need to login',
  })
  @Get()
  findAll(): Promise<IVoucher[]> {
    return this.vouchersService.findAll();
  }

  // [GET] find one
  @ApiOkResponse({
    type: VoucherSwanggerDto,
    description: 'Return voucher finded by id',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedExceptionDto,
    description: 'Need to login',
  })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description: 'Id must format ObjId',
  })
  @ApiNotFoundResponse({
    type: NotFoundExceptionDto,
    description: 'voucher does not exist',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USERS_ROLE_ENUM.ADMIN, USERS_ROLE_ENUM.USER)
  @Get(':voucherId')
  findOne(@Param('voucherId') voucherId: string): Promise<IVoucher> {
    return this.vouchersService.findOne(voucherId);
  }

  // [PATCH]
  @ApiOkResponse({ type: VoucherSwanggerDto })
  @ApiUnauthorizedResponse({
    type: UnauthorizedExceptionDto,
    description: 'need to login with admin rights',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Patch(':voucherId')
  update(
    @Param('voucherId') voucherId: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ) {
    return this.vouchersService.update(voucherId, updateVoucherDto);
  }

  @ApiOkResponse({ type: Boolean })
  @ApiUnauthorizedResponse({
    type: UnauthorizedExceptionDto,
    description: 'need to login with admin rights',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Delete(':voucherId')
  remove(@Param('voucherId') voucherId: string): Promise<boolean> {
    return this.vouchersService.remove(voucherId);
  }
}
