import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { PrismaService } from '@/utils/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto) {
    try {
      const newMessage = await this.prisma.message.create({
        data: { ...createMessageDto },
      });

      return newMessage;
    } catch (error) {
      if (
        error instanceof HttpException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException({
        statusCode: 500,
        message: 'something went wrong',
      });
    }
  }
}
