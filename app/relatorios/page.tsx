
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ElementType, ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  Percent,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";

import DashboardLayout from "../../src/components/layout/DashboardLayout";
import Loading from "../../src/components/layout/Loading";

import {
  getReportOverview,
  getSalesReport,
  getExpensesReport,
  getTransactionsReport,
  getCashFlowReport,
  getComparisonReport,
  getRevenueEvolutionReport,
  type ReportOverview,
  type SalesReport,
  type ExpensesReport,
  type ReportTransactions,
  type ReportCashFlow,
  type ReportComparison,
  type ReportRevenueEvolution,
  type ReportTransaction,
} from "../../src/services/reportService";

type PeriodPreset =
  | "today"
  | "last7"
  | "last30"
  | "currentMonth"
  | "previousMonth"
  | "custom";

type Period = {
  startDate: string;
  endDate: string;
};

type ValueFormat = "currency" | "number" | "percentage";

const PRESETS: { label: string; value: PeriodPreset }[] = [
  { label: "Hoje", value: "today" },
  { label: "Últimos 7 dias", value: "last7" },
  { label: "Últimos 30 dias", value: "last30" },
  { label: "Mês atual", value: "currentMonth" },
  { label: "Mês anterior", value: "previousMonth" },
  { label: "Personalizado", value: "custom" },
];

function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPresetPeriod(preset: PeriodPreset): Period {
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const end = new Date(start);

  switch (preset) {
    case "last7":
      start.setDate(start.getDate() - 6);
      break;

    case "last30":
      start.setDate(start.getDate() - 29);
      break;

    case "previousMonth":
      start.setDate(1);
      start.setMonth(start.getMonth() - 1);
      end.setDate(0);
      break;

    case "currentMonth":
    case "custom":
      start.setDate(1);
      break;
  }

  return {
    startDate: dateToString(start),
    endDate: dateToString(end),
  };
}

function getPreviousPeriod(period: Period): Period {
  const [startYear, startMonth, startDay] = period.startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = period.endDate.split("-").map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const durationDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - durationDays + 1);

  return {
    startDate: dateToString(previousStart),
    endDate: dateToString(previousEnd),
  };
}

function formatValue(
  value: number | null | undefined,
  format: ValueFormat = "currency"
): string {
  if (value == null) return "—";

  if (format === "number") {
    return new Intl.NumberFormat("pt-BR").format(value);
  }

  if (format === "percentage") {
    return `${new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}%`;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" })
    .format(new Date(year, monthNumber - 1, 1))
    .replace(".", "");
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function Value({
  value,
  loading,
  format = "currency",
}: {
  value: number | null | undefined;
  loading: boolean;
  format?: ValueFormat;
}) {
  if (loading) {
    return <span className="inline-block animate-pulse text-stone-300">•••</span>;
  }

  return <>{formatValue(value, format)}</>;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  positive = false,
  format = "currency",
}: {
  title: string;
  value: number | null | undefined;
  description: string;
  icon: ElementType;
  loading: boolean;
  positive?: boolean;
  format?: ValueFormat;
}) {
  const valueColor =
    positive && value != null
      ? value >= 0
        ? "text-emerald-700"
        : "text-red-600"
      : "text-[#342d27]";

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

      <div
        className={`mt-5 min-h-9 text-2xl font-bold tracking-tight sm:text-[28px] ${valueColor}`}
      >
        <Value value={value} loading={loading} format={format} />
      </div>

      <p className="mt-3 text-xs text-stone-400">
        {description}
      </p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[#342d27]">
          {title}
        </h2>

        <p className="mt-1 text-xs text-stone-400">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function SummaryRow({
  label,
  value,
  loading,
  highlight = false,
}: {
  label: string;
  value: number | null | undefined;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        highlight ? "border-t border-[#ece6dc] pt-5" : ""
      }`}
    >
      <span
        className={`text-sm ${
          highlight
            ? "font-semibold text-[#342d27]"
            : "text-stone-500"
        }`}
      >
        {label}
      </span>

      <span className="shrink-0 text-sm font-semibold text-[#342d27]">
        <Value value={value} loading={loading} />
      </span>
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

function TransactionRow({
  transaction,
}: {
  transaction: ReportTransaction;
}) {
  const isEntry = transaction.type === "ENTRY";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0ece5] py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`rounded-xl p-2.5 ${
            isEntry
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-500"
          }`}
        >
          {isEntry ? (
            <ArrowUpRight className="h-5 w-5" />
          ) : (
            <ArrowDownRight className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-[#342d27]">
            {transaction.description}
          </p>

          <p className="mt-1 text-xs text-stone-400">
            {isEntry ? "Entrada" : "Saída"} ·{" "}
            {formatDate(transaction.referenceDate)}
          </p>
        </div>
      </div>

      <span
        className={`text-sm font-bold ${
          isEntry ? "text-emerald-700" : "text-red-600"
        }`}
      >
        {isEntry ? "+" : "−"}
        {formatValue(transaction.amount)}
      </span>
    </div>
  );
}

export default function ReportsPage() {
  const [preset, setPreset] =
    useState<PeriodPreset>("currentMonth");

  const [period, setPeriod] = useState<Period>({
    startDate: "",
    endDate: "",
  });

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
  const [initialized, setInitialized] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [overviewError, setOverviewError] = useState(false);
  const [salesError, setSalesError] = useState(false);
  const [expensesError, setExpensesError] = useState(false);
  const [transactionsError, setTransactionsError] = useState(false);
  const [cashFlowError, setCashFlowError] = useState(false);
  const [comparisonError, setComparisonError] = useState(false);
  const [revenueEvolutionError, setRevenueEvolutionError] = useState(false);

  useEffect(() => {
    setPeriod(getPresetPeriod("currentMonth"));
    setInitialized(true);
  }, []);

  const validPeriod =
    Boolean(period.startDate && period.endDate) &&
    period.startDate <= period.endDate;

  useEffect(() => {
    if (!initialized || !validPeriod) return;

    let active = true;

    async function loadReports() {
      const previousPeriod = getPreviousPeriod(period);
      const results = await Promise.allSettled([
        getReportOverview(period),
        getSalesReport(period),
        getExpensesReport(period),
        getTransactionsReport(period),
        getCashFlowReport(period),
        getComparisonReport({
          ...period,
          previousStartDate: previousPeriod.startDate,
          previousEndDate: previousPeriod.endDate,
        }),
        getRevenueEvolutionReport(period),
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
  }, [
    initialized,
    period.startDate,
    period.endDate,
    reloadKey,
    validPeriod,
  ]);

  const changePreset = (value: PeriodPreset) => {
    setPreset(value);

    if (value !== "custom") {
      setLoading(true);
      setPeriod(getPresetPeriod(value));
    }
  };

  const changeCustomPeriod = (nextPeriod: Period) => {
    setPeriod(nextPeriod);

    const valid =
      Boolean(nextPeriod.startDate && nextPeriod.endDate) &&
      nextPeriod.startDate <= nextPeriod.endDate;

    setLoading(valid);

    if (!valid) {
      setOverview(null);
      setSalesReport(null);
      setExpensesReport(null);
      setTransactionsReport(null);
      setCashFlowReport(null);
      setComparisonReport(null);
      setRevenueEvolution(null);

      setOverviewError(false);
      setSalesError(false);
      setExpensesError(false);
      setTransactionsError(false);
      setCashFlowError(false);
      setComparisonError(false);
      setRevenueEvolutionError(false);
    }
  };

  const refresh = () => {
    if (!validPeriod || loading) return;

    setLoading(true);
    setOverviewError(false);
    setSalesError(false);
    setExpensesError(false);
    setTransactionsError(false);
    setCashFlowError(false);
    setComparisonError(false);
    setRevenueEvolutionError(false);
    setReloadKey((value) => value + 1);
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

  const recentTransactions =
    transactionsReport?.transactions.slice(0, 10) ?? [];

  return (
    <DashboardLayout>
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-[#a98a58]">
            Gestão financeira
          </p>

          <h1 className="mt-2 font-serif text-3xl text-[#342d27] sm:text-4xl">
            Relatórios
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Entenda quanto o negócio vendeu, recebeu, gastou
            e teve de resultado.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[#e9dfcc] bg-white px-4 py-3 text-sm font-semibold text-[#927448] transition-colors hover:bg-[#f7f2e9]"
        >
          <ArrowLeft className="h-4 w-4" />
          Visão geral
        </Link>
      </div>

      {/* Filtros */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#f7f2e9] p-2.5">
              <CalendarDays className="h-5 w-5 text-[#a98a58]" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#342d27]">
                Período de análise
              </h2>

              <p className="mt-1 text-xs text-stone-400">
                Escolha as datas dos relatórios.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || !validPeriod}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e9dfcc] px-4 py-2.5 text-sm font-semibold text-[#927448] transition-colors hover:bg-[#f7f2e9] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Atualizar
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => changePreset(item.value)}
              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors ${
                preset === item.value
                  ? "border-[#a98a58] bg-[#a98a58] text-white"
                  : "border-[#ece6dc] bg-white text-stone-500 hover:border-[#cbb58e]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-[#342d27]">
                Data inicial
              </span>

              <input
                type="date"
                value={period.startDate}
                onChange={(event) =>
                  changeCustomPeriod({
                    ...period,
                    startDate: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#e9dfcc] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98a58]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-[#342d27]">
                Data final
              </span>

              <input
                type="date"
                value={period.endDate}
                onChange={(event) =>
                  changeCustomPeriod({
                    ...period,
                    endDate: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#e9dfcc] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98a58]"
              />
            </label>
          </div>
        )}

        {!validPeriod && initialized && (
          <p className="mt-4 text-sm text-red-600">
            Informe um período válido. A data inicial não pode
            ser posterior à data final.
          </p>
        )}

        {validPeriod && (
          <div className="mt-5 flex items-center gap-2 text-xs text-stone-500">
            <Clock3 className="h-4 w-4 text-[#a98a58]" />
            {formatDate(period.startDate)} até{" "}
            {formatDate(period.endDate)}
          </div>
        )}
      </section>

      {/* Erros */}
      {failedReports.length > 0 && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4"
        >
          <p className="text-sm text-red-700">
            Não foi possível carregar: {failedReports.join(", ")}.
          </p>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || !validPeriod}
            className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-50"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Visão geral */}
      <Section
        title="Resultado do negócio"
        description="Os principais valores financeiros do período"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Faturamento bruto"
            value={overview?.expectedRevenue}
            description="Valor total das vendas, mesmo as ainda não recebidas"
            icon={ShoppingBag}
            loading={loading}
          />

          <MetricCard
            title="Dinheiro recebido"
            value={overview?.receivedRevenue}
            description="Valor das vendas que já foi recebido"
            icon={Wallet}
            loading={loading}
          />

          <MetricCard
            title="Lucro líquido previsto"
            value={overview?.expectedProfit}
            description="Total vendido menos as despesas previstas"
            icon={TrendingUp}
            loading={loading}
            positive
          />

          <MetricCard
            title="Lucro líquido realizado"
            value={overview?.realizedProfit}
            description="Dinheiro recebido menos despesas pagas"
            icon={ChartNoAxesCombined}
            loading={loading}
            positive
          />
        </div>
      </Section>

      {/* Evolução do faturamento */}
      <Section
        title="Evolução do faturamento"
        description="Faturamento mensal dentro do período selecionado"
      >
        <div className="min-w-0 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-stone-500">Faturamento no período</p>
              <div className="mt-2 text-2xl font-bold text-[#342d27]">
                <Value value={revenueEvolution?.totalRevenue} loading={loading} />
              </div>
            </div>
            <div className="rounded-xl bg-[#f7f2e9] p-3">
              <TrendingUp className="h-5 w-5 text-[#a98a58]" />
            </div>
          </div>

          {loading ? (
            <div className="flex h-[320px] items-center justify-center"><Loading /></div>
          ) : revenueEvolutionError ? (
            <div className="flex h-[320px] items-center justify-center text-center text-sm text-red-600">
              Não foi possível carregar a evolução do faturamento.
            </div>
          ) : !revenueEvolution?.months.length ? (
            <div className="flex h-[320px] items-center justify-center text-center text-sm text-stone-500">
              Nenhum dado de faturamento encontrado neste período.
            </div>
          ) : (
            <div className="h-[320px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueEvolution.months.map((item) => ({
                    month: formatMonth(item.month),
                    revenue: item.revenue,
                  }))}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="reportsRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a98a58" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#a98a58" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f0ece5" strokeDasharray="4 4" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 12 }} dy={12} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#78716c", fontSize: 11 }}
                    tickFormatter={(value: number) => new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value)}
                    width={54}
                  />
                  <Tooltip
                    formatter={(value) => [formatValue(Number(value ?? 0)), "Faturamento"]}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{ border: "1px solid #ece6dc", borderRadius: 12, backgroundColor: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#a98a58"
                    strokeWidth={3}
                    fill="url(#reportsRevenueGradient)"
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
            Valores vendidos por mês, incluindo recebimentos pendentes. Os meses nas extremidades respeitam as datas selecionadas.
          </p>
        </div>
      </Section>

      {/* Vendas */}
      <Section
        title="Desempenho das vendas"
        description="Quantidade de vendas e valores ainda a receber"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Vendas realizadas"
            value={salesReport?.totalSales}
            description="Quantidade de vendas registradas"
            icon={ReceiptText}
            loading={loading}
            format="number"
          />

          <MetricCard
            title="Valor médio por venda"
            value={salesReport?.averageTicket}
            description="Quanto cada venda representa, em média"
            icon={Wallet}
            loading={loading}
          />

          <MetricCard
            title="Falta receber"
            value={salesReport?.outstandingAmount}
            description="Valor que os clientes ainda precisam pagar"
            icon={Clock3}
            loading={loading}
          />

          <MetricCard
            title="Percentual já recebido"
            value={salesReport?.receivedPercentage}
            description="Parcela do faturamento já recebida"
            icon={Percent}
            loading={loading}
            format="percentage"
          />
        </div>
      </Section>

      {/* Despesas */}
      <Section
        title="Controle de despesas"
        description="Gastos registrados e pagamentos pendentes"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Despesas registradas"
            value={expensesReport?.totalExpenses}
            description="Quantidade de despesas lançadas"
            icon={ReceiptText}
            loading={loading}
            format="number"
          />

          <MetricCard
            title="Total de despesas"
            value={expensesReport?.expectedAmount}
            description="Soma de todos os gastos previstos"
            icon={CircleDollarSign}
            loading={loading}
          />

          <MetricCard
            title="Despesas já pagas"
            value={expensesReport?.paidAmount}
            description="Valor efetivamente pago"
            icon={ArrowDownRight}
            loading={loading}
          />

          <MetricCard
            title="Falta pagar"
            value={expensesReport?.outstandingAmount}
            description="Valor que ainda precisa ser pago"
            icon={Clock3}
            loading={loading}
          />

          <MetricCard
            title="Contas em aberto"
            value={expensesReport?.pendingExpenses}
            description="Despesas ainda não quitadas"
            icon={ReceiptText}
            loading={loading}
            format="number"
          />

          <MetricCard
            title="Percentual já pago"
            value={expensesReport?.paidPercentage}
            description="Parcela das despesas que já foi paga"
            icon={Percent}
            loading={loading}
            format="percentage"
          />
        </div>
      </Section>

      {/* Recebimentos e pagamentos */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#342d27]">
                Recebimentos das vendas
              </h2>

              <p className="mt-1 text-xs text-stone-400">
                Dinheiro recebido e valores pendentes
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <SummaryRow
              label="Total vendido"
              value={salesReport?.totalRevenue}
              loading={loading}
            />

            <SummaryRow
              label="Já recebido"
              value={salesReport?.receivedAmount}
              loading={loading}
            />

            <SummaryRow
              label="Ainda a receber"
              value={salesReport?.outstandingAmount}
              loading={loading}
              highlight
            />
          </div>

          <PaymentProgress
            title="Quanto das vendas já foi recebido"
            percentage={salesReport?.receivedPercentage}
            loading={loading}
            color="green"
          />
        </section>

        <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2.5">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#342d27]">
                Pagamentos das despesas
              </h2>

              <p className="mt-1 text-xs text-stone-400">
                Dinheiro pago e contas pendentes
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <SummaryRow
              label="Total de despesas"
              value={expensesReport?.expectedAmount}
              loading={loading}
            />

            <SummaryRow
              label="Já pago"
              value={expensesReport?.paidAmount}
              loading={loading}
            />

            <SummaryRow
              label="Ainda a pagar"
              value={expensesReport?.outstandingAmount}
              loading={loading}
              highlight
            />
          </div>

          <PaymentProgress
            title="Quanto das despesas já foi pago"
            percentage={expensesReport?.paidPercentage}
            loading={loading}
            color="red"
          />
        </section>
      </div>

      {/* Movimentações */}
      <Section
        title="Movimentações financeiras"
        description="Entradas e saídas vinculadas às operações do período"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Entradas"
            value={transactionsReport?.totalEntries}
            description="Valores recebidos das vendas"
            icon={ArrowUpRight}
            loading={loading}
          />

          <MetricCard
            title="Saídas"
            value={transactionsReport?.totalExits}
            description="Valores pagos em despesas"
            icon={ArrowDownRight}
            loading={loading}
          />

          <MetricCard
            title="Saldo das movimentações"
            value={transactionsReport?.balance}
            description="Entradas menos saídas"
            icon={Wallet}
            loading={loading}
            positive
          />
        </div>

        <div className="mt-5 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-[#342d27]">
              Últimas movimentações do período
            </h3>

            <p className="mt-1 text-xs text-stone-400">
              Até 10 registros, ordenados pela data de referência
            </p>
          </div>

          {loading ? (
            <Loading />
          ) : transactionsReport === null ? (
            <p className="py-8 text-center text-sm text-stone-400">
              Não foi possível consultar as movimentações.
            </p>
          ) : recentTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">
              Nenhuma movimentação encontrada neste período.
            </p>
          ) : (
            <div>
              {recentTransactions.map((transaction) => (
                <TransactionRow
                  key={`${transaction.type}-${transaction.id}`}
                  transaction={transaction}
                />
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Fluxo de caixa */}
      <Section
        title="Fluxo de caixa"
        description="Entradas, saídas e saldo por data de referência no período selecionado"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Entradas do período"
            value={cashFlowReport?.totalEntries}
            description="Total das entradas consideradas no fluxo"
            icon={ArrowUpRight}
            loading={loading}
          />
          <MetricCard
            title="Saídas do período"
            value={cashFlowReport?.totalExits}
            description="Total das saídas consideradas no fluxo"
            icon={ArrowDownRight}
            loading={loading}
          />
          <MetricCard
            title="Saldo do período"
            value={cashFlowReport?.balance}
            description="Diferença entre entradas e saídas"
            icon={Wallet}
            loading={loading}
            positive
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
          <div className="px-5 py-5 sm:px-7">
            <h3 className="text-base font-semibold text-[#342d27]">
              Fluxo diário
            </h3>
            <p className="mt-1 text-xs text-stone-400">
              Movimentações agrupadas pela data de referência, não necessariamente pela data do pagamento
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center border-t border-[#f0ece5] py-8">
              <Loading />
            </div>
          ) : cashFlowReport === null ? (
            <p className="border-t border-[#f0ece5] px-5 py-8 text-center text-sm text-stone-400">
              Não foi possível consultar o fluxo de caixa.
            </p>
          ) : cashFlowReport.days.length === 0 ? (
            <p className="border-t border-[#f0ece5] px-5 py-8 text-center text-sm text-stone-400">
              Nenhuma movimentação encontrada neste período.
            </p>
          ) : (
            <div className="overflow-x-auto border-t border-[#f0ece5]">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-[#faf8f5] text-xs text-stone-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold sm:px-7">Data</th>
                    <th className="px-5 py-3 text-right font-semibold">Entradas</th>
                    <th className="px-5 py-3 text-right font-semibold">Saídas</th>
                    <th className="px-5 py-3 text-right font-semibold sm:pr-7">Saldo diário</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowReport.days.map((day) => (
                    <tr key={day.date} className="border-t border-[#f0ece5]">
                      <td className="px-5 py-4 font-medium text-[#342d27] sm:px-7">
                        {formatDate(day.date)}
                      </td>
                      <td className="px-5 py-4 text-right text-emerald-700">
                        {formatValue(day.entries)}
                      </td>
                      <td className="px-5 py-4 text-right text-red-600">
                        {formatValue(day.exits)}
                      </td>
                      <td className={`px-5 py-4 text-right font-semibold sm:pr-7 ${day.balance < 0 ? "text-red-600" : "text-emerald-700"}`}>
                        {formatValue(day.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>

      {/* Comparação de períodos */}
      <Section
        title="Comparação de períodos"
        description="Compare o período selecionado com o intervalo imediatamente anterior de mesma duração"
      >
        {validPeriod && (
          <p className="mb-5 text-xs text-stone-500">
            Período atual: {formatDate(period.startDate)} a {formatDate(period.endDate)}
            {" · "}
            Período anterior: {formatDate(getPreviousPeriod(period).startDate)} a {formatDate(getPreviousPeriod(period).endDate)}
          </p>
        )}

        {comparisonError && !loading ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Não foi possível consultar a comparação de períodos.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {([
              { label: "Faturamento", key: "revenue" as const, variation: "revenuePercentage" as const, icon: ShoppingBag },
              { label: "Despesas", key: "expenses" as const, variation: "expensesPercentage" as const, icon: CircleDollarSign },
              { label: "Lucro previsto", key: "profit" as const, variation: "profitPercentage" as const, icon: TrendingUp },
            ]).map((item) => {
              const Icon = item.icon;
              const variation = comparisonReport?.variations[item.variation];
              return (
                <div key={item.key} className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#342d27]">{item.label}</h3>
                    <Icon className="h-5 w-5 text-[#a98a58]" />
                  </div>
                  <div className="mt-5 space-y-3">
                    <div>
                      <p className="text-xs text-stone-400">Período atual</p>
                      <Value
                        value={comparisonReport?.currentPeriod[item.key]}
                        loading={loading}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">Período anterior</p>
                      <p className="mt-1 text-base font-semibold text-stone-600">
                        <Value value={comparisonReport?.previousPeriod[item.key]} loading={loading} />
                      </p>
                    </div>
                    <div className="border-t border-[#f0ece5] pt-3">
                      <p className="text-xs text-stone-400">Variação</p>
                      <p className={`mt-1 text-base font-semibold ${variation == null ? "text-stone-500" : variation >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        <Value value={variation} loading={loading} format="percentage" />
                      </p>
                      {!loading && variation == null && !comparisonError && (
                        <p className="mt-1 text-xs text-stone-400">Sem base anterior para calcular a variação.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Detalhamento */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-7">
          <h2 className="text-base font-semibold text-[#342d27]">
            Como o resultado é calculado?
          </h2>

          <p className="mt-1 text-xs text-stone-400">
            Comparação entre o que está previsto e o que já foi recebido ou pago
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm font-semibold text-[#342d27]">
              Lucro líquido previsto
            </p>

            <div
              className={`mt-4 text-2xl font-bold ${
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

            <p className="mt-3 text-xs leading-5 text-stone-500">
              Faturamento total menos todas as despesas previstas.
            </p>
          </div>

          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm font-semibold text-[#342d27]">
              Lucro líquido realizado
            </p>

            <div
              className={`mt-4 text-2xl font-bold ${
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

            <p className="mt-3 text-xs leading-5 text-stone-500">
              Valores recebidos das vendas menos despesas já pagas.
            </p>
          </div>
        </div>
      </section>

      {/* Futuras integrações */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#f7f2e9] p-2.5">
            <ChartNoAxesCombined className="h-5 w-5 text-[#a98a58]" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#342d27]">
              Próximas análises
            </h2>

            <p className="mt-1 text-xs text-stone-400">
              Funcionalidades que serão integradas posteriormente
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[
            {
              title: "Exportação",
              description:
                "Geração de relatórios em PDF e Excel.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[#ece6dc] bg-[#faf8f5] p-5"
            >
              <p className="text-sm font-semibold text-[#342d27]">
                {item.title}
              </p>

              <p className="mt-2 text-xs leading-5 text-stone-500">
                {item.description}
              </p>

              <span className="mt-4 inline-block text-xs font-medium text-[#a98a58]">
                Em desenvolvimento
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Rodapé */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e9e2d8] pt-6">
        <p className="max-w-2xl text-xs leading-5 text-stone-400">
          Os indicadores consideram os valores atuais das operações
          registradas no período. As movimentações utilizam datas
          de referência, não necessariamente as datas em que os
          pagamentos ocorreram.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#a98a58] hover:text-[#927448]"
        >
          Voltar ao início
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </DashboardLayout>
  );
}