import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@ApiTags('addresses')
@ApiBearerAuth()
@Controller('companies/:companyId/addresses')
export class AddressesController {
  constructor(private addresses: AddressesService) {}

  @Get()
  list(@Param('companyId') companyId: string, @CurrentUser() actor: AuthUser) {
    return this.addresses.list(companyId, actor);
  }

  @Post()
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateAddressDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.addresses.create(companyId, dto, actor);
  }

  @Put(':id')
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.addresses.update(companyId, id, dto, actor);
  }

  @Post(':id/default')
  setDefault(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.addresses.setDefault(companyId, id, actor);
  }

  @Delete(':id')
  remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.addresses.remove(companyId, id, actor);
  }
}
