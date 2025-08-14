import {
  HttpException,
  BadRequestException,
  Injectable,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../utils/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { PROJECT_UPLOADS_FOLDER } from '../common/constants';
import { ObjectId } from 'mongodb';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProjectDto & { projectUrl: string }) {
    const { frameworks, projectUrl, ...projectData } = data;
    const isProjectExist = await this.prisma.project.findFirst({
      where: { title: projectData.title },
    });

    if (isProjectExist) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'project already exists',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Create project
        const project = await prisma.project.create({
          data: {
            ...projectData,
            projectUrl,
          },
        });

        // 2. Create project frameworks relations
        const projectFrameworks = frameworks.map((frameworkId) => ({
          projectId: project.id,
          frameworkId,
        }));

        await prisma.projectFramework.createMany({
          data: projectFrameworks,
        });

        return project;
      });

      return result;
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

  async findAll(page: number = 1, limit: number = 6) {
    const skip = (page - 1) * limit;
    const take = limit;

    const projects = await this.prisma.project.findMany({
      skip,
      take,
      include: {
        frameworks: {
          include: {
            framework: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects;
  }

  async update(
    data: UpdateProjectDto & { id: string; projectUrl?: Express.Multer.File },
  ) {
    const { id, frameworks, projectUrl, ...projectData } = data;

    try {
      const isValidObjectId = ObjectId.isValid(id);
      if (!isValidObjectId) {
        throw new HttpException(
          { statusCode: 400, message: 'invalid project id' },
          HttpStatus.BAD_REQUEST,
        );
      }
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new HttpException(
          { statusCode: 404, message: 'project not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      if (projectUrl && project.projectUrl) {
        const oldImagePath = resolve(
          PROJECT_UPLOADS_FOLDER,
          project.projectUrl,
        );
        try {
          await fs.access(oldImagePath);
          await fs.unlink(oldImagePath);
          console.log('Old file deleted successfully');
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

      return await this.prisma.$transaction(async (prisma) => {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            ...projectData,
            projectUrl: projectUrl?.filename || project.projectUrl,
          },
        });

        if (frameworks && frameworks.length > 0) {
          await prisma.projectFramework.deleteMany({
            where: { projectId: project.id },
          });

          const projectFrameworks = frameworks.map((frameworkId) => ({
            projectId: project.id,
            frameworkId,
          }));

          await prisma.projectFramework.createMany({
            data: projectFrameworks,
          });
        }
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
          { statusCode: 400, message: 'invalid project id' },
          HttpStatus.BAD_REQUEST,
        );
      }
      const project = await this.prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new HttpException(
          { statusCode: 404, message: 'project not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      // file path
      const filePath = join(PROJECT_UPLOADS_FOLDER, project.projectUrl);

      // delete file from system
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

      // delete record from database
      return await this.prisma.project.delete({
        where: { id: project.id },
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

  async deleteFramework(projectId: string, frameworkId: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new HttpException(
          {
            statusCode: 404,
            message: 'project not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const framework = await this.prisma.framework.findUnique({
        where: { id: frameworkId },
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

      return await this.prisma.projectFramework.delete({
        where: {
          projectId_frameworkId: {
            projectId: project.id,
            frameworkId: framework.id,
          },
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
}
