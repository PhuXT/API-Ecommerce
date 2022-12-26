import { MailerService } from '@nestjs-modules/mailer';
import { Controller } from '@nestjs/common';

@Controller('emails')
export class EmailsController {
  constructor(private mailerService: MailerService) {}
}
