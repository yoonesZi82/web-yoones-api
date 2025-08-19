import {
  HttpException,
  BadRequestException,
  Injectable,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../utils/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ObjectId } from 'mongodb';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProjectsService {
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

  // ================= Create Project =================
  async create(data: CreateProjectDto & { projectUrl: Express.Multer.File }) {
    const { frameworks, projectUrl, ...projectData } = data;

    try {
      // بررسی وجود پروژه با همان عنوان
      const isProjectExist = await this.prisma.project.findFirst({
        where: { title: projectData.title },
      });

      if (isProjectExist) {
        throw new HttpException(
          { statusCode: 400, message: 'project already exists' },
          HttpStatus.BAD_REQUEST,
        );
      }

      let projectUrlPublic: string = '';

      if (projectUrl) {
        const fileExt = projectUrl.originalname.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `projects/${fileName}`;

        const { error } = await this.supabase.storage
          .from(
            this.configService.get<string>('SUPABASE_BUCKET_PROJECTS') ||
              'projects',
          )
          .upload(filePath, projectUrl.buffer, { upsert: true });

        if (error) {
          throw new HttpException(
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const { data: publicUrlData } = this.supabase.storage
          .from(
            this.configService.get<string>('SUPABASE_BUCKET_PROJECTS') ||
              'projects',
          )
          .getPublicUrl(filePath);

        projectUrlPublic = publicUrlData.publicUrl;

        const result = await this.prisma.$transaction(async (prisma) => {
          const project = await prisma.project.create({
            data: {
              ...projectData,
              projectUrl: projectUrlPublic,
            },
          });

          if (frameworks && frameworks.length > 0) {
            const projectFrameworks = frameworks.map((frameworkId) => ({
              projectId: project.id,
              frameworkId,
            }));

            await prisma.projectFramework.createMany({
              data: projectFrameworks,
            });
          }

          return project;
        });
        return result;
      } else {
        throw new HttpException(
          { statusCode: 400, message: 'project url is required' },
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

  // ================= Update Project =================
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

      const project = await this.prisma.project.findUnique({ where: { id } });
      if (!project) {
        throw new HttpException(
          { statusCode: 404, message: 'project not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      let projectUrlPublic = project.projectUrl;

      if (projectUrl) {
        const fileExt = projectUrl.originalname.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `projects/${fileName}`;

        if (project.projectUrl) {
          const prevFileName = project.projectUrl.split('/').pop();
          if (prevFileName) {
            await this.supabase.storage
              .from(
                this.configService.get<string>('SUPABASE_BUCKET_PROJECTS') ||
                  'projects',
              )
              .remove([`projects/${prevFileName}`]);
          }
        }

        const { error: uploadError } = await this.supabase.storage
          .from(
            this.configService.get<string>('SUPABASE_BUCKET_PROJECTS') ||
              'projects',
          )
          .upload(filePath, projectUrl.buffer, { upsert: true });

        if (uploadError) {
          throw new HttpException(
            uploadError.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const { data: publicUrlData } = this.supabase.storage
          .from(
            this.configService.get<string>('SUPABASE_BUCKET_PROJECTS') ||
              'projects',
          )
          .getPublicUrl(filePath);

        projectUrlPublic = publicUrlData.publicUrl;
      }

      const updatedProject = await this.prisma.$transaction(async (prisma) => {
        const project = await prisma.project.update({
          where: { id },
          data: {
            ...projectData,
            projectUrl: projectUrlPublic,
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

          await prisma.projectFramework.createMany({ data: projectFrameworks });
        }

        return project;
      });

      return updatedProject;
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

  // ================= Delete Project =================
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

      if (project.projectUrl) {
        const prevFilePath = project.projectUrl.split('/').pop();
        if (prevFilePath) {
          await this.supabase.storage
            .from(
              this.configService.get<string>('SUPABASE_BUCKET_PROJECTS') ||
                'projects',
            )
            .remove([`projects/${prevFilePath}`]);
        }
      }

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

  // ================= Delete Framework =================
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
