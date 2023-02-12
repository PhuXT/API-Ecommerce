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
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/role.decorator';
import { USERS_ROLE_ENUM } from '../users/users.constant';
import {
  BadRequestDto,
  InternalServerErrorExceptionDto,
  UnauthorizedExceptionDto,
} from '../swangger/swangger.dto';
import { OrderSwanggerDto } from './dto/swangger/order-swangger.dto';
import { IOrderModel } from './order.schema';
import { Request } from '@nestjs/common/decorators';

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
  create(
    @Req() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<IOrderModel> {
    return this.ordersService.create(req.user, createOrderDto);
  }

  // [GET] get list
  @ApiOkResponse()
  @Roles(USERS_ROLE_ENUM.ADMIN, USERS_ROLE_ENUM.USER)
  @ApiOperation({
    operationId: 'GetListOrders',
    description: 'Get list ',
  })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'perPage', type: Number, required: false, example: 25 })
  @ApiQuery({
    name: 'sortBy',
    type: String,
    required: false,
    example: 'totalPrice',
  })
  @ApiQuery({ name: 'orderID', type: String, required: false })
  @ApiQuery({ name: 'itemName', type: String, required: false })
  @ApiQuery({ name: 'userName', type: String, required: false })
  @ApiQuery({ name: 'userID', type: String, required: false })
  @ApiQuery({ name: 'status', type: String, required: false })
  @ApiQuery({ name: 'createdAt', type: Date, required: false })
  @ApiQuery({
    name: 'sortType',
    enum: ['asc', 'desc'],
    required: false,
    example: 'desc',
  })
  @Get()
  getList(@Query() query, @Request() request) {
    return this.ordersService.getList(request, query);
  }

  // [UPDATE]
  @ApiOkResponse({ type: String })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description: 'Order canceled ',
  })
  @Roles(USERS_ROLE_ENUM.ADMIN, USERS_ROLE_ENUM.USER)
  @Patch(':id/cancellation')
  cancel(@Param('id') id: string, @Req() req): Promise<string> {
    return this.ordersService.update(id, req);
  }

  // [DELETE]
  @ApiOkResponse({ type: Boolean })
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }
}
