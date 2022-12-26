// import { BadRequestException, ConflictException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { EntityRepository } from '../database/entity.repository';
// import { ICreateItem } from './entities/item.entity';
// import { Items, ItemDocument } from './items.schema';

// export class ItemsRepository extends EntityRepository<ItemDocument> {
//   constructor(@InjectModel(Items.name) itemModel: Model<ItemDocument>) {
//     super(itemModel);
//   }

//   async create(createItemDto: ICreateItem): Promise<ItemDocument> | null {
//     try {
//       const item = await super.create(createItemDto);
//       return item;
//     } catch (error) {
//       if (error.keyPattern) {
//         if (error.keyPattern.barCode) {
//           throw new ConflictException('Barcode is unique');
//         }

//         if (error.keyPattern.name) {
//           throw new ConflictException('Name is unique');
//         }
//       }
//     }
//     return null;
//   }

//   async findOne(id): Promise<ItemDocument> {
//     let item: ItemDocument;
//     try {
//       item = await super.findOne({ _id: id });
//       if (!item) {
//         throw new BadRequestException(`Item ${id['_id']} doesnt exist`);
//       }
//       return item;
//     } catch (error) {
//       if (error.stringValue) {
//         throw new BadRequestException('id should be formatted as ObjId');
//       }

//       if (error.response) {
//         if (error.response.statusCode === 400) {
//           throw new BadRequestException(error.response.message);
//         }
//       }
//     }
//   }
// }

import { InjectModel } from '@nestjs/mongoose';
import { BaseRepository } from '../base/base.repository';
import { PaginateModel } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { IItemModel, Items } from './items.schema';

@Injectable()
export class ItemsRepository extends BaseRepository<IItemModel> {
  constructor(
    @InjectModel(Items.name)
    model: PaginateModel<IItemModel>,
  ) {
    super(<PaginateModel<IItemModel>>model);
  }
}
