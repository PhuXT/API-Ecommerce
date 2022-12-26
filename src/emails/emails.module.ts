import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import * as config from 'config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRoot({
      transport: {
        host: config.get('mailer.host'),
        auth: {
          user: config.get('mailer.user'),
          pass: config.get('mailer.password'),
        },
        tls: {
          rejectUnauthorized: false,
        },
      },
    }),
    EmailsModule,
  ],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
