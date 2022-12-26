import { ConflictException, Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { IFlashSale } from './entities/flashsale.entity';
import { STATUS_FLASHSALE_ENUM } from './flashsale.constain';
import { FlashSaleDocument } from './flashsale.schema';
import { FlashSaleRepository } from './flashsales.repository';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class FlashsalesService {
  constructor(
    private flashsaleRepository: FlashSaleRepository,
    private schedulerRegistry: SchedulerRegistry,
    private userService: UsersService,
    private emailService: EmailsService,
  ) {}

  async create(createFlashsaleDto: IFlashSale): Promise<IFlashSale> {
    const flashSale = await this.flashsaleRepository.create(createFlashsaleDto);
    // send mail cronjob-------------------------
    // const startTime = createFlashsaleDto.startTime;
    // const conJobTime = new Date(startTime).getTime() - 3 * 60 * 1000;
    // console.log(conJobTime);

    // const job = new CronJob(new Date(conJobTime), async () => {
    //   const listUser = await this.userService.find();
    //   const listPromiseSendMail = [];

    //   listUser.forEach((user) => {
    //     listPromiseSendMail.push(
    //       this.emailService.sendMessage(
    //         user.email,
    //         `${createFlashsaleDto.name} sale will start at ${createFlashsaleDto.startTime}`,
    //       ),
    //     );
    //   });

    //   Promise.all(listPromiseSendMail).then(() => {
    //     'Send email flash sale done';
    //   });
    // });

    // this.schedulerRegistry.addCronJob('send flashSale noti', job);
    // job.start();

    return flashSale;
  }

  async findAll(): Promise<IFlashSale[]> {
    return this.flashsaleRepository.find({});
  }

  find(filterQuery: FilterQuery<FlashSaleDocument>): Promise<IFlashSale[]> {
    return this.flashsaleRepository.find(filterQuery);
  }

  findFlashSaleNow(): Promise<IFlashSale> {
    const dateNow = new Date().toISOString();
    return this.flashsaleRepository.findOne({
      startTime: { $lt: dateNow },
      endTime: { $gt: dateNow },
      status: STATUS_FLASHSALE_ENUM.ACTIVE,
    });
  }

  findOne(id: string): Promise<IFlashSale> {
    return this.flashsaleRepository.findOne({ _id: id });
  }

  async update(id: string, updateFlashsaleDto: IFlashSale) {
    if (updateFlashsaleDto.startTime && updateFlashsaleDto.endTime) {
      const startTimeUpdate = new Date(
        updateFlashsaleDto.startTime,
      ).toISOString();
      const endTimeUpdate = new Date(updateFlashsaleDto.endTime).toISOString();
      const flashSaleConflic = await this.flashsaleRepository.findOne({
        startTime: { $gt: startTimeUpdate },
        endTime: { $lt: endTimeUpdate },
        status: STATUS_FLASHSALE_ENUM.ACTIVE,
      });
      if (flashSaleConflic)
        throw new ConflictException(
          'There existed flash sales during this time',
        );
    }
    return this.flashsaleRepository.findOneAndUpdate(
      { _id: id },
      updateFlashsaleDto,
    );
  }

  updateQuantity(idFlashSale: string, itemId: string, quantityUpdate: number) {
    return this.flashsaleRepository.update(
      {
        _id: idFlashSale,
        'items.itemId': itemId,
      },
      {
        $inc: {
          'items.$.flashSaleQuantity': quantityUpdate,
        },
      },
    );
  }

  remove(id: string): Promise<boolean> {
    return this.flashsaleRepository.deleteMany({ _id: id });
  }
}
