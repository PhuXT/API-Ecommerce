import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Standard } from '../shared/constants';
import { FlashsalesService } from '../flashsales/flashsales.service';
import { IItems, IUpdateItem } from './entities/item.entity';
import { ItemsRepository } from './items.repository';
import { IItemModel } from './items.schema';

@Injectable()
export class ItemsService {
  constructor(
    private itemRepository: ItemsRepository,
    private flashsalesService: FlashsalesService,
  ) {}

  // CREATE
  async create(createItemDto: IItems): Promise<IItemModel> {
    createItemDto['stocks'] = createItemDto.quantity;
    console.log(createItemDto);

    return this.itemRepository.create(createItemDto);
  }

  async getList(query) {
    const { page, perPage, sortBy, itemName, price, category, sortType } =
      query;

    const options: { [k: string]: any } = {
      sort: { [sortBy]: sortType },
      limit: perPage || Standard.PER_PAGE,
      page: page || Standard.PAGE,
    };

    const andFilter: { [k: string]: any } = [];
    if (itemName) {
      andFilter.push({ itemName });
    }
    if (price) {
      andFilter.push({ price });
    }
    if (category) {
      andFilter.push({ category });
    }
    const filters = andFilter.length > 0 ? { $and: andFilter } : {};

    return Promise.all([
      this.itemRepository.paginate(filters, options),
      this.flashsalesService.findFlashSaleNow(),
    ]).then((value) => {
      const [listItems, flashSaleNow] = value;
      const listItemsUpdateFlashSale = listItems.docs.map((item) =>
        this.getItemFlashSale(item, flashSaleNow),
      );
      const data: { [k: string]: any } = {};

      data.docs = listItemsUpdateFlashSale;
      data.totalDocs = listItems.totalDocs;
      data.limit = listItems.limit;
      data.totalPages = listItems.totalPages;
      data.page = listItems.page;
      data.pagingCounter = listItems.pagingCounter;

      return data;
    });
  }

  async findOne(id: string) {
    const item = Promise.all([
      this.itemRepository.findOne({ _id: id }),
      this.flashsalesService.findFlashSaleNow(),
    ]).then((value) => {
      const [item, flashSaleNow] = value;
      return this.getItemFlashSale(item, flashSaleNow);
    });
    return item;
  }

  async findOneOrigin(id: string): Promise<IItemModel> {
    return this.itemRepository.findOne({ _id: id });
  }

  // UPDATE
  async update(id: string, updateItemDto: IUpdateItem) {
    try {
      const itemUpdated = await this.itemRepository.findOneAndUpdate(
        { _id: id },
        updateItemDto,
      );
      return itemUpdated;
    } catch (error) {
      if (error.keyPattern) {
        if (error.keyValue.name)
          throw new ConflictException('Name item already exits');

        if (error.keyValue.barCode)
          throw new ConflictException('Name item already exits');
      }
    }
  }

  async remove(id: string): Promise<boolean> {
    const item = await this.itemRepository.findOne({ _id: id });
    if (item.sold > 0) throw new BadRequestException('Item cannot be delete');
    return this.itemRepository.deleteMany({ _id: id });
  }

  getItemFlashSale(item: IItemModel, flashSaleNow): IItems {
    if (flashSaleNow && item) {
      const itemWithFlashSale = { ...item['_doc'] };
      flashSaleNow.items.forEach((itemFlashSale) => {
        if (itemFlashSale.itemId.toString() === item['_id'].toString()) {
          itemWithFlashSale['flashSalePrice'] =
            item.price - (item.price * itemFlashSale.discount) / 100;

          itemWithFlashSale['flashSaleName'] = flashSaleNow.name;
          itemWithFlashSale['flashSaleId'] = flashSaleNow._id;
          itemWithFlashSale['flashSaleDiscount'] = itemFlashSale.discount;
          itemWithFlashSale['flashSaleQuantity'] =
            itemFlashSale.flashSaleQuantity;
        }
      });
      return itemWithFlashSale;
    }
    return item;
  }

  updateStocks(itemId: string, stocksUpdate: number) {
    return this.itemRepository.update(
      {
        _id: itemId,
      },
      {
        $inc: {
          stocks: stocksUpdate,
        },
      },
    );
  }

  updateStocksAndSold(
    itemId: string,
    stocksUpdate: number,
    soldUpdate: number,
  ) {
    return this.itemRepository.update(
      {
        _id: itemId,
      },
      {
        $inc: {
          stocks: stocksUpdate,
          sold: soldUpdate,
        },
      },
    );
  }

  updateMany(filterQuery, updateItemDto) {
    return this.itemRepository.updateMany(filterQuery, updateItemDto);
  }

  find(filterQuery) {
    return this.itemRepository.find(filterQuery);
  }
}
