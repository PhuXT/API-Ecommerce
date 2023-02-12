import { BadRequestException, Injectable } from '@nestjs/common';
import { Standard, STATUS_ENUM } from '../shared/constants';
import { FlashsalesService } from '../flashsales/flashsales.service';
import { ItemsService } from '../items/items.service';
import { UsersService } from '../users/users.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { CreateItemOrder, UserOrder } from './entities/order.entity';
import { OrdersRepository } from './order.repository';
import { IOrderModel } from './order.schema';
import { ORDER_STATUS_ENUM } from './orders.constain';
import { USERS_ROLE_ENUM } from 'src/users/users.constant';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepositoty: OrdersRepository,
    private readonly userService: UsersService,
    private readonly flashSaleService: FlashsalesService,
    private readonly voucherService: VouchersService,
    private readonly itemService: ItemsService,
  ) {}

  // [CREATE]
  async create(userInfor, createOrderDto): Promise<IOrderModel> {
    const user: UserOrder = createOrderDto.user;
    user.userId = userInfor.userID;
    user.userName = userInfor.userName;

    const listItem = createOrderDto.items.map(async (itemOrderDto) => {
      let itemDtail = await this.itemService.findOne(itemOrderDto.itemId);
      if (itemDtail.stocks < itemOrderDto.amount) {
        throw new BadRequestException(
          `${itemDtail.name} not in sufficient quantity`,
        );
      }

      let createItemOrder: CreateItemOrder = itemDtail;
      let flashSaleQuantityUpdate = null;

      // check flashSale quantity

      if (itemDtail?.flashSaleQuantity) {
        flashSaleQuantityUpdate =
          itemDtail.flashSaleQuantity - itemOrderDto.amount;

        if (itemDtail.flashSaleQuantity < itemOrderDto.amount) {
          itemDtail = await this.itemService.findOneOrigin(itemOrderDto.itemId);
          createItemOrder = { ...itemDtail['_doc'] };
          flashSaleQuantityUpdate = null;
        }
      }

      createItemOrder.flashSaleQuantityUpdate = flashSaleQuantityUpdate;
      createItemOrder.stocksUpdate = itemDtail.stocks - itemOrderDto.amount;
      createItemOrder.amountOrder = itemOrderDto.amount;
      createItemOrder.totalPrice = itemDtail.price * itemOrderDto.amount;
      createItemOrder.originPrice = itemDtail.price * itemOrderDto.amount;
      //update createItemOrder.totalPrice if exist flashSale
      if (itemDtail.flashSalePrice) {
        createItemOrder.flashSaleId = itemDtail.flashSaleId;
        createItemOrder.totalPrice =
          itemDtail.flashSalePrice * itemOrderDto.amount;
      }

      if (createOrderDto.voucherCode) {
        const voucher = await this.voucherService.findVoucherNow(
          createOrderDto.voucherCode,
        );

        if (!voucher) {
          throw new BadRequestException('Voucher does not exist');
        }
        if (!voucher.categories.includes(itemDtail.category.name)) {
          throw new BadRequestException(
            `Voucher is not applicable for ${itemOrderDto.itemId} `,
          );
        }
        if (voucher.quantity <= 0) {
          throw new BadRequestException(
            'Voucher are no longer available. Please use another voucher',
          );
        }

        createItemOrder.voucherDiscount = voucher.discount;
        createItemOrder.codeVoucher = voucher.code;
        createItemOrder.voucherQuantity = voucher.quantity;
        createItemOrder.voucherId = voucher._id;
        createItemOrder.totalPrice =
          createItemOrder.totalPrice -
          (createItemOrder.totalPrice * voucher.discount) / 100;
      }
      return createItemOrder;
    });

    const items = await Promise.all(listItem).then((value) => value);

    //  calculate totalPrice, originPrice order
    const listUpdate = items.reduce(
      (initialValue, item) => {
        const originPrice = initialValue[0] + item.originPrice;
        const totalPrice = initialValue[1] + item.totalPrice;
        return [originPrice, totalPrice];
      },
      [0, 0],
    );
    const [originPrice, totalPrice] = listUpdate;

    const orderCreated = await this.ordersRepositoty.create({
      user,
      items,
      originPrice,
      totalPrice,
    });

    // Update stocks
    if (orderCreated) {
      let voucherId;

      items.forEach(async (item) => {
        await this.itemService.updateStocksAndSold(
          // item._id.toString(),
          item._id,
          -item.amountOrder,
          item.amountOrder,
        );

        if (item.flashSaleQuantityUpdate !== null) {
          await this.flashSaleService.updateQuantity(
            // item.flashSaleId.toString(),
            item.flashSaleId,
            // item._id.toString(),
            item._id,
            -item.amountOrder,
          );
        }

        if (item.voucherId) {
          voucherId = item.voucherId;
          await this.voucherService.updateQuantity(voucherId, -1);
        }
      });
    }
    return orderCreated;
  }

  async getList(request, query) {
    const {
      page,
      perPage,
      sortBy,
      sortType,
      orderID,
      userID,
      status,
      createdAt,
      userName,
      itemName,
    } = query;

    const options: { [k: string]: any } = {
      sort: { [sortBy]: sortType },
      limit: perPage || Standard.PER_PAGE,
      page: page || Standard.PAGE,
    };

    const andFilter: { [k: string]: any } = [];
    if (orderID) {
      andFilter.push({ orderID });
    }
    if (status) {
      andFilter.push({ status });
    }

    if (createdAt) {
      andFilter.push({ createdAt: { $gte: createdAt } });
    }
    if (userName) {
      andFilter.push({ 'user.userName': { $eq: userName } });
    }
    if (itemName) {
      andFilter.push({ 'items.name': { $eq: itemName } });
    }
    if (userID) {
      andFilter.push({ 'user.userId': { $eq: userID } });
    }

    if (request.user.userRole === USERS_ROLE_ENUM.USER) {
      andFilter.push({ 'user.userId': { $eq: request.user.userID } });
    }
    const filters = andFilter.length > 0 ? { $and: andFilter } : {};
    const data = await this.ordersRepositoty.paginate(filters, options);
    return data;
  }

  async update(id: string, request): Promise<string> {
    const orders = await this.ordersRepositoty.findOne({ _id: id });
    if (!orders) {
      throw new BadRequestException('Order does not exist');
    }

    if (orders.user.userId.toString() !== request.user.userID) {
      throw new BadRequestException('you can only view your order');
    }
    if (
      orders.status === ORDER_STATUS_ENUM.CANCEL ||
      orders.status === ORDER_STATUS_ENUM.DELIVERED
    ) {
      throw new BadRequestException('You dont cancel this orders');
    }

    const arrUpdate = [];
    const updateStatusOrder = this.ordersRepositoty.findOneAndUpdate(
      { _id: id },
      { status: ORDER_STATUS_ENUM.CANCEL },
    );
    arrUpdate.push(updateStatusOrder);
    orders.items.forEach((itemOrder: CreateItemOrder) => {
      const updateStockItem = this.itemService.updateStocks(
        itemOrder._id.toString(),
        itemOrder.amountOrder,
      );
      arrUpdate.push(updateStockItem);

      if (itemOrder.flashSaleId) {
        const updateFlashSaleQuantity = this.flashSaleService.updateQuantity(
          itemOrder.flashSaleId.toString(),
          itemOrder._id.toString(),
          itemOrder.amountOrder,
        );
        arrUpdate.push(updateFlashSaleQuantity);
      }

      if (itemOrder.voucherId) {
        const updateVoucherQuantity = this.voucherService.updateQuantity(
          itemOrder.voucherId.toString(),
          1,
        );
        arrUpdate.push(updateVoucherQuantity);
      }
    });

    Promise.all(arrUpdate).then(() => {
      console.log('Update thanh cong');
    });

    return `Order cancel`;
  }

  async delete(id: string) {
    try {
      await this.ordersRepositoty.deleteMany({ _id: id });
      return { sucess: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
