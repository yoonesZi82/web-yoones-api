import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/utils/prisma.service';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { UpdateFrameworkDto } from './dto/update-framework.dto';
import { ObjectId } from 'mongodb';

import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
@Injectable()
export class FrameworksService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async create(
    data: CreateFrameworkDto & { frameworkUrl: Express.Multer.File },
  ) {
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

      if (frameworkUrl) {
        const fileExt = frameworkUrl.originalname.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `frameworks/${fileName}`;

        // Upload
        const { error } = await this.supabase.storage
          .from(
            this.configService.get<string>('SUPABASE_BUCKET_FRAMEWORKS') ||
              'frameworks',
          )
          .upload(filePath, frameworkUrl.buffer, { upsert: true });

        if (error) {
          throw new HttpException(
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        // Get Public URL
        const { data: publicUrlData } = this.supabase.storage
          .from(
            this.configService.get<string>('SUPABASE_BUCKET_FRAMEWORKS') ||
              'frameworks',
          )
          .getPublicUrl(filePath);

        const framework = await this.prisma.framework.create({
          data: {
            name: frameworkData.name,
            frameworkUrl: publicUrlData.publicUrl,
          },
        });

        return framework;
      } else {
        throw new HttpException(
          {
            statusCode: 400,
            message: 'framework url is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
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
    data: UpdateFrameworkDto & {
      id: string;
      frameworkUrl?: Express.Multer.File;
    },
  ) {
    const { id, frameworkUrl, ...frameworkData } = data;

    try {
      const isValidObjectId = ObjectId.isValid(id);
      if (!isValidObjectId) {
        throw new HttpException(
          { statusCode: 400, message: 'invalid framework id' },
          HttpStatus.BAD_REQUEST,
        );
      }

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

      if (frameworkUrl) {
        const fileExt = frameworkUrl.originalname.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `frameworks/${fileName}`;

        // Delete old file
        if (framework.frameworkUrl) {
          const prevFilePath = framework.frameworkUrl.split('/').pop();
          if (prevFilePath) {
            await this.supabase.storage
              .from(
                this.configService.get<string>('SUPABASE_BUCKET') ||
                  'frameworks',
              )
              .remove([`frameworks/${prevFilePath}`]);
          }
        }

        // Upload new file
        const { error: uploadError } = await this.supabase.storage
          .from(
            this.configService.get<string>('SUPABASE_BUCKET') || 'frameworks',
          )
          .upload(filePath, frameworkUrl.buffer, { upsert: true });

        if (uploadError) {
          throw new HttpException(
            uploadError.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        // Get public URL
        const { data: publicUrlData } = this.supabase.storage
          .from(
            this.configService.get<string>('SUPABASE_BUCKET') || 'frameworks',
          )
          .getPublicUrl(filePath);

        return await this.prisma.framework.update({
          where: { id },
          data: {
            ...frameworkData,
            frameworkUrl: publicUrlData.publicUrl,
          },
        });
      }

      return await this.prisma.framework.update({
        where: { id },
        data: {
          name: frameworkData.name,
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
      const isValidObjectId = ObjectId.isValid(id);
      if (!isValidObjectId) {
        throw new HttpException(
          { statusCode: 400, message: 'invalid framework id' },
          HttpStatus.BAD_REQUEST,
        );
      }
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

      const prevFilePath = framework.frameworkUrl.split('/').pop();
      if (prevFilePath) {
        await this.supabase.storage
          .from(
            this.configService.get<string>('SUPABASE_BUCKET') || 'frameworks',
          )
          .remove([`frameworks/${prevFilePath}`]);
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
