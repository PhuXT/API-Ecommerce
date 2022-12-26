import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from '../database/entity.repository';
import { FlashSale, FlashSaleDocument } from './flashsale.schema';

export class FlashSaleRepository extends EntityRepository<FlashSaleDocument> {
  constructor(
    @InjectModel(FlashSale.name) flashSaleModel: Model<FlashSaleDocument>,
  ) {
    super(flashSaleModel);
  }
}
