import { BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from '../database/entity.repository';
import { Voucher, VoucherDocument } from './voucher.schema';

export class VoucherRepository extends EntityRepository<VoucherDocument> {
  constructor(@InjectModel(Voucher.name) voucherModel: Model<VoucherDocument>) {
    super(voucherModel);
  }

  //   async create(createUserDto: CreateUserDto): Promise<VoucherDocument> | null {
  //     try {
  //       const user = await super.create(createUserDto);
  //       return user;
  //     } catch (error) {
  //       throw new BadRequestException('Email already exist');
  //     }
  //     return null;
  //   }
}
