import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { USERS_ROLE_ENUM } from '../users/users.constant';
import { IOrder } from './entities/order.entity';
import {
  BadRequestDto,
  InternalServerErrorExceptionDto,
  UnauthorizedExceptionDto,
} from '../swangger/swangger.dto';
import { OrderSwanggerDto } from './dto/swangger/order-swangger.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiInternalServerErrorResponse({
  type: InternalServerErrorExceptionDto,
  description: 'Server error',
})
@ApiUnauthorizedResponse({
  type: UnauthorizedExceptionDto,
})
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // [POST] create
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description:
      'Item not exist, stocks < quantityOrder, voucher not exist, voucher invalid',
  })
  @ApiCreatedResponse({ type: OrderSwanggerDto })
  @Roles(USERS_ROLE_ENUM.ADMIN, USERS_ROLE_ENUM.USER)
  @Post()
  create(@Req() req, @Body() createOrderDto: CreateOrderDto): Promise<IOrder> {
    return this.ordersService.create(req.user, createOrderDto);
  }

  // [GET] get all
  @ApiOkResponse({ type: [OrderSwanggerDto] })
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Get()
  findAll(): Promise<IOrder[]> {
    return this.ordersService.findAll();
  }

  // [GET] findOne
  @ApiOkResponse({ type: OrderSwanggerDto })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description: 'Only get your order',
  })
  @Roles(USERS_ROLE_ENUM.ADMIN, USERS_ROLE_ENUM.USER)
  @Get(':id')
  findOne(@Param('id') idOrder: string, @Req() req) {
    return this.ordersService.findOne(req.user.id, idOrder);
  }

  @ApiOkResponse({ type: String })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description: 'Order canceled ',
  })
  @Roles(USERS_ROLE_ENUM.ADMIN, USERS_ROLE_ENUM.USER)
  @Patch(':id/cancellation')
  cancel(@Param('id') id: string): Promise<string> {
    return this.ordersService.update(id);
  }

  // [DELETE]
  @ApiOkResponse({ type: Boolean })
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string): Promise<boolean> {
    return this.ordersService.delete(id);
  }
}
