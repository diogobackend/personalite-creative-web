import { api } from "../lib/api";

export interface ReportPeriod {
  startDate?: string;
  endDate?: string;
}

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

export interface SalesReport {
  totalRevenue: number;
  totalSales: number;
  averageTicket: number;
  receivedAmount: number;
  outstandingAmount: number;
  receivedPercentage: number;
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

export async function getSalesReport(
  period: ReportPeriod = {}
): Promise<SalesReport> {
  const token = localStorage.getItem("access_token");

  const response = await api.get<SalesReport>("/reports/sales", {
    params: period,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}