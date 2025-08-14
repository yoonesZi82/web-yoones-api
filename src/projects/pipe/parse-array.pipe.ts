import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJsonArrayPipe implements PipeTransform {
  transform(value: any) {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        if (value.includes(',')) {
          return value.split(',').map((v) => v.trim());
        }
        return [value.trim()];
      }
    }

    throw new BadRequestException('frameworks must be an array of strings');
  }
}
