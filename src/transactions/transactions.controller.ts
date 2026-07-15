import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('wallets/:id/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List wallet transactions (paginated)',
    description: 'Filter by type and/or referenceId',
  })
  findByWallet(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.transactionsService.findByWallet(id, query);
  }
}
