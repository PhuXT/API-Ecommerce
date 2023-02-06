import mongoose from 'mongoose';
import { STATUS_FLASHSALE_ENUM } from './flashsale.constain';

export interface IFlashSale {
  name?: string;
  status?: STATUS_FLASHSALE_ENUM;
  items?: [IFlashSaleItemInfor];
  startTime?: Date;
  endTime?: Date;
}

export interface IFlashSaleItemInfor {
  itemId: mongoose.Schema.Types.ObjectId | string;
  flashSaleQuantity: number;
  discount: number;
}
