
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ElementType } from "react";
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
import {
  getReportOverview,
  getSalesReport,
  getExpensesReport,
  type ReportOverview,
  type SalesReport,
  type ExpensesReport,
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
    case "today":
      break;

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

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  positive,
  format = "currency",
}: {
  title: string;
  value: number | null;
  description: string;
  icon: ElementType;
  loading: boolean;
  positive?: boolean;
  format?: "currency" | "number" | "percentage";
}) {
  const formattedValue =
    value === null
      ? "—"
      : format === "number"
        ? formatNumber(value)
        : format === "percentage"
          ? formatPercentage(value)
          : formatCurrency(value);

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

      {loading ? (
        <div className="mt-5 h-9 w-36 animate-pulse rounded-lg bg-stone-100" />
      ) : (
        <p
          className={`mt-5 text-2xl font-bold tracking-tight sm:text-[28px] ${
            positive && value !== null
              ? value >= 0
                ? "text-emerald-700"
                : "text-red-600"
              : "text-[#342d27]"
          }`}
        >
          {formattedValue}
        </p>
      )}

      <p className="mt-3 text-xs text-stone-400">
        {description}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  loading,
  highlight = false,
}: {
  label: string;
  value: number | null;
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

      {loading ? (
        <div className="h-5 w-24 animate-pulse rounded bg-stone-100" />
      ) : (
        <span className="shrink-0 text-sm font-semibold text-[#342d27]">
          {value === null ? "—" : formatCurrency(value)}
        </span>
      )}
    </div>
  );
}

function PaymentProgress({
  title,
  percentage,
  loading,
  color = "emerald",
}: {
  title: string;
  percentage: number | null;
  loading: boolean;
  color?: "emerald" | "red";
}) {
  const progress =
    percentage === null
      ? 0
      : Math.min(100, Math.max(0, percentage));

  return (
    <div className="mt-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-stone-500">
          {title}
        </span>

        <span className="text-xs font-semibold text-[#342d27]">
          {loading
            ? "Carregando..."
            : percentage === null
              ? "—"
              : formatPercentage(percentage)}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={
          loading || percentage === null ? undefined : progress
        }
        className="h-3 overflow-hidden rounded-full bg-[#f0ece5]"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            color === "emerald" ? "bg-emerald-600" : "bg-red-500"
          }`}
          style={{ width: `${loading ? 0 : progress}%` }}
        />
      </div>
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

  const [overviewError, setOverviewError] = useState(false);
  const [salesError, setSalesError] = useState(false);
  const [expensesError, setExpensesError] = useState(false);

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
      const results = await Promise.allSettled([
        getReportOverview(period),
        getSalesReport(period),
        getExpensesReport(period),
      ]);

      if (!active) return;

      const [
        overviewResult,
        salesResult,
        expensesResult,
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

      setLoading(false);
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, [initialized, period, reloadKey, validPeriod]);

  const changePreset = (value: PeriodPreset) => {
    setPreset(value);

    if (value !== "custom") {
      setLoading(true);
      setPeriod(getPresetPeriod(value));
    }
  };

  const changeCustomPeriod = (nextPeriod: Period) => {
    setPeriod(nextPeriod);
    setLoading(true);

    if (
      !nextPeriod.startDate ||
      !nextPeriod.endDate ||
      nextPeriod.startDate > nextPeriod.endDate
    ) {
      setOverview(null);
      setSalesReport(null);
      setExpensesReport(null);

      setOverviewError(false);
      setSalesError(false);
      setExpensesError(false);

      setLoading(false);
    }
  };

  const refresh = () => {
    if (!validPeriod || loading) return;

    setLoading(true);
    setReloadKey((value) => value + 1);
  };

  const overviewValue = (
    value: number | undefined
  ): number | null =>
    overview === null ? null : (value ?? null);

  const salesValue = (
    value: number | undefined
  ): number | null =>
    salesReport === null ? null : (value ?? null);

  const expensesValue = (
    value: number | undefined
  ): number | null =>
    expensesReport === null ? null : (value ?? null);

  const hasErrors =
    overviewError || salesError || expensesError;

  const failedReports = [
    overviewError ? "financeiro" : null,
    salesError ? "vendas" : null,
    expensesError ? "despesas" : null,
  ].filter(Boolean);

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
            Acompanhe receitas, despesas, vendas e resultados
            financeiros do negócio.
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
                Selecione o intervalo para consultar os indicadores.
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
            Informe um período válido. A data inicial não pode ser
            posterior à data final.
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
      {hasErrors && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4"
        >
          <p className="text-sm text-red-700">
            Não foi possível carregar:{" "}
            {failedReports.join(", ")}.
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

      {/* Indicadores financeiros */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#342d27]">
            Indicadores financeiros
          </h2>

          <p className="mt-1 text-xs text-stone-400">
            Valores das operações registradas no período selecionado.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Receita prevista"
            value={overviewValue(overview?.expectedRevenue)}
            description="Total de vendas registradas"
            icon={Wallet}
            loading={loading}
          />

          <MetricCard
            title="Receita recebida"
            value={overviewValue(overview?.receivedRevenue)}
            description="Valor já recebido das vendas"
            icon={ArrowUpRight}
            loading={loading}
          />

          <MetricCard
            title="Valores a receber"
            value={overviewValue(overview?.outstandingRevenue)}
            description="Saldo pendente das vendas"
            icon={Clock3}
            loading={loading}
          />

          <MetricCard
            title="Despesas previstas"
            value={overviewValue(overview?.expectedExpenses)}
            description="Obrigações financeiras consideradas"
            icon={CircleDollarSign}
            loading={loading}
          />

          <MetricCard
            title="Despesas pagas"
            value={overviewValue(overview?.paidExpenses)}
            description="Pagamentos registrados"
            icon={ArrowDownRight}
            loading={loading}
          />

          <MetricCard
            title="Valores a pagar"
            value={overviewValue(overview?.outstandingExpenses)}
            description="Saldo pendente das despesas"
            icon={Clock3}
            loading={loading}
          />

          <MetricCard
            title="Resultado previsto"
            value={overviewValue(overview?.expectedProfit)}
            description="Receita prevista menos despesas previstas"
            icon={TrendingUp}
            loading={loading}
            positive
          />

          <MetricCard
            title="Resultado realizado"
            value={overviewValue(overview?.realizedProfit)}
            description="Recebimentos menos pagamentos"
            icon={ChartNoAxesCombined}
            loading={loading}
            positive
          />
        </div>
      </section>

      {/* Indicadores de vendas */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#342d27]">
            Indicadores de vendas
          </h2>

          <p className="mt-1 text-xs text-stone-400">
            Desempenho comercial no período selecionado.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Quantidade de vendas"
            value={salesValue(salesReport?.totalSales)}
            description="Total de vendas registradas"
            icon={ReceiptText}
            loading={loading}
            format="number"
          />

          <MetricCard
            title="Faturamento total"
            value={salesValue(salesReport?.totalRevenue)}
            description="Valor total das vendas"
            icon={ShoppingBag}
            loading={loading}
          />

          <MetricCard
            title="Ticket médio"
            value={salesValue(salesReport?.averageTicket)}
            description="Valor médio por venda"
            icon={Wallet}
            loading={loading}
          />

          <MetricCard
            title="Percentual recebido"
            value={salesValue(salesReport?.receivedPercentage)}
            description="Percentual do faturamento recebido"
            icon={Percent}
            loading={loading}
            format="percentage"
          />
        </div>
      </section>

      {/* Recebimentos de vendas */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#f7f2e9] p-2.5">
            <ShoppingBag className="h-5 w-5 text-[#a98a58]" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#342d27]">
              Recebimentos de vendas
            </h2>

            <p className="mt-1 text-xs text-stone-400">
              Valores recebidos e pendentes das vendas registradas.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm text-stone-500">
              Total recebido
            </p>

            <p className="mt-3 text-2xl font-bold text-emerald-700">
              {loading
                ? "Carregando..."
                : salesReport
                  ? formatCurrency(salesReport.receivedAmount)
                  : "—"}
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Valor já recebido das vendas
            </p>
          </div>

          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm text-stone-500">
              Total a receber
            </p>

            <p className="mt-3 text-2xl font-bold text-[#342d27]">
              {loading
                ? "Carregando..."
                : salesReport
                  ? formatCurrency(salesReport.outstandingAmount)
                  : "—"}
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Saldo pendente das vendas
            </p>
          </div>
        </div>

        <PaymentProgress
          title="Progresso de recebimento"
          percentage={salesValue(salesReport?.receivedPercentage)}
          loading={loading}
          color="emerald"
        />
      </section>

      {/* Indicadores de despesas */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#342d27]">
            Indicadores de despesas
          </h2>

          <p className="mt-1 text-xs text-stone-400">
            Controle dos compromissos financeiros registrados no período.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Quantidade de despesas"
            value={expensesValue(expensesReport?.totalExpenses)}
            description="Total de despesas registradas"
            icon={ReceiptText}
            loading={loading}
            format="number"
          />

          <MetricCard
            title="Despesas previstas"
            value={expensesValue(expensesReport?.expectedAmount)}
            description="Valor total das despesas"
            icon={CircleDollarSign}
            loading={loading}
          />

          <MetricCard
            title="Despesas pagas"
            value={expensesValue(expensesReport?.paidAmount)}
            description="Valor já pago"
            icon={ArrowDownRight}
            loading={loading}
          />

          <MetricCard
            title="Valores pendentes"
            value={expensesValue(expensesReport?.outstandingAmount)}
            description="Saldo restante para pagamento"
            icon={Clock3}
            loading={loading}
          />

          <MetricCard
            title="Despesas pendentes"
            value={expensesValue(expensesReport?.pendingExpenses)}
            description="Despesas com pagamento incompleto"
            icon={ReceiptText}
            loading={loading}
            format="number"
          />

          <MetricCard
            title="Percentual pago"
            value={expensesValue(expensesReport?.paidPercentage)}
            description="Percentual das despesas já quitado"
            icon={Percent}
            loading={loading}
            format="percentage"
          />
        </div>
      </section>

      {/* Pagamentos de despesas */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-2.5">
            <ArrowDownRight className="h-5 w-5 text-red-500" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#342d27]">
              Pagamentos de despesas
            </h2>

            <p className="mt-1 text-xs text-stone-400">
              Acompanhamento dos valores pagos e pendentes.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm text-stone-500">
              Total pago
            </p>

            <p className="mt-3 text-2xl font-bold text-emerald-700">
              {loading
                ? "Carregando..."
                : expensesReport
                  ? formatCurrency(expensesReport.paidAmount)
                  : "—"}
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Valor já pago das despesas
            </p>
          </div>

          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm text-stone-500">
              Total a pagar
            </p>

            <p className="mt-3 text-2xl font-bold text-[#342d27]">
              {loading
                ? "Carregando..."
                : expensesReport
                  ? formatCurrency(expensesReport.outstandingAmount)
                  : "—"}
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Saldo pendente das despesas
            </p>
          </div>
        </div>

        <PaymentProgress
          title="Progresso de pagamento"
          percentage={expensesValue(expensesReport?.paidPercentage)}
          loading={loading}
          color="red"
        />
      </section>

      {/* Resumos financeiros */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#342d27]">
                Receitas
              </h2>

              <p className="mt-1 text-xs text-stone-400">
                Situação financeira das vendas
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <SummaryRow
              label="Faturamento previsto"
              value={overviewValue(overview?.expectedRevenue)}
              loading={loading}
            />

            <SummaryRow
              label="Total recebido"
              value={overviewValue(overview?.receivedRevenue)}
              loading={loading}
            />

            <SummaryRow
              label="Pendente de recebimento"
              value={overviewValue(overview?.outstandingRevenue)}
              loading={loading}
              highlight
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2.5">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#342d27]">
                Despesas
              </h2>

              <p className="mt-1 text-xs text-stone-400">
                Situação dos compromissos financeiros
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <SummaryRow
              label="Total previsto"
              value={expensesValue(expensesReport?.expectedAmount)}
              loading={loading}
            />

            <SummaryRow
              label="Total pago"
              value={expensesValue(expensesReport?.paidAmount)}
              loading={loading}
            />

            <SummaryRow
              label="Pendente de pagamento"
              value={expensesValue(expensesReport?.outstandingAmount)}
              loading={loading}
              highlight
            />
          </div>
        </section>
      </div>

      {/* Resultado financeiro */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#f7f2e9] p-2.5">
            <TrendingUp className="h-5 w-5 text-[#a98a58]" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#342d27]">
              Resultado financeiro
            </h2>

            <p className="mt-1 text-xs text-stone-400">
              Comparação entre os valores previstos e realizados
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm text-stone-500">
              Resultado previsto
            </p>

            <p
              className={`mt-3 text-2xl font-bold ${
                overview
                  ? overview.expectedProfit >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                  : "text-[#342d27]"
              }`}
            >
              {loading
                ? "Carregando..."
                : overview
                  ? formatCurrency(overview.expectedProfit)
                  : "—"}
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Receita prevista − despesas previstas
            </p>
          </div>

          <div className="rounded-xl bg-[#faf8f5] p-5">
            <p className="text-sm text-stone-500">
              Resultado realizado
            </p>

            <p
              className={`mt-3 text-2xl font-bold ${
                overview
                  ? overview.realizedProfit >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                  : "text-[#342d27]"
              }`}
            >
              {loading
                ? "Carregando..."
                : overview
                  ? formatCurrency(overview.realizedProfit)
                  : "—"}
            </p>

            <p className="mt-2 text-xs text-stone-400">
              Receita recebida − despesas pagas
            </p>
          </div>
        </div>
      </section>

      {/* Próximos relatórios */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#f7f2e9] p-2.5">
            <ChartNoAxesCombined className="h-5 w-5 text-[#a98a58]" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#342d27]">
              Análises detalhadas
            </h2>

            <p className="mt-1 text-xs text-stone-400">
              Recursos previstos para as próximas integrações.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Evolução financeira",
              description:
                "Gráficos de receitas e despesas ao longo do tempo.",
            },
            {
              title: "Movimentações",
              description:
                "Histórico detalhado de entradas e saídas.",
            },
            {
              title: "Exportações",
              description:
                "Relatórios em PDF e Excel.",
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
          Os indicadores consideram o estado atual das operações
          registradas no período. O fluxo de caixa por data efetiva
          de pagamento será disponibilizado em relatório específico.
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
