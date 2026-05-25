import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateInvoiceDto, InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private invoices: InvoicesService) {}

  @Get()
  list(@Query() q: PaginationDto, @CurrentUser() actor: AuthUser) {
    return this.invoices.list(q, actor);
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() actor: AuthUser) {
    return this.invoices.create(dto, actor);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.invoices.findById(id);
  }

  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.invoices.send(id);
  }
}
