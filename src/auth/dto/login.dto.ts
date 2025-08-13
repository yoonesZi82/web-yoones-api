import { passwordRegex, phoneRegex } from '@/regexs/regex-global';
// import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class LoginDto {
  // @ApiProperty({ example: '09912209730', description: 'mobile' })
  @IsString({ message: 'mobile must be a string' })
  @IsNotEmpty({ message: 'mobile is required' })
  @Matches(phoneRegex, { message: 'mobile number is not valid' })
  @Transform(({ value }) => value.trim())
  mobile: string;

  // @ApiProperty({ example: '12345678aA!', description: 'password' })
  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @Matches(passwordRegex, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @Transform(({ value }) => value.trim())
  password: string;
}
