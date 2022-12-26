import mongoose from 'mongoose';
import { STATUS_FLASHSALE_ENUM } from '../flashsale.constain';

export interface IFlashSale {
  _id?: string;
  name?: string;
  status?: STATUS_FLASHSALE_ENUM;
  items?: [IFlashSaleItemInfor];
  startTime?: Date;
  endTime?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFlashSaleItemInfor {
  itemId: mongoose.Schema.Types.ObjectId | string;
  flashSaleQuantity: number;
  discount: number;
}
