import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategorysService } from '../categories/categories.service';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { IVoucher } from './entities/voucher.entity';
import { VoucherRepository } from './vouchers.repository';

@Injectable()
export class VouchersService {
  constructor(
    private voucherRepository: VoucherRepository,
    private categoryService: CategorysService,
  ) {}

  async create(createVoucherDto: IVoucher): Promise<IVoucher> {
    for (let i = 0; i < createVoucherDto.categories.length; i++) {
      const category = await this.categoryService.getCategory(
        createVoucherDto.categories[i],
      );

      if (!category) {
        throw new BadRequestException(
          `${createVoucherDto.categories[i]} is not exist`,
        );
      }
    }

    try {
      const voucherCreated = await this.voucherRepository.create(
        createVoucherDto,
      );
      return voucherCreated;
    } catch (error) {
      throw new ConflictException('Code voucher already exist');
    }
  }

  findAll(): Promise<IVoucher[]> {
    return this.voucherRepository.find({});
  }

  async findOne(id: string): Promise<IVoucher> {
    try {
      const voucher = await this.voucherRepository.findOne({ _id: id });
      if (!voucher) throw new NotFoundException('Voucher does not exist');
      return voucher;
    } catch (error) {
      if (error.kind) throw new BadRequestException('Id invalid');

      if (error.response) {
        if (error.response.statusCode == 404)
          throw new NotFoundException('Voucher does not exist');
      }
    }
  }

  // Find Voucher Now
  findVoucherNow(voucherCode): Promise<IVoucher> {
    const dateNow = new Date().toISOString();
    return this.voucherRepository.findOne({
      startTime: { $lt: dateNow },
      endTime: { $gt: dateNow },
      code: voucherCode,
    });
  }
  async update(id: string, updateVoucherDto: UpdateVoucherDto) {
    console.log(updateVoucherDto);
    try {
      const a = await this.voucherRepository.findOneAndUpdate(
        {
          _id: id,
        },
        updateVoucherDto,
      );
      console.log(a);
      console.log();
    } catch (error) {
      console.log(error);
    }
    return this.voucherRepository.findOneAndUpdate(
      {
        _id: id,
      },
      updateVoucherDto,
    );
  }

  updateQuantity(id: string, quantityUpdate: number) {
    return this.voucherRepository.update(
      { _id: id },
      { $inc: { quantity: quantityUpdate } },
    );
  }

  remove(id: string): Promise<boolean> {
    return this.voucherRepository.deleteMany({ _id: id });
  }
}
