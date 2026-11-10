
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ElementType, ReactNode } from "react";
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
} from "lucide-react";

import DashboardLayout from "../src/components/layout/DashboardLayout";
import Loading from "../src/components/layout/Loading";

import {
  getReportOverview,
  getSalesReport,
  getExpensesReport,
  getTransactionsReport,
  getCashFlowReport,
  type ReportOverview,
  type SalesReport,
  type ExpensesReport,
  type ReportTransactions,
  type ReportCashFlow,
} from "../src/services/reportService";

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

  const [loading, setLoading] = useState(true);

  const [overviewError, setOverviewError] = useState(false);
  const [salesError, setSalesError] = useState(false);
  const [expensesError, setExpensesError] = useState(false);
  const [transactionsError, setTransactionsError] = useState(false);
  const [cashFlowError, setCashFlowError] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState("");

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
      ]);

      if (!active) return;

      const [
        overviewResult,
        salesResult,
        expensesResult,
        transactionsResult,
        cashFlowResult,
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
    setReloadKey((current) => current + 1);
  };

  const failedReports = [
    overviewError ? "resumo financeiro" : null,
    salesError ? "vendas" : null,
    expensesError ? "despesas" : null,
    transactionsError ? "movimentações" : null,
    cashFlowError ? "fluxo de caixa" : null,
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

      {/* Evolução histórica */}
      <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#342d27]">
              Evolução do faturamento
            </h2>

            <p className="mt-1 text-xs text-stone-400">
              Comparativo dos últimos 6 meses
            </p>
          </div>

          <span className="rounded-lg border border-[#ece6dc] px-3 py-2 text-xs text-stone-500">
            Últimos 6 meses
          </span>
        </div>

        <div className="flex min-h-[160px] flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-2xl bg-[#f7f2e9] p-4">
            <ChartNoAxesCombined className="h-7 w-7 text-[#a98a58]" />
          </div>

          <p className="text-sm text-stone-500">
            O histórico mensal ficará disponível após a integração
            do relatório de comparação.
          </p>
        </div>
      </section>

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