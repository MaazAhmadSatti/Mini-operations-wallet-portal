import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ListWalletsQueryDto } from './dto/list-wallets-query.dto';
import { WalletMoneyDto } from './dto/wallet-money.dto';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a wallet (opening balance 0)' })
  create(@Body() dto: CreateWalletDto) {
    return this.walletsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List wallets (paginated)',
    description: 'Filter by userId, currency, and/or status',
  })
  findAll(@Query() query: ListWalletsQueryDto) {
    return this.walletsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a wallet by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.walletsService.findById(id);
  }

  @Post(':id/credit')
  @ApiOperation({
    summary: 'Credit a wallet',
    description:
      'Requires client referenceId (unique per wallet). Duplicate referenceId returns 409.',
  })
  credit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WalletMoneyDto) {
    return this.walletsService.credit(id, dto);
  }

  @Post(':id/debit')
  @ApiOperation({
    summary: 'Debit a wallet',
    description:
      'Requires client referenceId (unique per wallet). Fails if balance would go negative.',
  })
  debit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: WalletMoneyDto) {
    return this.walletsService.debit(id, dto);
  }
}
