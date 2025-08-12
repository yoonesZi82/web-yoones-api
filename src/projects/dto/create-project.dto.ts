import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title: string;

  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  description: string;

  @IsString({ message: 'link must be a string' })
  @IsNotEmpty({ message: 'link is required' })
  link: string;

  @IsArray({ message: 'frameworks must be an array' })
  @IsNotEmpty({ message: 'frameworks is required' })
  frameworks: string[];
}
