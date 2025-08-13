import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJsonArrayPipe implements PipeTransform<string, any[]> {
  transform(value: any) {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      throw new BadRequestException('frameworks must be an array');
    } catch {
      return [value];
    }
  }
}
