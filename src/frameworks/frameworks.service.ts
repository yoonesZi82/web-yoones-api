import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/utils/prisma.service';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { UpdateFrameworkDto } from './dto/update-framework.dto';
import { join, resolve } from 'path';
import { FRAMEWORK_UPLOADS_FOLDER } from 'src/common/constants';
import { promises as fs } from 'fs';

@Injectable()
export class FrameworksService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFrameworkDto & { frameworkUrl: string }) {
    const { frameworkUrl, ...frameworkData } = data;

    try {
      const isFrameworkExist = await this.prisma.framework.findFirst({
        where: { name: frameworkData.name },
      });

      if (isFrameworkExist) {
        throw new HttpException(
          {
            statusCode: 400,
            message: 'framework already exists',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const framework = await this.prisma.framework.create({
        data: {
          ...frameworkData,
          frameworkUrl,
        },
      });
      return framework;
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

  async findAll() {
    try {
      const frameworks = await this.prisma.framework.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      return frameworks;
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

  async update(
    data: UpdateFrameworkDto & { id: string; frameworkUrl?: string },
  ) {
    const { id, frameworkUrl, ...frameworkData } = data;

    try {
      const framework = await this.prisma.framework.findUnique({
        where: { id },
      });

      if (!framework) {
        throw new HttpException(
          {
            statusCode: 404,
            message: 'framework not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (frameworkUrl && framework.frameworkUrl) {
        const oldImagePath = resolve(
          FRAMEWORK_UPLOADS_FOLDER,
          framework.frameworkUrl,
        );
        try {
          await fs.access(oldImagePath);
          await fs.unlink(oldImagePath);
        } catch (err) {
          throw new HttpException(
            {
              statusCode: 404,
              message: 'file not found',
              error: err.message,
            },
            HttpStatus.NOT_FOUND,
          );
        }
      }

      return await this.prisma.framework.update({
        where: { id },
        data: {
          ...frameworkData,
          frameworkUrl: frameworkUrl || framework.frameworkUrl,
        },
      });
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

  async delete(id: string) {
    try {
      const framework = await this.prisma.framework.findUnique({
        where: { id },
      });

      if (!framework) {
        throw new HttpException(
          {
            statusCode: 404,
            message: 'framework not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const filePath = join(FRAMEWORK_UPLOADS_FOLDER, framework.frameworkUrl);

      try {
        await fs.unlink(filePath);
      } catch {
        throw new HttpException(
          {
            statusCode: 404,
            message: 'file not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return await this.prisma.framework.delete({
        where: { id },
      });
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
