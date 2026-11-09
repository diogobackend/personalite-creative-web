
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import type { ElementType } from "react";

import DashboardLayout from "../src/components/layout/DashboardLayout";
import {
  getReportOverview,
  getSalesReport,
  type ReportOverview,
  type SalesReport,
} from "../src/services/reportService";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string;
  value: string;
  icon: ElementType;
  description: string;
  loading: boolean;
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

      {loading ? (
        <div className="mt-5 h-9 w-36 animate-pulse rounded-lg bg-stone-100" />
      ) : (
        <p className="mt-5 text-2xl font-bold tracking-tight text-[#342d27] sm:text-[28px]">
          {value}
        </p>
      )}

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
  value: number | null;
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

export default function HomePage() {
  const [overview, setOverview] =
    useState<ReportOverview | null>(null);

  const [salesReport, setSalesReport] =
    useState<SalesReport | null>(null);

  const [loading, setLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(false);
  const [salesError, setSalesError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState("");

  useEffect(() => {
    setCurrentMonth(
      new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      const results = await Promise.allSettled([
        getReportOverview(),
        getSalesReport(),
      ]);

      if (!active) return;

      const [overviewResult, salesResult] = results;

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

      setLoading(false);
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const refresh = () => {
    setLoading(true);
    setOverviewError(false);
    setSalesError(false);
    setReloadKey((current) => current + 1);
  };

  const financialValue = (
    value: number | null | undefined,
  ): string =>
    value === null || value === undefined
      ? "—"
      : formatCurrency(value);

  const numberValue = (
    value: number | null | undefined,
  ): string =>
    value === null || value === undefined
      ? "—"
      : new Intl.NumberFormat("pt-BR").format(value);

  const percentageValue = (
    value: number | null | undefined,
  ): string =>
    value === null || value === undefined
      ? "—"
      : formatPercentage(value);

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
            Indicadores financeiros e comerciais do mês atual
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
      {(overviewError || salesError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm text-red-700">
            {overviewError && salesError
              ? "Não foi possível carregar os relatórios."
              : overviewError
                ? "Não foi possível carregar o resumo financeiro."
                : "Não foi possível carregar os indicadores de vendas."}
          </p>

          <button
            type="button"
            onClick={refresh}
            className="text-sm font-semibold text-red-700 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Indicadores financeiros */}
      <section>
        <div className="mb-5">
          <h2 className="text-base font-semibold text-[#342d27]">
            Visão financeira
          </h2>

          <p className="mt-1 text-xs text-stone-400">
            Principais indicadores financeiros do mês
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Faturamento previsto"
            value={financialValue(overview?.expectedRevenue)}
            icon={Wallet}
            description="Valor total das vendas do mês"
            loading={loading}
          />

          <MetricCard
            title="Resultado realizado"
            value={financialValue(overview?.realizedProfit)}
            icon={TrendingUp}
            description="Recebimentos menos pagamentos"
            loading={loading}
          />

          <MetricCard
            title="Receita recebida"
            value={financialValue(overview?.receivedRevenue)}
            icon={ShoppingBag}
            description="Valores recebidos das vendas"
            loading={loading}
          />

          <MetricCard
            title="Despesas previstas"
            value={financialValue(overview?.expectedExpenses)}
            icon={CircleDollarSign}
            description="Compromissos financeiros do mês"
            loading={loading}
          />
        </div>
      </section>

      {/* Indicadores de vendas */}
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#342d27]">
              Desempenho de vendas
            </h2>

            <p className="mt-1 text-xs text-stone-400">
              Indicadores comerciais do mês atual
            </p>
          </div>

          <Link
            href="/relatorios"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#a98a58] hover:text-[#927448]"
          >
            Ver relatórios
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Quantidade de vendas"
            value={numberValue(salesReport?.totalSales)}
            icon={ReceiptText}
            description="Total de vendas registradas no mês"
            loading={loading}
          />

          <MetricCard
            title="Faturamento total"
            value={financialValue(salesReport?.totalRevenue)}
            icon={ShoppingBag}
            description="Valor total das vendas realizadas"
            loading={loading}
          />

          <MetricCard
            title="Ticket médio"
            value={financialValue(salesReport?.averageTicket)}
            icon={Wallet}
            description="Valor médio por venda"
            loading={loading}
          />

          <MetricCard
            title="Percentual recebido"
            value={percentageValue(salesReport?.receivedPercentage)}
            icon={Percent}
            description="Percentual do faturamento já recebido"
            loading={loading}
          />
        </div>
      </section>

      {/* Vendas e resumo financeiro */}
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        {/* Detalhamento das vendas */}
        <section className="min-w-0 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#342d27]">
                Recebimentos de vendas
              </h2>

              <p className="mt-1 text-xs text-stone-400">
                Situação dos recebimentos das vendas do mês
              </p>
            </div>

            <div className="rounded-xl bg-[#f7f2e9] p-3">
              <ChartNoAxesCombined className="h-5 w-5 text-[#a98a58]" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#faf8f5] p-5">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                <p className="text-sm text-stone-500">
                  Total recebido
                </p>
              </div>

              {loading ? (
                <div className="mt-4 h-8 w-32 animate-pulse rounded bg-stone-200" />
              ) : (
                <p className="mt-4 text-2xl font-bold text-emerald-700">
                  {financialValue(salesReport?.receivedAmount)}
                </p>
              )}

              <p className="mt-3 text-xs text-stone-400">
                Valores já recebidos das vendas
              </p>
            </div>

            <div className="rounded-xl bg-[#faf8f5] p-5">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-stone-500">
                  Total a receber
                </p>
              </div>

              {loading ? (
                <div className="mt-4 h-8 w-32 animate-pulse rounded bg-stone-200" />
              ) : (
                <p className="mt-4 text-2xl font-bold text-[#342d27]">
                  {financialValue(salesReport?.outstandingAmount)}
                </p>
              )}

              <p className="mt-3 text-xs text-stone-400">
                Valores pendentes de recebimento
              </p>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-stone-500">
                Progresso de recebimento
              </span>

              <span className="text-xs font-semibold text-[#342d27]">
                {percentageValue(salesReport?.receivedPercentage)}
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Percentual recebido das vendas"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                salesReport
                  ? Math.min(
                      100,
                      Math.max(0, salesReport.receivedPercentage),
                    )
                  : undefined
              }
              className="h-3 overflow-hidden rounded-full bg-[#f0ece5]"
            >
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{
                  width: `${
                    salesReport
                      ? Math.min(
                          100,
                          Math.max(0, salesReport.receivedPercentage),
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              href="/relatorios"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#a98a58] hover:text-[#927448]"
            >
              Ver relatório completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Resumo financeiro */}
        <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h2 className="text-base font-semibold text-[#342d27]">
              Resumo financeiro
            </h2>

            <p className="mt-1 text-xs text-stone-400">
              Situação das operações registradas no mês
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <FinancialRow
              title="Receita prevista"
              value={overview?.expectedRevenue ?? null}
              icon={ArrowUpRight}
              color="green"
              loading={loading}
            />

            <FinancialRow
              title="Receita recebida"
              value={overview?.receivedRevenue ?? null}
              icon={Wallet}
              color="green"
              loading={loading}
            />

            <FinancialRow
              title="Valores a receber"
              value={overview?.outstandingRevenue ?? null}
              icon={ShoppingBag}
              color="amber"
              loading={loading}
            />

            <div className="border-t border-[#ece6dc] pt-5">
              <FinancialRow
                title="Despesas previstas"
                value={overview?.expectedExpenses ?? null}
                icon={Package}
                color="amber"
                loading={loading}
              />
            </div>

            <FinancialRow
              title="Despesas pagas"
              value={overview?.paidExpenses ?? null}
              icon={ArrowDownRight}
              color="red"
              loading={loading}
            />

            <FinancialRow
              title="Valores a pagar"
              value={overview?.outstandingExpenses ?? null}
              icon={CircleDollarSign}
              color="red"
              loading={loading}
            />

            <div className="border-t border-[#ece6dc] pt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#342d27]">
                  Resultado realizado
                </span>

                {loading ? (
                  <div className="h-7 w-28 animate-pulse rounded bg-stone-100" />
                ) : (
                  <span
                    className={`text-xl font-bold ${
                      overview
                        ? overview.realizedProfit >= 0
                          ? "text-emerald-700"
                          : "text-red-600"
                        : "text-stone-400"
                    }`}
                  >
                    {financialValue(overview?.realizedProfit)}
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-stone-400">
                Valores recebidos − valores pagos
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-[#faf8f5] px-4 py-3">
              <span className="text-xs font-medium text-stone-500">
                Resultado previsto
              </span>

              <span className="text-sm font-semibold text-[#342d27]">
                {loading
                  ? "Carregando..."
                  : financialValue(overview?.expectedProfit)}
              </span>
            </div>
          </div>
        </section>
      </div>

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
            A evolução mensal estará disponível após a integração
            do relatório histórico.
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
              Últimas movimentações registradas
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