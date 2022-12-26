import { MailerService } from '@nestjs-modules/mailer';
import { Controller } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private mailService: MailerService,
  ) {}
}
