import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Project Title', description: 'title' })
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title: string;

  @ApiProperty({ example: 'Project Description', description: 'description' })
  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  description: string;

  @ApiProperty({ example: 'https://www.google.com', description: 'link' })
  @IsString({ message: 'link must be a string' })
  @IsNotEmpty({ message: 'link is required' })
  link: string;

  @ApiProperty({
    example: ['12345678', '987654321'],
    description: 'frameworks',
  })
  @IsArray({ message: 'frameworks must be an array' })
  @IsNotEmpty({ message: 'frameworks is required' })
  frameworks: string[];
}
