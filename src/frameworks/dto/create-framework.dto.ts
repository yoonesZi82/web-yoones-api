import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFrameworkDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString({ message: 'frameworkUrl must be a string' })
  @IsNotEmpty({ message: 'frameworkUrl is required' })
  frameworkUrl: string;
}
