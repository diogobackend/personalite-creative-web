"use client";

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
} from "lucide-react";
import DashboardLayout from "../src/components/layout/DashboardLayout";

const sales = [
  {
    id: "#PC-1048",
    customer: "Mariana Costa",
    product: "Kit personalizado premium",
    date: "18 out, 2026",
    amount: "R$ 289,90",
    status: "Concluída",
    statusClass: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "#PC-1047",
    customer: "Ana Beatriz",
    product: "Caixa personalizada",
    date: "17 out, 2026",
    amount: "R$ 159,00",
    status: "Em produção",
    statusClass: "bg-amber-50 text-amber-700",
  },
  {
    id: "#PC-1046",
    customer: "Empresa Aurora",
    product: "Brindes corporativos",
    date: "16 out, 2026",
    amount: "R$ 1.250,00",
    status: "Concluída",
    statusClass: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "#PC-1045",
    customer: "Camila Ferreira",
    product: "Kit presente especial",
    date: "15 out, 2026",
    amount: "R$ 219,90",
    status: "Pendente",
    statusClass: "bg-stone-100 text-stone-600",
  },
];

const monthlyRevenue = [
  { month: "Mai", value: 36 },
  { month: "Jun", value: 52 },
  { month: "Jul", value: 43 },
  { month: "Ago", value: 69 },
  { month: "Set", value: 61 },
  { month: "Out", value: 86 },
];

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  positive = true,
  description,
}: {
  title: string;
  value: string;
  change: string;
  icon: typeof Wallet;
  positive?: boolean;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{title}</p>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7f2e9]">
          <Icon className="h-5 w-5 text-[#a98a58]" />
        </div>
      </div>

      <p className="mt-5 text-2xl font-bold tracking-tight text-[#342d27] sm:text-[28px]">
        {value}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
            positive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {positive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {change}
        </span>

        <span className="text-xs text-stone-400">{description}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <DashboardLayout>
          {/* Boas-vindas */}
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-[#a98a58]">
                Painel de controle
              </p>

              <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
                Visão geral
              </h1>

              <p className="mt-2 text-sm text-stone-500">
                Acompanhe o desempenho e as atividades do seu negócio.
              </p>
            </div>

            <Link
              href="/vendas"
              className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#927448]"
            >
              <Plus className="h-4 w-4" />
              Nova venda
            </Link>
          </div>

          {/* Aviso de demonstração */}
          <div className="rounded-xl border border-[#e9dfcc] bg-[#f6f0e5] px-4 py-3 text-xs text-[#866d46]">
            Prévia do dashboard — os valores apresentados são ilustrativos.
            A integração com os módulos financeiros será realizada posteriormente.
          </div>

          {/* Indicadores */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Faturamento"
              value="R$ 12.450,00"
              change="+12,8%"
              icon={Wallet}
              description="vs. mês anterior"
            />

            <MetricCard
              title="Lucro líquido"
              value="R$ 4.280,00"
              change="+8,2%"
              icon={TrendingUp}
              description="vs. mês anterior"
            />

            <MetricCard
              title="Vendas realizadas"
              value="48"
              change="+16,5%"
              icon={ShoppingBag}
              description="vs. mês anterior"
            />

            <MetricCard
              title="Despesas operacionais"
              value="R$ 2.150,00"
              change="+5,3%"
              icon={CircleDollarSign}
              positive={false}
              description="vs. mês anterior"
            />
          </div>

          {/* Gráfico + Resumo */}
          <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
            {/* Gráfico */}
            <section className="min-w-0 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">
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

              <div className="mt-10 flex h-[230px] items-end justify-between gap-3 border-b border-[#ece6dc] pb-1 sm:gap-6">
                {monthlyRevenue.map((item, index) => (
                  <div
                    key={item.month}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3"
                  >
                    <div
                      className={`w-full max-w-[64px] rounded-t-lg transition-all ${
                        index === monthlyRevenue.length - 1
                          ? "bg-[#a98a58]"
                          : "bg-[#e9dfcc] hover:bg-[#cbb58e]"
                      }`}
                      style={{ height: `${item.value}%` }}
                      title={`${item.month}: valor ilustrativo`}
                    />

                    <span className="text-xs text-stone-400">
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Resumo */}
            <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
              <div>
                <h2 className="text-base font-semibold">
                  Resumo financeiro
                </h2>

                <p className="mt-1 text-xs text-stone-400">
                  Resultado estimado do mês
                </p>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-2.5">
                      <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    </div>

                    <span className="text-sm text-stone-500">
                      Receita de vendas
                    </span>
                  </div>

                  <span className="text-sm font-semibold">
                    R$ 12.450,00
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-50 p-2.5">
                      <Package className="h-5 w-5 text-amber-600" />
                    </div>

                    <span className="text-sm text-stone-500">
                      Custos de produção
                    </span>
                  </div>

                  <span className="text-sm font-semibold">
                    R$ 6.020,00
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-red-50 p-2.5">
                      <ArrowDownRight className="h-5 w-5 text-red-500" />
                    </div>

                    <span className="text-sm text-stone-500">
                      Despesas operacionais
                    </span>
                  </div>

                  <span className="text-sm font-semibold">
                    R$ 2.150,00
                  </span>
                </div>

                <div className="border-t border-[#ece6dc] pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      Lucro líquido
                    </span>

                    <span className="text-xl font-bold text-emerald-700">
                      R$ 4.280,00
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-stone-400">
                    Receita − custos − despesas
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Vendas recentes */}
          <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-7">
              <div>
                <h2 className="text-base font-semibold">
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

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-y border-[#f0ece5] bg-[#faf9f7]">
                  <tr className="text-xs font-medium text-stone-500">
                    <th className="px-7 py-4">Pedido</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Produto</th>
                    <th className="px-5 py-4">Data</th>
                    <th className="px-5 py-4">Valor</th>
                    <th className="px-7 py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ece5]">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="text-sm transition-colors hover:bg-[#faf9f7]"
                    >
                      <td className="px-7 py-4 font-semibold text-[#a98a58]">
                        {sale.id}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {sale.customer}
                      </td>

                      <td className="px-5 py-4 text-stone-500">
                        {sale.product}
                      </td>

                      <td className="px-5 py-4 text-stone-500">
                        {sale.date}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {sale.amount}
                      </td>

                      <td className="px-7 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${sale.statusClass}`}
                        >
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
