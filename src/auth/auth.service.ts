import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '@/utils/prisma.service';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { username, email, mobile, password } = registerDto;

      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ mobile }, { email }, { username }],
        },
      });

      if (existingUser) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message:
              'User with this email or mobile or username already exists',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const hashPassword = await bcrypt.hash(password, 12);

      const user = await this.prisma.user.create({
        data: { username, email, mobile, password: hashPassword },
        select: {
          id: true,
          username: true,
          email: true,
          mobile: true,
          createdAt: true,
        },
      });
      return user;
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
      });
    }
  }

  async login(loginDto: LoginDto, res: Response) {
    const { mobile, password } = loginDto;
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          mobile,
        },
      });

      if (!user) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'User with this mobile not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password as string,
      );
      if (!isPasswordValid) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            message: 'password or mobile is incorrect',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
      };
      const token = this.jwtService.sign(payload);

      res.cookie('access_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      });

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'users login successfully',
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
