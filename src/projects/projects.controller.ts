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
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Response } from 'express';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() data: CreateProjectDto) {
    return this.projectsService.create(data);
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
  update(@Body() data: UpdateProjectDto, @Param('id') id: string) {
    return this.projectsService.update({ ...data, id });
  }
}
