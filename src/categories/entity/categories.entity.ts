import mongoose from 'mongoose';
import { STATUS_ENUM } from '../categories.constant';

export interface ICategory {
  // _id?: mongoose.Schema.Types.ObjectId;

  categoryName?: string;

  image?: string;

  status?: STATUS_ENUM;

  priority?: number;

  // createdAt?: Date;

  // updatedAt?: Date;
}

export interface ICategoryUpdate {
  status?: STATUS_ENUM;

  priority?: number;

  categoryName?: string;

  image?: string;

  //
  //   createdAt: Date;

  //
  //   updatedAt: Date;
}
