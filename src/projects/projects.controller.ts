import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Put,
  Delete,
  BadRequestException,
  HttpStatus,
  HttpException,
  UseGuards,
  DefaultValuePipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import checkSizePhoto from 'src/utils/check-size-photo';
import { PROJECT_UPLOADS_FOLDER } from '../common/constants';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Public } from '@/auth/decorator/public.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ParseJsonArrayPipe } from './pipe/parse-array.pipe';
import { ParseIntPipe } from '@nestjs/common';

@ApiTags('Manage Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ================= Create Project =================
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectUrl: { type: 'string', format: 'binary' },
        title: { type: 'string', example: 'Project Title' },
        description: { type: 'string', example: 'Project Description' },
        link: { type: 'string', example: 'https://www.google.com' },
        frameworks: {
          type: 'array',
          items: { type: 'string' },
          example: ['12345678', '987654321'],
        },
      },
      required: ['title', 'description', 'link', 'frameworks', 'projectUrl'],
    },
  })
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
  ) {
    if (!file) throw new BadRequestException('projectUrl (file) is required');
    if (!checkSizePhoto(file)) {
      throw new HttpException(
        { statusCode: 400, message: 'File size is too large (max 5MB)' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const projectData = { ...data, projectUrl: file.filename, frameworks };
    const project = await this.projectsService.create(projectData);

    return {
      statusCode: 201,
      message: 'project created successfully',
      data: project,
    };
  }

  // ================= Get All Projects (Public) =================
  @Public()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get all projects' })
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
  ) {
    const projects = await this.projectsService.findAll(page, limit);
    return {
      statusCode: 200,
      message: 'projects fetched successfully',
      data: projects,
    };
  }

  // ================= Update Project =================
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectUrl: { type: 'string', format: 'binary' },
        title: { type: 'string', example: 'Project Title' },
        description: { type: 'string', example: 'Project Description' },
        link: { type: 'string', example: 'https://www.google.com' },
        frameworks: {
          type: 'array',
          items: { type: 'string' },
          example: ['689b2c7055100cc638939553', '689b2c7955100cc638939554'],
        },
      },
    },
  })
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
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('frameworks', ParseJsonArrayPipe) frameworks: string[],
    @Body() data: Omit<UpdateProjectDto, 'frameworks'>,
  ) {
    const projectData = { ...data, frameworks, id, projectUrl: file };
    await this.projectsService.update(projectData);

    return { statusCode: 200, message: 'project updated successfully' };
  }

  // ================= Delete Framework =================
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('delete-framework')
  @ApiOperation({ summary: 'Delete framework' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', example: '12345678' },
        frameworkId: { type: 'string', example: '12345678' },
      },
      required: ['projectId', 'frameworkId'],
    },
  })
  async deleteFramework(
    @Body('projectId') projectId: string,
    @Body('frameworkId') frameworkId: string,
  ) {
    await this.projectsService.deleteFramework(projectId, frameworkId);
    return { statusCode: 200, message: 'framework deleted successfully' };
  }

  // ================= Delete Project =================
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete project' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.projectsService.delete(id);
    return { statusCode: 200, message: 'project deleted successfully' };
  }
}
