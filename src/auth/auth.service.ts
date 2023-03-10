import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailsService } from '../emails/emails.service';
import { STATUS_ENUM } from '../shared/constants';
import { IPayloadJWT, IUsers } from '../users/users.interface';
import * as config from 'config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailsService,
  ) {}

  //
  async validateUser(email: string, pass: string): Promise<unknown> {
    const user = await this.usersService.findOne({ email });
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new BadRequestException('Wrong password');

    if (user && isMatch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, createdAt, updatedAt, ...result } = user['_doc'];
      return result;
    }
    return null;
  }

  //
  async login(user: IUsers) {
    if (user.status === STATUS_ENUM.INACTIVE) {
      throw new UnauthorizedException('You need active account');
    }
    const payload = {
      userName: user.userName,
      userID: user['_id'],
      userRole: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  //
  async regisrer(request: IUsers) {
    const userCreated = await this.usersService.create(request);
    if (userCreated) {
      const payload: IPayloadJWT = {
        userName: userCreated.userName,
        id: userCreated._id,
      };

      const verifyToken = this.jwtService.sign(payload, {
        expiresIn: config.get('jwt.expiresRegister'),
      });

      const linkVerify = `${config.get('server.hostname')}${config.get(
        'service.baseUrl',
      )}${config.get('service.apiVersion')}/auth/verify?token=${verifyToken}`;
      try {
        await this.emailService.sendMessage(userCreated.email, linkVerify);
      } catch (error) {
        console.log(error);
      }
    }
    return { success: true };
  }

  //
  async verify(token: string) {
    try {
      await this.jwtService.verify(token);
      const user = this.jwtService.decode(token);
      await this.usersService.findOneAndUpdate(user['id'], {
        status: STATUS_ENUM.ACTIVE,
      });
      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
