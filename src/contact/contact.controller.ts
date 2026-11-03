import { Body, Controller, Get, Headers, Ip, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact')
  create(
    @Body() dto: CreateContactMessageDto,
    @Ip() ip: string,
    @Headers('x-real-ip') realIp?: string,
  ) {
    // Behind nginx the socket address is always the proxy; nginx sets X-Real-IP to the true client.
    const clientIp = realIp || ip;
    return this.contactService.create(dto, clientIp);
  }

  @Get('admin/contact-messages')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.contactService.findAll();
  }
}
