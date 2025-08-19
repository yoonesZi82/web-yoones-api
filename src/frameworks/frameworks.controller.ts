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
  UseGuards,
} from '@nestjs/common';
import { FrameworksService } from './frameworks.service';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import checkSizePhoto from 'src/utils/check-size-photo';
import { Response } from 'express';
import { UpdateFrameworkDto } from './dto/update-framework.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Public } from '@/auth/decorator/public.decorator';

@ApiTags('Manage Frameworks')
@Controller('frameworks')
export class FrameworksController {
  constructor(private readonly frameworksService: FrameworksService) {}

  // ================= Create Framework =================
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create framework' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        frameworkUrl: { type: 'string', format: 'binary' },
        name: { type: 'string', example: 'Framework Name' },
      },
      required: ['name', 'frameworkUrl'],
    },
  })
  @Post()
  @UseInterceptors(
    FileInterceptor('frameworkUrl', { storage: multer.memoryStorage() }),
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
      frameworkUrl: file,
    };

    const framework = await this.frameworksService.create(frameworkData);

    return res.status(201).json({
      statusCode: 201,
      message: 'framework created successfully',
      data: framework,
    });
  }

  // ================= Get All Frameworks =================
  @Public()
  @ApiOperation({ summary: 'Get all frameworks' })
  @Get()
  async findAll(@Res() res: Response) {
    const frameworks = await this.frameworksService.findAll();
    res.status(200).json({
      statusCode: 200,
      message: 'frameworks fetched successfully',
      data: frameworks,
    });
  }

  // ================= Update Framework =================
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update framework' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        frameworkUrl: { type: 'string', format: 'binary' },
        name: { type: 'string', example: 'Framework Name' },
      },
      required: ['name'],
    },
  })
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('frameworkUrl', {
      storage: multer.memoryStorage(),
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
      frameworkUrl: file,
    });
    res.status(200).json({
      statusCode: 200,
      message: 'framework updated successfully',
    });
  }

  // ================= Delete Framework =================
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete framework' })
  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res: Response) {
    await this.frameworksService.delete(id);
    res.status(200).json({
      statusCode: 200,
      message: 'framework deleted successfully',
    });
  }
}
