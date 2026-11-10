
import { api } from "../lib/api";

export interface ReportPeriod {
  startDate?: string;
  endDate?: string;
}

export interface ReportComparisonPeriodParams {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
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

export interface ExpensesReport {
  totalExpenses: number;
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paidPercentage: number;
  pendingExpenses: number;
}

export type ReportTransactionType = "ENTRY" | "EXIT";

export interface ReportTransaction {
  id: string;
  type: ReportTransactionType;
  description: string;
  referenceDate: string;
  amount: number;
}

export interface ReportTransactions {
  totalEntries: number;
  totalExits: number;
  balance: number;
  transactions: ReportTransaction[];
}

export interface ReportCashFlowDay {
  date: string;
  entries: number;
  exits: number;
  balance: number;
}

export interface ReportCashFlow {
  totalEntries: number;
  totalExits: number;
  balance: number;
  days: ReportCashFlowDay[];
}

export interface ReportComparisonPeriod {
  startDate: string;
  endDate: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ReportComparisonVariations {
  revenuePercentage: number | null;
  expensesPercentage: number | null;
  profitPercentage: number | null;
}

export interface ReportComparison {
  currentPeriod: ReportComparisonPeriod;
  previousPeriod: ReportComparisonPeriod;
  variations: ReportComparisonVariations;
}

export interface ReportRevenueEvolutionMonth {
  month: string;
  revenue: number;
}

export interface ReportRevenueEvolution {
  totalRevenue: number;
  months: ReportRevenueEvolutionMonth[];
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

export async function getExpensesReport(
  period: ReportPeriod = {}
): Promise<ExpensesReport> {
  const token = localStorage.getItem("access_token");

  const response = await api.get<ExpensesReport>("/reports/expenses", {
    params: period,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getTransactionsReport(
  period: ReportPeriod = {}
): Promise<ReportTransactions> {
  const token = localStorage.getItem("access_token");

  const response = await api.get<ReportTransactions>(
    "/reports/transactions",
    {
      params: period,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getCashFlowReport(
  period: ReportPeriod = {}
): Promise<ReportCashFlow> {
  const token = localStorage.getItem("access_token");

  const response = await api.get<ReportCashFlow>(
    "/reports/cash-flow",
    {
      params: period,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getComparisonReport(
  period: ReportComparisonPeriodParams
): Promise<ReportComparison> {
  const token = localStorage.getItem("access_token");

  const response = await api.get<ReportComparison>(
    "/reports/comparison",
    {
      params: period,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getRevenueEvolutionReport(
  period: Required<ReportPeriod>
): Promise<ReportRevenueEvolution> {
  const token = localStorage.getItem("access_token");

  const response = await api.get<ReportRevenueEvolution>(
    "/reports/revenue-evolution",
    {
      params: period,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
