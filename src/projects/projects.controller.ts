import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  ParseIntPipe,
  Param,
  Put,
  Delete,
  BadRequestException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Response } from 'express';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseJsonArrayPipe } from './pipe/parse-array.pipe';
import { diskStorage } from 'multer';
import { extname } from 'path';
import checkSizePhoto from 'src/utils/check-size-photo';
import { PROJECT_UPLOADS_FOLDER } from '../common/constants';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('projectUrl', {
      storage: diskStorage({
        destination: PROJECT_UPLOADS_FOLDER,
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
    @Body('frameworks', ParseJsonArrayPipe) frameworks: string[],
    @Body() data: Omit<CreateProjectDto, 'frameworks'>,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('projectUrl (file) is required');
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

    const projectData = {
      ...data,
      projectUrl: file.filename,
      frameworks,
    };

    const project = await this.projectsService.create(projectData);

    return res.status(201).json({
      statusCode: 201,
      message: 'project created successfully',
      data: project,
    });
  }

  @Get()
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 6,
    @Res() res: Response,
  ) {
    const projects = await this.projectsService.findAll(page, limit);
    return res.status(200).json({
      statusCode: 200,
      message: 'projects fetched successfully',
      data: projects,
    });
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('projectUrl', {
      storage: diskStorage({
        destination: PROJECT_UPLOADS_FOLDER,
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
    @Param('id') id: string,
    @Body('frameworks', ParseJsonArrayPipe) frameworks: string[],
    @Body() data: Omit<UpdateProjectDto, 'frameworks'>,
    @Res() res: Response,
  ) {
    if (file) {
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
    }
    const projectData = {
      ...data,
      frameworks,
    };

    await this.projectsService.update({ ...projectData, id, projectUrl: file });

    return res.status(200).json({
      statusCode: 200,
      message: 'project updated successfully',
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res: Response) {
    await this.projectsService.delete(id);
    return res.status(200).json({
      statusCode: 200,
      message: 'project deleted successfully',
    });
  }

  @Delete('delete-framework')
  async deleteFramework(
    @Body('projectId') projectId: string,
    @Body('frameworkId') frameworkId: string,
    @Res() res: Response,
  ) {
    await this.projectsService.deleteFramework(projectId, frameworkId);
    return res.status(200).json({
      statusCode: 200,
      message: 'framework deleted successfully',
    });
  }
}
