import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
import {
  BadRequestDto,
  ConFlictExceptionDto,
  InternalServerErrorExceptionDto,
  UnauthorizedExceptionDto,
} from '../swangger/swangger.dto';
import { Roles } from '../auth/role.decorator';
import { USERS_ROLE_ENUM } from '../users/users.constant';
import { ItemSwangger } from './dto/swangger/item-swangger.dto';
import { ApiCommonResponse } from 'src/decorators/common-response.decorator';
import { IItemModel } from './items.schema';

@ApiTags('items')
@ApiInternalServerErrorResponse({
  type: InternalServerErrorExceptionDto,
  description: 'Server error',
})
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // [POST] create
  @ApiCreatedResponse({
    type: ItemSwangger,
    description: 'return item created',
  })
  @ApiConflictResponse({
    type: ConFlictExceptionDto,
    description: 'Email or barcode already exist',
  })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description: 'name, barcode, cost, price, image not empty',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedExceptionDto,
    description: 'login with non-admin rights',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Post()
  create(@Body() createItemDto: CreateItemDto): Promise<IItemModel> {
    return this.itemsService.create(createItemDto);
  }

  // [GET]
  @ApiCommonResponse()
  @ApiOperation({
    operationId: 'GetListUsers',
    description: 'Get list Facebook Users info',
  })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'perPage', type: Number, required: false, example: 25 })
  @ApiQuery({ name: 'sortBy', type: String, required: false })
  @ApiQuery({ name: 'itemName', type: String, required: false })
  @ApiQuery({ name: 'price', type: Number, required: false })
  @ApiQuery({ name: 'category', type: String, required: false })
  @ApiQuery({
    name: 'sortType',
    enum: ['asc', 'desc'],
    required: false,
    example: 'desc',
  })
  @Get('')
  getList(@Query() query) {
    return this.itemsService.getList(query);
  }

  // [GET] findOne
  @ApiOkResponse({ type: ItemSwangger, description: 'return items' })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description: '',
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  // [PATCH] update
  @ApiOkResponse({ type: ItemSwangger, description: 'return item updated' })
  @ApiConflictResponse({
    type: ConFlictExceptionDto,
    description: 'Name item or barcode already exist',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<IItemModel> {
    return this.itemsService.update(id, updateItemDto);
  }

  // DELETE
  @ApiOkResponse({ type: Boolean, description: 'return booean' })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description: 'Item sold > 0 ,Id not format objId',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USERS_ROLE_ENUM.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.itemsService.remove(id);
  }
}
