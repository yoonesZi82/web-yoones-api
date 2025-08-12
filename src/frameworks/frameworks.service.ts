import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/utils/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FrameworksService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.FrameworkCreateInput) {
    try {
      await this.prisma.framework.create({ data });
      return {
        statusCode: 201,
        message: 'framework created successfully',
      };
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
        error: error.message,
      });
    }
  }
}
