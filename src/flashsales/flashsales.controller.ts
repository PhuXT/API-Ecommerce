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
import { FlashsalesService } from './flashsales.service';
import { CreateFlashsaleDto } from './dto/create-flashsale.dto';
import { UpdateFlashsaleDto } from './dto/update-flashsale.dto';
import { IFlashSale } from './entities/flashsale.entity';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { USERS_ROLE_ENUM } from '../users/users.constant';
import { Roles } from '../auth/role.decorator';
import {
  BadRequestDto,
  ConFlictExceptionDto,
  InternalServerErrorExceptionDto,
  UnauthorizedExceptionDto,
} from '../swangger/swangger.dto';
import { FlashSaleSwangger } from './dto/swangger/flash-sale-swangger.dto';
import { type } from 'os';

@ApiTags('flashsales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USERS_ROLE_ENUM.ADMIN)
@Controller('flashsales')
@ApiInternalServerErrorResponse({
  type: InternalServerErrorExceptionDto,
  description: 'Server error',
})
@ApiUnauthorizedResponse({
  type: UnauthorizedExceptionDto,
  description: 'login with non-admin rights',
})
export class FlashsalesController {
  constructor(private readonly flashsalesService: FlashsalesService) {}

  //
  @ApiCreatedResponse({
    type: FlashSaleSwangger,
    description: 'Flash sale created',
  })
  @ApiBadRequestResponse({
    type: BadRequestDto,
    description:
      'startTime < Date.now or startTime > endTime, discount invalid, itemId not exist, stocks >= flashSaleQuantity  ',
  })
  @Post()
  create(@Body() createFlashsaleDto: CreateFlashsaleDto): Promise<IFlashSale> {
    return this.flashsalesService.create(createFlashsaleDto);
  }

  @ApiOkResponse({
    type: [FlashSaleSwangger],
    description: 'Return list flash sale',
  })
  //
  @Get()
  findAll(): Promise<IFlashSale[]> {
    return this.flashsalesService.findAll();
  }

  //
  @ApiOkResponse({
    type: FlashSaleSwangger,
    description: 'Find one flash sale',
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<IFlashSale> {
    return this.flashsalesService.findOne(id);
  }

  //
  @ApiOkResponse({
    type: FlashSaleSwangger,
    description: 'Return flash sale updated',
  })
  @ApiConflictResponse({
    type: ConFlictExceptionDto,
    description: 'Time update exists',
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFlashsaleDto: UpdateFlashsaleDto,
  ) {
    return this.flashsalesService.update(id, updateFlashsaleDto);
  }

  // [DELETE]
  @ApiOkResponse({ type: Boolean, description: 'return boolean' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.flashsalesService.remove(id);
  }
}
