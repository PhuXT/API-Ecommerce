import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { IFlashSale } from './flashsale.interface';
import { STATUS_FLASHSALE_ENUM } from './flashsale.constain';
import { FlashSaleDocument, IFlashSaleModel } from './flashsale.schema';
import { FlashSaleRepository } from './flashsales.repository';
import { SchedulerRegistry } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';
import { EmailsService } from '../emails/emails.service';
import { Standard } from '../shared/constants';
import { ItemsService } from 'src/items/items.service';

@Injectable()
export class FlashsalesService {
  constructor(
    private flashsaleRepository: FlashSaleRepository,
    private schedulerRegistry: SchedulerRegistry,
    private userService: UsersService,
    private emailService: EmailsService,
    @Inject(forwardRef(() => ItemsService)) private itemsService: ItemsService,
  ) {}

  async create(createFlashsaleDto: IFlashSale): Promise<IFlashSaleModel> {
    try {
      for (const item of createFlashsaleDto.items) {
        const itemInfos = await this.itemsService.findOneOrigin(item.itemId);
        if (!itemInfos) {
          throw new BadRequestException('Item doesnt exist');
        }
        if (itemInfos.stocks < item.flashSaleQuantity) {
          throw new BadRequestException(
            `quantity of ${item.itemId} in stock must be less than product flash sale`,
          );
        }
      }
      const dateNow = new Date();
      const listFlashSaleConflix = await this.flashsaleRepository.find({
        $and: [{ startTime: { $gt: dateNow } }],
      });
      for (const flashSale of listFlashSaleConflix) {
        if (
          (flashSale.startTime.getTime() <=
            new Date(createFlashsaleDto.startTime).getTime() &&
            new Date(createFlashsaleDto.startTime).getTime() <=
              flashSale.endTime.getTime()) ||
          (flashSale.startTime.getTime() <=
            new Date(createFlashsaleDto.endTime).getTime() &&
            new Date(createFlashsaleDto.endTime).getTime() <=
              flashSale.endTime.getTime())
        ) {
          throw new BadRequestException(
            'There existed flash sales during this time',
          );
        }
      }

      return this.flashsaleRepository.create(createFlashsaleDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

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
  }

  async getList(query) {
    const {
      page,
      perPage,
      sortBy,
      sortType,
      name,
      itemID,
      startTime,
      endTime,
    } = query;
    const options: { [k: string]: any } = {
      sort: { [sortBy]: sortType },
      limit: perPage || Standard.PER_PAGE,
      page: page || Standard.PAGE,
      select: '-password',
    };

    const andFilter: { [k: string]: any } = [];
    if (name) {
      andFilter.push({ name });
    }
    if (startTime) {
      andFilter.push({ startTime: { $gt: startTime } });
    }
    if (endTime) {
      andFilter.push({ endTime: { $gt: endTime } });
    }
    const filters = andFilter.length > 0 ? { $and: andFilter } : {};

    const values = await this.flashsaleRepository.paginate(filters, options);
    if (itemID) {
      const data: { [k: string]: any } = {};
      const listFlashSaleFinByItemID = values.docs.map((flashSale) => {
        const data = [];
        if (flashSale.items.includes(itemID)) {
          data.push(flashSale);
        }
        return data;
      });
      data.docs = listFlashSaleFinByItemID;
      data.totalDocs = values.totalDocs;
      data.limit = values.limit;
      data.totalPages = values.totalPages;
      data.page = values.page;
      data.pagingCounter = values.pagingCounter;
      return data;
    }
    return values;
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
