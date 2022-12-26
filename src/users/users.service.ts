import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcrypt';
import { Standard, STATUS_ENUM } from '../shared/constants';
import { IUsers } from './users.interface';
import { USERS_ROLE_ENUM } from './users.constant';
import { responeErrorMongoDB } from '../errors/custom_mongo_errors';

@Injectable()
export class UsersService {
  constructor(private userRepository: UsersRepository) {}

  async hashPassword(passwordPlainText, saltOrRounds): Promise<string> {
    return bcrypt.hash(passwordPlainText, saltOrRounds);
  }

  async create(request: IUsers) {
    request.password = await this.hashPassword(request.password, 10);
    try {
      const userCreated = await this.userRepository.create(request);
      return userCreated;
    } catch (error) {
      responeErrorMongoDB(error);
    }
  }

  //
  async findOne(filterQuery) {
    const user = await this.userRepository.findOne(filterQuery);
    if (!user) {
      throw new NotFoundException('User not exist');
    }
    return user;
  }

  async findOneAndUpdate(id, request): Promise<IUsers> {
    return this.userRepository.findOneAndUpdate(id, request);
  }

  //
  async getList(query) {
    const { page, perPage, sortBy, sortType, status, role } = query;

    const options: { [k: string]: any } = {
      sort: { [sortBy]: sortType },
      limit: perPage || Standard.PER_PAGE,
      page: page || Standard.PAGE,
      select: '-password',
    };

    const andFilter: { [k: string]: any } = [];
    if (status) {
      andFilter.push({ status });
    }
    if (role) {
      andFilter.push({ role });
    }
    const filters = andFilter.length > 0 ? { $and: andFilter } : {};

    const data = await this.userRepository.paginate(filters, options);

    return data;
  }

  //
  async delete(id: string) {
    const user = await this.userRepository.findOne({ _id: id });
    if (!user) {
      throw new BadRequestException('User not exist');
    }
    if (user.status === STATUS_ENUM.ACTIVE) {
      throw new BadRequestException('Active user, cannot be deleted');
    }
    return { success: await this.userRepository.deleteMany({ _id: id }) };
  }

  //
  async update(request, updateUserDto: IUsers) {
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(
        updateUserDto.password,
        10,
      );
    }
    let updateUserData = updateUserDto;
    const userID = request.user.id;
    const roleUser = request.user.role;

    if (roleUser !== USERS_ROLE_ENUM.ADMIN) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { role, status, ...updateData } = updateUserDto;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      updateUserData = updateData;
    }

    try {
      await this.userRepository.update({ _id: userID }, updateUserDto);
    } catch (error) {
      responeErrorMongoDB(error);
    }
    return { success: true };
  }
}
