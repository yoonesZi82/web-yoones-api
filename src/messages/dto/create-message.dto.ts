import { phoneRegex } from '@/regexs/regex-global';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'John Doe', description: 'username' })
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username is required' })
  @Transform(({ value }) => value.trim())
  username: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'email' })
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email is required' })
  @Transform(({ value }) => value.trim())
  email: string;

  @ApiProperty({ example: '09912209730', description: 'mobile' })
  @IsString({ message: 'mobile must be a string' })
  @IsNotEmpty({ message: 'mobile is required' })
  @Matches(phoneRegex, { message: 'mobile number is not valid' })
  @Transform(({ value }) => value.trim())
  mobile: string;

  @ApiProperty({
    example: 'Hello, I have a question about your services',
    description: 'message',
  })
  @IsString({ message: 'message must be a string' })
  @IsNotEmpty({ message: 'message is required' })
  @Transform(({ value }) => value.trim())
  message: string;
}
