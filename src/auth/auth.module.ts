import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EmailsModule } from '../emails/emails.module';
import { JwtStrategy } from './jwt.strategy';
import * as config from 'config';

@Module({
  providers: [AuthService, LocalStrategy, JwtStrategy],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    EmailsModule,
    PassportModule,
    JwtModule.register({
      secret: config.get('jwt.secretKey'),
      signOptions: { expiresIn: config.get('jwt.expiresLive') },
    }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
