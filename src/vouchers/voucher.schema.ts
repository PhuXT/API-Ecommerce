import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type VoucherDocument = Voucher & Document;

@Schema({ timestamps: true })
export class Voucher {
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  discount: number;

  @Prop({ required: true })
  categories: string[];

  @Prop({ required: true })
  nameVoucher: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  description: string;
}

export const VoucherSchema = SchemaFactory.createForClass(Voucher);

// VoucherSchema.pre('findOneAndUpdate', () => {
//   console.log('hihi');
// });
