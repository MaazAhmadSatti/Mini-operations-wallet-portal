import { apiGet } from './client';
import type { DailySummary, OverviewReport } from '../types';

export function getOverview(): Promise<OverviewReport> {
  return apiGet('/reports/overview');
}

export function getDailySummary(date: string): Promise<DailySummary> {
  return apiGet(`/reports/daily-summary?date=${encodeURIComponent(date)}`);
}
