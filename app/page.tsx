
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  Gift,
  Package,
  Plus,
  ShoppingBag,
  TrendingUp,
  Wallet,
  RefreshCw,
  ReceiptText,
  Percent,
  Clock3,
  Download,
} from "lucide-react";

import DashboardLayout from "../src/components/layout/DashboardLayout";
import Loading from "../src/components/layout/Loading";

import {
  getReportOverview,
  getSalesReport,
  getExpensesReport,
  getTransactionsReport,
  getCashFlowReport,
  getComparisonReport,
  getRevenueEvolutionReport,
  exportReport,
  type ReportExportFormat,
  type ReportExportType,
  type ReportOverview,
  type SalesReport,
  type ExpensesReport,
  type ReportTransactions,
  type ReportCashFlow,
  type ReportComparison,
  type ReportRevenueEvolution,
} from "../src/services/reportService";

function getComparisonPeriods() {
  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const toDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return {
    startDate: toDate(currentStart),
    endDate: toDate(now),
    previousStartDate: toDate(previousStart),
    previousEndDate: toDate(previousEnd),
  };
}

function getRevenueEvolutionPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const toDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return { startDate: toDate(start), endDate: toDate(now) };
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(
    new Date(year, monthNumber - 1, 1)
  ).replace(".", "");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function displayValue(
  value: number | null | undefined,
  format: "currency" | "number" | "percentage" = "currency"
): string {
  if (value === null || value === undefined) return "—";

  if (format === "number") return formatNumber(value);
  if (format === "percentage") return formatPercentage(value);

  return formatCurrency(value);
}

function Value({
  value,
  loading,
  format = "currency",
  className = "",
}: {
  value: number | null | undefined;
  loading: boolean;
  format?: "currency" | "number" | "percentage";
  className?: string;
}) {
  if (loading) {
    return <Loading size={30} />;
  }

  return (
    <span className={className}>
      {displayValue(value, format)}
    </span>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
  format = "currency",
}: {
  title: string;
  value: number | null | undefined;
  icon: ElementType;
  description: string;
  loading: boolean;
  format?: "currency" | "number" | "percentage";
}) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">
          {title}
        </p>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7f2e9]">
          <Icon className="h-5 w-5 text-[#a98a58]" />
        </div>
      </div>

      <div className="mt-5 min-h-9 text-2xl font-bold tracking-tight text-[#342d27] sm:text-[28px]">
        <Value value={value} loading={loading} format={format} />
      </div>

      <p className="mt-3 text-xs text-stone-400">
        {description}
      </p>
    </div>
  );
}

function FinancialRow({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: number | null | undefined;
  icon: ElementType;
  color: "green" | "red" | "amber";
  loading: boolean;
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`rounded-xl p-2.5 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>

        <span className="text-sm text-stone-500">
          {title}
        </span>
      </div>

      <div className="shrink-0 text-sm font-semibold text-[#342d27]">
        <Value value={value} loading={loading} />
      </div>
    </div>
  );
}

function PaymentProgress({
  title,
  percentage,
  loading,
  color,
}: {
  title: string;
  percentage: number | null | undefined;
  loading: boolean;
  color: "green" | "red";
}) {
  const progress =
    percentage == null
      ? 0
      : Math.min(100, Math.max(0, percentage));

  return (
    <div className="mt-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-stone-500">
          {title}
        </span>

        <span className="text-xs font-semibold text-[#342d27]">
          <Value
            value={percentage}
            loading={loading}
            format="percentage"
          />
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={
          loading || percentage == null ? undefined : progress
        }
        className="h-3 overflow-hidden rounded-full bg-[#f0ece5]"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            color === "green" ? "bg-emerald-600" : "bg-red-500"
          }`}
          style={{ width: `${loading ? 0 : progress}%` }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
  link = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  link?: boolean;
}) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#342d27]">
            {title}
          </h2>

          <p className="mt-1 text-xs text-stone-400">
            {description}
          </p>
        </div>

        {link && (
          <Link
            href="/relatorios"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#a98a58] hover:text-[#927448]"
          >
            Ver relatórios
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {children}
    </section>
  );
}

export default function HomePage() {
  const [overview, setOverview] =
    useState<ReportOverview | null>(null);

  const [salesReport, setSalesReport] =
    useState<SalesReport | null>(null);

  const [expensesReport, setExpensesReport] =
    useState<ExpensesReport | null>(null);

  const [transactionsReport, setTransactionsReport] =
    useState<ReportTransactions | null>(null);

  const [cashFlowReport, setCashFlowReport] =
    useState<ReportCashFlow | null>(null);

  const [comparisonReport, setComparisonReport] =
    useState<ReportComparison | null>(null);

  const [revenueEvolution, setRevenueEvolution] =
    useState<ReportRevenueEvolution | null>(null);

  const [loading, setLoading] = useState(true);

  const [overviewError, setOverviewError] = useState(false);
  const [salesError, setSalesError] = useState(false);
  const [expensesError, setExpensesError] = useState(false);
  const [transactionsError, setTransactionsError] = useState(false);
  const [cashFlowError, setCashFlowError] = useState(false);
  const [comparisonError, setComparisonError] = useState(false);
  const [revenueEvolutionError, setRevenueEvolutionError] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState("");
  const [exportType, setExportType] = useState<ReportExportType>("ALL");
  const [exportFormat, setExportFormat] = useState<ReportExportFormat>("PDF");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const { startDate, endDate } = getComparisonPeriods();
      await exportReport({ startDate, endDate }, exportFormat, exportType);
    } catch {
      setExportError("Não foi possível exportar o relatório. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    setCurrentMonth(
      new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(new Date())
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      const results = await Promise.allSettled([
        getReportOverview(),
        getSalesReport(),
        getExpensesReport(),
        getTransactionsReport(),
        getCashFlowReport(),
        getComparisonReport(getComparisonPeriods()),
        getRevenueEvolutionReport(getRevenueEvolutionPeriod()),
      ]);

      if (!active) return;

      const [
        overviewResult,
        salesResult,
        expensesResult,
        transactionsResult,
        cashFlowResult,
        comparisonResult,
        revenueEvolutionResult,
      ] = results;

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
        setOverviewError(false);
      } else {
        setOverview(null);
        setOverviewError(true);
      }

      if (salesResult.status === "fulfilled") {
        setSalesReport(salesResult.value);
        setSalesError(false);
      } else {
        setSalesReport(null);
        setSalesError(true);
      }

      if (expensesResult.status === "fulfilled") {
        setExpensesReport(expensesResult.value);
        setExpensesError(false);
      } else {
        setExpensesReport(null);
        setExpensesError(true);
      }

      if (transactionsResult.status === "fulfilled") {
        setTransactionsReport(transactionsResult.value);
        setTransactionsError(false);
      } else {
        setTransactionsReport(null);
        setTransactionsError(true);
      }

      if (cashFlowResult.status === "fulfilled") {
        setCashFlowReport(cashFlowResult.value);
        setCashFlowError(false);
      } else {
        setCashFlowReport(null);
        setCashFlowError(true);
      }

      if (comparisonResult.status === "fulfilled") {
        setComparisonReport(comparisonResult.value);
        setComparisonError(false);
      } else {
        setComparisonReport(null);
        setComparisonError(true);
      }

      if (revenueEvolutionResult.status === "fulfilled") {
        setRevenueEvolution(revenueEvolutionResult.value);
        setRevenueEvolutionError(false);
      } else {
        setRevenueEvolution(null);
        setRevenueEvolutionError(true);
      }

      setLoading(false);
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const refresh = () => {
    if (loading) return;

    setLoading(true);
    setOverviewError(false);
    setSalesError(false);
    setExpensesError(false);
    setTransactionsError(false);
    setCashFlowError(false);
    setComparisonError(false);
    setRevenueEvolutionError(false);
    setReloadKey((current) => current + 1);
  };

  const failedReports = [
    overviewError ? "resumo financeiro" : null,
    salesError ? "vendas" : null,
    expensesError ? "despesas" : null,
    transactionsError ? "movimentações" : null,
    cashFlowError ? "fluxo de caixa" : null,
    comparisonError ? "comparação de períodos" : null,
    revenueEvolutionError ? "evolução do faturamento" : null,
  ].filter(Boolean);

  return (
    <DashboardLayout>
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-[#a98a58]">
            Painel de controle
          </p>

          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
            Personalité Creative
          </h1>
        </div>

        <Link
          href="/vendas"
          className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#927448]"
        >
          <Plus className="h-4 w-4" />
          Nova venda
        </Link>
      </div>

      {/* Período */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold capitalize text-[#342d27]">
            {currentMonth || "Período atual"}
          </p>

          <p className="mt-1 text-xs text-stone-400">
            Resumo das vendas, despesas e resultados do mês
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#e9dfcc] bg-white px-4 py-2.5 text-xs font-semibold text-[#927448] transition-colors hover:bg-[#f7f2e9] disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Atualizar
        </button>
      </div>

      {/* Exportação dos relatórios */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#342d27]">Exportar relatórios</h2>
            <p className="mt-1 text-xs text-stone-400">
              Baixe os dados financeiros do mês atual em PDF ou Excel.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <select
              aria-label="Relatório para exportação"
              value={exportType}
              onChange={(event) => setExportType(event.target.value as ReportExportType)}
              disabled={exporting}
              className="min-w-0 flex-1 rounded-xl border border-[#e9dfcc] bg-white px-3 py-2.5 text-sm text-[#342d27] sm:flex-none"
            >
              <option value="ALL">Todos os relatórios</option>
              <option value="OVERVIEW">Visão geral</option>
              <option value="SALES">Vendas</option>
              <option value="EXPENSES">Despesas</option>
              <option value="TRANSACTIONS">Movimentações</option>
              <option value="CASH_FLOW">Fluxo de caixa</option>
              <option value="COMPARISON">Comparação de períodos</option>
              <option value="REVENUE_EVOLUTION">Evolução do faturamento</option>
            </select>
            <select
              aria-label="Formato de exportação"
              value={exportFormat}
              onChange={(event) => setExportFormat(event.target.value as ReportExportFormat)}
              disabled={exporting}
              className="rounded-xl border border-[#e9dfcc] bg-white px-3 py-2.5 text-sm text-[#342d27]"
            >
              <option value="PDF">PDF</option>
              <option value="XLSX">Excel</option>
            </select>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#927448] disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exportando..." : "Baixar"}
            </button>
          </div>
        </div>
        {exportError && <p role="alert" className="mt-3 text-sm text-red-600">{exportError}</p>}
      </section>

      {/* Erros */}
      {failedReports.length > 0 && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm text-red-700">
            Não foi possível carregar: {failedReports.join(", ")}.
          </p>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-50"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Indicadores principais */}
      <Section
        title="Visão geral do negócio"
        description="Quanto você vendeu, recebeu e teve de resultado"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Faturamento bruto"
            value={overview?.expectedRevenue}
            icon={ShoppingBag}
            description="Valor total vendido, incluindo valores ainda não recebidos"
            loading={loading}
          />

          <MetricCard
            title="Dinheiro recebido"
            value={overview?.receivedRevenue}
            icon={Wallet}
            description="Valor das vendas que já foi recebido"
            loading={loading}
          />

          <MetricCard
            title="Lucro líquido previsto"
            value={overview?.expectedProfit}
            icon={ChartNoAxesCombined}
            description="Total vendido menos as despesas previstas"
            loading={loading}
          />

          <MetricCard
            title="Lucro líquido realizado"
            value={overview?.realizedProfit}
            icon={TrendingUp}
            description="Dinheiro recebido menos as despesas pagas"
            loading={loading}
          />
        </div>
      </Section>

      {/* Evolução do faturamento */}
      <Section
        title="Evolução do faturamento"
        description="Faturamento bruto mensal dos últimos seis meses"
        link
      >
        <div className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-stone-400">Total no período</p>
              <div className="mt-2 text-2xl font-bold tracking-tight text-[#342d27]">
                <Value value={revenueEvolution?.totalRevenue} loading={loading} />
              </div>
            </div>
            <div className="rounded-xl bg-[#f7f2e9] p-3">
              <TrendingUp className="h-5 w-5 text-[#a98a58]" />
            </div>
          </div>

          {loading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loading size={30} />
            </div>
          ) : revenueEvolutionError ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-red-600">
              Não foi possível carregar a evolução do faturamento.
            </div>
          ) : !revenueEvolution?.months.length ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-stone-500">
              Nenhum dado de faturamento encontrado.
            </div>
          ) : (
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueEvolution.months.map((item) => ({
                    month: formatMonth(item.month),
                    revenue: item.revenue,
                  }))}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueEvolutionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a98a58" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#a98a58" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f0ece5" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#78716c", fontSize: 12 }}
                    dy={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#78716c", fontSize: 11 }}
                    tickFormatter={(value: number) =>
                      new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value)
                    }
                    width={54}
                  />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(Number(value ?? 0)), "Faturamento"]}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      border: "1px solid #ece6dc",
                      borderRadius: 12,
                      backgroundColor: "#fff",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#a98a58"
                    strokeWidth={3}
                    fill="url(#revenueEvolutionGradient)"
                    dot={{ r: 4, fill: "#fff", stroke: "#a98a58", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#a98a58", stroke: "#fff", strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-5 text-xs text-stone-400">
            Valores vendidos por mês, incluindo recebimentos pendentes. O mês atual considera os dados até hoje.
          </p>
        </div>
      </Section>

      {/* Vendas */}
      <Section
        title="Como estão as vendas?"
        description="Quantidade, valor médio e recebimentos"
        link
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Vendas realizadas"
            value={salesReport?.totalSales}
            icon={ReceiptText}
            description="Quantidade de vendas registradas neste mês"
            loading={loading}
            format="number"
          />

          <MetricCard
            title="Valor médio por venda"
            value={salesReport?.averageTicket}
            icon={Wallet}
            description="Quanto cada venda representa, em média"
            loading={loading}
          />

          <MetricCard
            title="Falta receber"
            value={salesReport?.outstandingAmount}
            icon={Clock3}
            description="Valor vendido que os clientes ainda precisam pagar"
            loading={loading}
          />

          <MetricCard
            title="Vendas já recebidas"
            value={salesReport?.receivedPercentage}
            icon={Percent}
            description="Percentual do faturamento que já entrou"
            loading={loading}
            format="percentage"
          />
        </div>
      </Section>

      {/* Despesas */}
      <Section
        title="Como estão as despesas?"
        description="O que foi registrado, pago e ainda falta pagar"
        link
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Despesas registradas"
            value={expensesReport?.totalExpenses}
            icon={ReceiptText}
            description="Quantidade de despesas lançadas neste mês"
            loading={loading}
            format="number"
          />

          <MetricCard
            title="Total de despesas"
            value={expensesReport?.expectedAmount}
            icon={CircleDollarSign}
            description="Soma dos gastos previstos para o mês"
            loading={loading}
          />

          <MetricCard
            title="Despesas já pagas"
            value={expensesReport?.paidAmount}
            icon={ArrowDownRight}
            description="Valor que já saiu para pagar despesas"
            loading={loading}
          />

          <MetricCard
            title="Falta pagar"
            value={expensesReport?.outstandingAmount}
            icon={Clock3}
            description="Valor das despesas que ainda precisa ser pago"
            loading={loading}
          />

          <MetricCard
            title="Contas em aberto"
            value={expensesReport?.pendingExpenses}
            icon={ClipboardList}
            description="Quantidade de despesas ainda não quitadas"
            loading={loading}
            format="number"
          />

          <MetricCard
            title="Despesas já quitadas"
            value={expensesReport?.paidPercentage}
            icon={Percent}
            description="Percentual do valor total das despesas já pago"
            loading={loading}
            format="percentage"
          />
        </div>
      </Section>

      {/* Recebimentos e pagamentos */}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#342d27]">
                Dinheiro das vendas
              </h2>

              <p className="mt-1 text-xs text-stone-400">
                O que já entrou e o que ainda falta receber
              </p>
            </div>

            <div className="rounded-xl bg-[#f7f2e9] p-3">
              <ArrowUpRight className="h-5 w-5 text-[#a98a58]" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#faf8f5] p-5">
              <p className="text-sm text-stone-500">
                Já recebido
              </p>

              <div className="mt-4 text-2xl font-bold text-emerald-700">
                <Value
                  value={salesReport?.receivedAmount}
                  loading={loading}
                />
              </div>

              <p className="mt-3 text-xs text-stone-400">
                Dinheiro que já entrou
              </p>
            </div>

            <div className="rounded-xl bg-[#faf8f5] p-5">
              <p className="text-sm text-stone-500">
                Ainda a receber
              </p>

              <div className="mt-4 text-2xl font-bold text-[#342d27]">
                <Value
                  value={salesReport?.outstandingAmount}
                  loading={loading}
                />
              </div>

              <p className="mt-3 text-xs text-stone-400">
                Dinheiro pendente dos clientes
              </p>
            </div>
          </div>

          <PaymentProgress
            title="Quanto das vendas já foi recebido"
            percentage={salesReport?.receivedPercentage}
            loading={loading}
            color="green"
          />
        </section>

        <section className="min-w-0 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#342d27]">
                Pagamento das despesas
              </h2>

              <p className="mt-1 text-xs text-stone-400">
                O que já foi pago e o que continua pendente
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#faf8f5] p-5">
              <p className="text-sm text-stone-500">
                Já pago
              </p>

              <div className="mt-4 text-2xl font-bold text-emerald-700">
                <Value
                  value={expensesReport?.paidAmount}
                  loading={loading}
                />
              </div>

              <p className="mt-3 text-xs text-stone-400">
                Despesas que já foram pagas
              </p>
            </div>

            <div className="rounded-xl bg-[#faf8f5] p-5">
              <p className="text-sm text-stone-500">
                Ainda a pagar
              </p>

              <div className="mt-4 text-2xl font-bold text-[#342d27]">
                <Value
                  value={expensesReport?.outstandingAmount}
                  loading={loading}
                />
              </div>

              <p className="mt-3 text-xs text-stone-400">
                Compromissos que ainda precisam ser pagos
              </p>
            </div>
          </div>

          <PaymentProgress
            title="Quanto das despesas já foi pago"
            percentage={expensesReport?.paidPercentage}
            loading={loading}
            color="red"
          />
        </section>
      </div>

      {/* Movimentações financeiras */}
      <Section
        title="Movimentações financeiras"
        description="Resumo das entradas e saídas vinculadas às operações do mês"
        link
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Entradas"
            value={transactionsReport?.totalEntries}
            icon={ArrowUpRight}
            description="Valores recebidos das vendas do período"
            loading={loading}
          />

          <MetricCard
            title="Saídas"
            value={transactionsReport?.totalExits}
            icon={ArrowDownRight}
            description="Valores pagos em despesas do período"
            loading={loading}
          />

          <MetricCard
            title="Saldo das movimentações"
            value={transactionsReport?.balance}
            icon={Wallet}
            description="Entradas menos saídas registradas no período"
            loading={loading}
          />
        </div>
      </Section>

      {/* Fluxo de caixa */}
      <Section
        title="Fluxo de caixa"
        description="Entradas, saídas e saldo organizados por data de referência no mês"
        link
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Entradas do período"
            value={cashFlowReport?.totalEntries}
            icon={ArrowUpRight}
            description="Soma das entradas consideradas no fluxo de caixa"
            loading={loading}
          />

          <MetricCard
            title="Saídas do período"
            value={cashFlowReport?.totalExits}
            icon={ArrowDownRight}
            description="Soma das saídas consideradas no fluxo de caixa"
            loading={loading}
          />

          <MetricCard
            title="Saldo do período"
            value={cashFlowReport?.balance}
            icon={Wallet}
            description="Diferença entre entradas e saídas do período"
            loading={loading}
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
          <div className="border-b border-[#f0ece5] px-5 py-5 sm:px-7">
            <h3 className="text-sm font-semibold text-[#342d27]">
              Movimentação por dia
            </h3>
            <p className="mt-1 text-xs text-stone-400">
              Dias com movimentações registradas no período
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[150px] items-center justify-center">
              <Loading size={30} />
            </div>
          ) : cashFlowError ? (
            <p className="px-5 py-8 text-center text-sm text-red-600">
              Não foi possível carregar o fluxo de caixa.
            </p>
          ) : !cashFlowReport?.days.length ? (
            <p className="px-5 py-8 text-center text-sm text-stone-500">
              Nenhuma movimentação encontrada neste período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#faf8f5] text-xs text-stone-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold sm:px-7">Data</th>
                    <th className="px-5 py-3 text-right font-semibold">Entradas</th>
                    <th className="px-5 py-3 text-right font-semibold">Saídas</th>
                    <th className="px-5 py-3 text-right font-semibold sm:pr-7">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece5]">
                  {cashFlowReport.days.map((day) => (
                    <tr key={day.date}>
                      <td className="px-5 py-3 font-medium text-[#342d27] sm:px-7">
                        {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
                          new Date(`${day.date}T12:00:00Z`)
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-emerald-700">
                        {formatCurrency(day.entries)}
                      </td>
                      <td className="px-5 py-3 text-right text-red-600">
                        {formatCurrency(day.exits)}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-semibold sm:pr-7 ${
                          day.balance < 0 ? "text-red-600" : "text-[#342d27]"
                        }`}
                      >
                        {formatCurrency(day.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>

      {/* Resumo financeiro */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-7">
          <h2 className="text-base font-semibold text-[#342d27]">
            Detalhamento do resultado
          </h2>

          <p className="mt-1 text-xs text-stone-400">
            Entenda como as vendas e despesas compõem o resultado
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-[#342d27]">
              Valores das vendas
            </h3>

            <FinancialRow
              title="Total vendido"
              value={overview?.expectedRevenue}
              icon={ShoppingBag}
              color="green"
              loading={loading}
            />

            <FinancialRow
              title="Já recebido"
              value={overview?.receivedRevenue}
              icon={Wallet}
              color="green"
              loading={loading}
            />

            <FinancialRow
              title="Pendente de recebimento"
              value={overview?.outstandingRevenue}
              icon={Clock3}
              color="amber"
              loading={loading}
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-[#342d27]">
              Valores das despesas
            </h3>

            <FinancialRow
              title="Total previsto"
              value={overview?.expectedExpenses}
              icon={Package}
              color="amber"
              loading={loading}
            />

            <FinancialRow
              title="Já pago"
              value={overview?.paidExpenses}
              icon={ArrowDownRight}
              color="red"
              loading={loading}
            />

            <FinancialRow
              title="Pendente de pagamento"
              value={overview?.outstandingExpenses}
              icon={CircleDollarSign}
              color="red"
              loading={loading}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-[#ece6dc] pt-6 sm:grid-cols-2">
          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm font-medium text-stone-500">
              Lucro líquido previsto
            </p>

            <div
              className={`mt-3 text-xl font-bold ${
                overview && overview.expectedProfit < 0
                  ? "text-red-600"
                  : "text-emerald-700"
              }`}
            >
              <Value
                value={overview?.expectedProfit}
                loading={loading}
              />
            </div>

            <p className="mt-3 text-xs text-stone-400">
              Faturamento total menos todas as despesas previstas
            </p>
          </div>

          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm font-medium text-stone-500">
              Lucro líquido realizado
            </p>

            <div
              className={`mt-3 text-xl font-bold ${
                overview && overview.realizedProfit < 0
                  ? "text-red-600"
                  : "text-emerald-700"
              }`}
            >
              <Value
                value={overview?.realizedProfit}
                loading={loading}
              />
            </div>

            <p className="mt-3 text-xs text-stone-400">
              Valores recebidos menos despesas efetivamente pagas
            </p>
          </div>
        </div>
      </section>

      {/* Comparação entre períodos */}
      <Section
        title="Comparação de períodos"
        description="Desempenho do mês atual em relação ao mês anterior"
        link
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {([
            {
              title: "Faturamento",
              current: comparisonReport?.currentPeriod.revenue,
              previous: comparisonReport?.previousPeriod.revenue,
              variation: comparisonReport?.variations.revenuePercentage,
              icon: ShoppingBag,
            },
            {
              title: "Despesas",
              current: comparisonReport?.currentPeriod.expenses,
              previous: comparisonReport?.previousPeriod.expenses,
              variation: comparisonReport?.variations.expensesPercentage,
              icon: CircleDollarSign,
            },
            {
              title: "Lucro previsto",
              current: comparisonReport?.currentPeriod.profit,
              previous: comparisonReport?.previousPeriod.profit,
              variation: comparisonReport?.variations.profitPercentage,
              icon: TrendingUp,
            },
          ] as const).map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#342d27]">{item.title}</h3>
                  <div className="rounded-xl bg-[#f7f2e9] p-3">
                    <Icon className="h-5 w-5 text-[#a98a58]" />
                  </div>
                </div>
                <p className="mt-5 text-xs text-stone-400">Mês atual</p>
                <div className="mt-2 text-2xl font-bold text-[#342d27]">
                  <Value value={item.current} loading={loading} />
                </div>
                <p className="mt-4 text-xs text-stone-400">Mês anterior</p>
                <div className="mt-1 text-sm font-semibold text-stone-600">
                  <Value value={item.previous} loading={loading} />
                </div>
                <div className="mt-5 border-t border-[#ece6dc] pt-4">
                  <p className="text-xs text-stone-500">Variação em relação ao mês anterior</p>
                  <div
                    className={`mt-2 text-lg font-bold ${
                      item.variation != null && item.variation < 0
                        ? "text-red-600"
                        : "text-emerald-700"
                    }`}
                  >
                    <Value value={item.variation} loading={loading} format="percentage" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!loading && comparisonError && (
          <p className="mt-4 text-sm text-red-600">
            Não foi possível carregar a comparação de períodos.
          </p>
        )}
        <p className="mt-4 text-xs text-stone-400">
          Comparação de valores previstos. O mês atual considera os dados até hoje;
          o mês anterior considera o mês completo.
        </p>
      </Section>

      {/* Vendas recentes */}
      <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-7">
          <div>
            <h2 className="text-base font-semibold text-[#342d27]">
              Vendas recentes
            </h2>

            <p className="mt-1 text-xs text-stone-400">
              Acesse as últimas vendas cadastradas
            </p>
          </div>

          <Link
            href="/vendas"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#a98a58] hover:text-[#927448]"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 border-t border-[#f0ece5] px-6 py-8 text-center">
          <ShoppingBag className="h-7 w-7 text-[#cbb58e]" />

          <p className="text-sm font-semibold text-[#342d27]">
            Consulte as vendas registradas
          </p>

          <Link
            href="/vendas"
            className="text-sm font-semibold text-[#a98a58] hover:text-[#927448]"
          >
            Acessar vendas
          </Link>
        </div>
      </section>

      {/* Atalhos */}
      <section>
        <h2 className="mb-5 text-base font-semibold">
          Acesso rápido
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Cadastrar produto",
              description: "Adicionar novo item",
              icon: Gift,
              href: "/produtos/novo",
            },
            {
              label: "Registrar venda",
              description: "Criar novo pedido",
              icon: ShoppingBag,
              href: "/vendas",
            },
            {
              label: "Lançar despesa",
              description: "Registrar um gasto",
              icon: ClipboardList,
              href: "/despesas",
            },
            {
              label: "Ver relatórios",
              description: "Analisar resultados",
              icon: ChartNoAxesCombined,
              href: "/relatorios",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm transition-all hover:border-[#cbb58e] hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f7f2e9]">
                  <Icon className="h-5 w-5 text-[#a98a58]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {item.label}
                  </p>

                  <p className="mt-1 text-xs text-stone-400">
                    {item.description}
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 transition-transform group-hover:translate-x-1 group-hover:text-[#a98a58]" />
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-[#e9e2d8] pt-6 text-center text-xs text-stone-400">
        Personalité Creative · Sistema de gestão
      </footer>
    </DashboardLayout>
  );
}