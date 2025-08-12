import {
  HttpException,
  BadRequestException,
  Injectable,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../utils/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProjectDto) {
    const { frameworks, ...projectData } = data;

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Create project
        const project = await prisma.project.create({
          data: projectData,
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

      return {
        statusCode: 201,
        message: 'project created successfully',
        data: result,
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

  async update(data: UpdateProjectDto & { id: string }) {
    const { id, frameworks, ...projectData } = data;

    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
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

      await this.prisma.$transaction(async (prisma) => {
        // Update project data
        await prisma.project.update({
          where: { id: project.id },
          data: projectData,
        });

        // Update frameworks if provided
        if (frameworks) {
          // Create new relationships
          const projectFrameworks = frameworks.map((frameworkId) => ({
            projectId: project.id,
            frameworkId,
          }));

          await prisma.projectFramework.createMany({
            data: projectFrameworks,
          });
        }
      });

      return {
        statusCode: 200,
        message: 'project updated successfully',
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
