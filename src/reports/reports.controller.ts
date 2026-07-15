import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailySummaryQueryDto } from './dto/daily-summary-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'System-wide overview metrics for the dashboard',
    description:
      'All-time totals: wallet count, sum of balances, sum of credits/debits, transaction count.',
  })
  getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('daily-summary')
  @ApiOperation({
    summary: 'Get system-wide daily summary for a UTC date',
    description:
      'Returns zeros when no activity exists for that day. activeWallets = wallets with ≥1 txn that day.',
  })
  getDailySummary(@Query() query: DailySummaryQueryDto) {
    return this.reportsService.getDailySummary(query.date);
  }
}
