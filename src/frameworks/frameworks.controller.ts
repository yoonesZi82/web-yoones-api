import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpException,
  BadRequestException,
  Res,
  Put,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { FrameworksService } from './frameworks.service';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import checkSizePhoto from 'src/utils/check-size-photo';
import { Response } from 'express';
import { UpdateFrameworkDto } from './dto/update-framework.dto';
import { FRAMEWORK_UPLOADS_FOLDER } from 'src/common/constants';

@Controller('frameworks')
export class FrameworksController {
  constructor(private readonly frameworksService: FrameworksService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('frameworkUrl', {
      storage: diskStorage({
        destination: FRAMEWORK_UPLOADS_FOLDER,
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: CreateFrameworkDto,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('frameworkUrl (file) is required');
    }

    const isSizeValid = checkSizePhoto(file);

    if (!isSizeValid) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'File size is too large (max 5MB)',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const frameworkData = {
      ...data,
      frameworkUrl: file.filename,
    };

    const framework = await this.frameworksService.create(frameworkData);

    return res.status(201).json({
      statusCode: 201,
      message: 'framework created successfully',
      data: framework,
    });
  }

  @Get()
  async findAll(@Res() res: Response) {
    const frameworks = await this.frameworksService.findAll();
    res.status(200).json({
      statusCode: 200,
      message: 'frameworks fetched successfully',
      data: frameworks,
    });
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('frameworkUrl', {
      storage: diskStorage({
        destination: FRAMEWORK_UPLOADS_FOLDER,
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async update(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: UpdateFrameworkDto,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    await this.frameworksService.update({
      ...data,
      id,
      frameworkUrl: file?.filename,
    });
    res.status(200).json({
      statusCode: 200,
      message: 'framework updated successfully',
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res: Response) {
    await this.frameworksService.delete(id);
    res.status(200).json({
      statusCode: 200,
      message: 'framework deleted successfully',
    });
  }
}
