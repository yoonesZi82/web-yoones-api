import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseJsonArrayPipe implements PipeTransform<string, any[]> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: string, metadata: ArgumentMetadata): any[] {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        throw new BadRequestException('frameworks must be an array');
      }
      return parsed;
    } catch {
      throw new BadRequestException('Invalid JSON array format for frameworks');
    }
  }
}
