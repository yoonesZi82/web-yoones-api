import { Controller, Post, Body } from '@nestjs/common';
import { FrameworksService } from './frameworks.service';
import { CreateFrameworkDto } from './dto/create-framework.dto';

@Controller('frameworks')
export class FrameworksController {
  constructor(private readonly frameworksService: FrameworksService) {}

  @Post()
  create(@Body() createFrameworkDto: CreateFrameworkDto) {
    return this.frameworksService.create(createFrameworkDto);
  }
}
