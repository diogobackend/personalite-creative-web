import { api } from "../lib/api";

export interface ReportOverview {
  expectedRevenue: number;
  receivedRevenue: number;
  outstandingRevenue: number;
  expectedExpenses: number;
  paidExpenses: number;
  outstandingExpenses: number;
  expectedProfit: number;
  realizedProfit: number;
}

export interface ReportPeriod {
  startDate?: string;
  endDate?: string;
}

export async function getReportOverview(
  period: ReportPeriod = {}
): Promise<ReportOverview> {
  const token = localStorage.getItem("access_token");

  const response = await api.get<ReportOverview>("/reports/overview", {
    params: period,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}