"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Package, Pencil, Plus , Eye } from "lucide-react";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";
import { api } from "../../../src/lib/api";

type Category = "GOURMET" | "AGUAS" | "GARRAFAS" | "GLOSS" | "BOLSAS" | "NECESSAIRES" | "LENCOS" | "PAPELARIA" | "CAIXAS" | "KITS";
type PricingType = "FIXED" | "TIERED" | "QUOTE";
type ChargeType = "PER_ORDER" | "PER_UNIT" | "FIRST_PURCHASE";

type ProductPrice = {
  id: string;
  minimumQuantity: number;
  unitPrice: number;
  createdAt: string | null;
  updatedAt: string | null;
};
type ProductFee = {
  id: string;
  name: string;
  amount: number;
  chargeType: ChargeType;
  required: boolean;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};
type Product = {
  id: string;
  code: string;
  name: string;
  category: Category;
  description: string | null;
  minimumQuantity: number | null;
  pricingType: PricingType;
  shelfLifeDays: number | null;
  productionLeadTimeMinDays: number | null;
  productionLeadTimeMaxDays: number | null;
  active: boolean;
  prices: ProductPrice[];
  fees: ProductFee[];
  createdAt: string | null;
  updatedAt: string | null;
};

type ExpenseStatus = "PENDING" | "PAID" | "CANCELLED";
type Expense = {
  id: string;
  name: string;
  value: number;
  status: ExpenseStatus;
  expenseDate: string;
  products: { productId: string; allocatedValue: number }[];
};
type ExpensePage = {
  content: Expense[];
  totalPages: number;
};
type ProductExpense = {
  id: string;
  name: string;
  status: ExpenseStatus;
  expenseDate: string;
  allocatedValue: number;
};
const expenseStatusLabels: Record<ExpenseStatus, string> = {
  PENDING: "Pendente", PAID: "Pago", CANCELLED: "Cancelado",
};
const expenseStatusClasses: Record<ExpenseStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};
const expenseDate = (date: string) => {
  const [year, month, day] = date.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "—";
};

const categories: Record<Category, string> = {
  GOURMET: "Gourmet", AGUAS: "Águas", GARRAFAS: "Garrafas", GLOSS: "Gloss",
  BOLSAS: "Bolsas", NECESSAIRES: "Necessaires", LENCOS: "Lenços",
  PAPELARIA: "Papelaria", CAIXAS: "Caixas", KITS: "Kits",
};
const pricingTypes: Record<PricingType, string> = {
  FIXED: "Preço fixo", TIERED: "Por quantidade", QUOTE: "Sob consulta",
};
const chargeTypes: Record<ChargeType, string> = {
  PER_ORDER: "Por pedido", PER_UNIT: "Por unidade", FIRST_PURCHASE: "Primeira compra",
};
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR");
const display = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const yesNo = (value: boolean) => value ? "Sim" : "Não";
function Detail({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-[#eee8df] bg-[#fdfcfb] px-4 py-4">
    <dt className="mb-2 text-xs font-semibold text-stone-500">{label}</dt>
    <dd className="break-words whitespace-pre-wrap text-sm font-medium text-[#342d27]">{value}</dd>
  </div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section>
    <h3 className="mb-4 text-sm font-semibold text-[#342d27]">{title}</h3>
    {children}
  </section>;
}
function getError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) return "Produto não encontrado.";
    if (error.response?.status === 401) return "Sessão expirada ou inválida. Faça login novamente.";
    if (error.response?.status === 403) return "Você não possui permissão para visualizar este produto.";
    if (!error.response) return "Não foi possível conectar ao servidor.";
    return typeof error.response.data?.message === "string"
      ? error.response.data.message
      : `Não foi possível carregar o produto (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : "Erro inesperado ao carregar o produto.";
}

function ProductDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [expenses, setExpenses] = useState<ProductExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [expenseName, setExpenseName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [valueFrom, setValueFrom] = useState("");
  const [valueTo, setValueTo] = useState("");


  useEffect(() => {
    if (!id) { setLoading(false); setError("ID do produto não informado."); return; }
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") {
          throw new Error("Sessão não encontrada. Faça login novamente.");
        }
        const { data } = await api.get<Product>(`/products/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setProduct(data);
      } catch (cause) {
        if (!controller.signal.aborted) { setProduct(null); setError(getError(cause)); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, reloadKey]);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    async function loadExpenses() {
      setExpensesLoading(true);
      setExpensesError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") {
          throw new Error("Sessão não encontrada. Faça login novamente.");
        }
        const headers = { Authorization: `Bearer ${token}` };
        const collected: ProductExpense[] = [];
        let page = 0;
        let totalPages = 1;
        do {
          const { data } = await api.get<ExpensePage>("/expenses", {
            headers,
            params: { page, size: 100 },
            signal: controller.signal,
          });
          for (const expense of data.content ?? []) {
            const allocation = expense.products?.find((item) => item.productId === id);
            if (allocation) {
              collected.push({
                id: expense.id,
                name: expense.name,
                status: expense.status,
                expenseDate: expense.expenseDate,
                allocatedValue: Number(allocation.allocatedValue),
              });
            }
          }
          totalPages = data.totalPages ?? 1;
          page += 1;
        } while (page < totalPages && !controller.signal.aborted);
        if (!controller.signal.aborted) {
          setExpenses(collected.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)));
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setExpensesError(axios.isAxiosError(cause)
            ? `Não foi possível carregar as despesas${cause.response ? ` (HTTP ${cause.response.status})` : ""}.`
            : cause instanceof Error ? cause.message : "Erro ao carregar despesas.");
        }
      } finally {
        if (!controller.signal.aborted) setExpensesLoading(false);
      }
    }
    void loadExpenses();
    return () => controller.abort();
  }, [id, reloadKey]);

  const filteredExpenses = expenses.filter((expense) => {
    if (expenseName.trim() && !expense.name.toLocaleLowerCase("pt-BR").includes(expenseName.trim().toLocaleLowerCase("pt-BR"))) return false;
    const date = expense.expenseDate.slice(0, 10);
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    if (valueFrom !== "" && expense.allocatedValue < Number(valueFrom)) return false;
    if (valueTo !== "" && expense.allocatedValue > Number(valueTo)) return false;
    return true;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((total, expense) => total + expense.allocatedValue, 0);

  return <DashboardLayout>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link href="/produtos" className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-[#a98a58]">
          <ArrowLeft className="h-4 w-4" /> Voltar para produtos
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {product && !loading && !error && (
          <Link href={`/produtos/${encodeURIComponent(product.id)}/editar`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#927448]">
            <Pencil className="h-4 w-4" /> Editar produto
          </Link>
        )}
      </div>
    </div>

    <div className="mt-7 overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
      {loading ? <p className="px-6 py-16 text-center text-sm text-stone-500">Carregando dados do produto...</p>
      : error ? <div className="px-6 py-16 text-center"><p className="text-sm font-medium text-red-700">{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-4 text-sm font-semibold text-[#a98a58]">Tentar novamente</button>
        </div>
      : product ? <div className="space-y-9 p-5 sm:p-7">
        <div className="flex items-center gap-3 border-b border-[#f0ece5] pb-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f7f0e6] text-[#a98a58]"><Package className="h-6 w-6" /></span>
          <div className="min-w-0"><h2 className="break-words text-lg font-semibold text-[#342d27]">{product.name}</h2>
            <p className="mt-1 text-xs text-stone-500">Código {product.code} · {product.active ? "Ativo" : "Inativo"}</p>
          </div>
        </div>

        <Section title="Informações gerais">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Categoria" value={categories[product.category] ?? product.category} />
            <Detail label="Tipo de precificação" value={pricingTypes[product.pricingType] ?? product.pricingType} />
          </dl>
        </Section>

        
          <dl><Detail label="Descrição" value={display(product.description)} /></dl>
      

        <Section title="Quantidade, validade e produção">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Quantidade mínima" value={product.minimumQuantity == null ? "—" : number.format(product.minimumQuantity)} />
            <Detail label="Validade (dias)" value={display(product.shelfLifeDays)} />
            <Detail label="Prazo mínimo de produção (dias)" value={display(product.productionLeadTimeMinDays)} />
            <Detail
            label="Prazo máximo de produção (dias)"
            value={product.productionLeadTimeMaxDays == null || product.productionLeadTimeMaxDays === 0
                ? "—"
                : display(product.productionLeadTimeMaxDays)}
            />
          </dl>
        </Section>

        <Section title={`Faixas de preço (${product.prices?.length ?? 0})`}>
          {product.prices?.length ? <div className="overflow-x-auto rounded-xl border border-[#eee8df]">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="bg-[#faf9f7] text-xs text-stone-500"><tr>
                <th className="px-4 py-3">Quantidade mínima</th>
                <th className="px-4 py-3">Preço unitário</th>
              </tr></thead>
              <tbody className="divide-y divide-[#f0ece5]">
                {product.prices.map((price) => <tr key={price.id}>
                  <td className="px-4 py-4">{number.format(price.minimumQuantity)}</td>
                  <td className="px-4 py-4 font-semibold">{currency.format(price.unitPrice)}</td>
                </tr>)}
              </tbody>
            </table>
          </div> : <p className="rounded-xl border border-[#eee8df] bg-[#fdfcfb] p-4 text-sm text-stone-500">Nenhuma faixa de preço cadastrada.</p>}
        </Section>

        <Section title={`Taxas adicionais (${product.fees?.length ?? 0})`}>
          {product.fees?.length ? <div className="overflow-x-auto rounded-xl border border-[#eee8df]">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#faf9f7] text-xs text-stone-500"><tr>
                <th className="px-4 py-3">Nome</th><th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Tipo de cobrança</th><th className="px-4 py-3">Obrigatória</th>
                <th className="px-4 py-3">Ativa</th>
              </tr></thead>
              <tbody className="divide-y divide-[#f0ece5]">
                {product.fees.map((fee) => <tr key={fee.id}>
                  <td className="px-4 py-4 font-medium">{display(fee.name)}</td>
                  <td className="px-4 py-4 font-semibold">{currency.format(fee.amount)}</td>
                  <td className="px-4 py-4">{chargeTypes[fee.chargeType] ?? fee.chargeType}</td>
                  <td className="px-4 py-4">{yesNo(fee.required)}</td>
                  <td className="px-4 py-4">{yesNo(fee.active)}</td>
                </tr>)}
              </tbody>
            </table>
          </div> : <p className="rounded-xl border border-[#eee8df] bg-[#fdfcfb] p-4 text-sm text-stone-500">Nenhuma taxa adicional cadastrada.</p>}
        </Section>

        
<div className="rounded-2xl border border-[#e8d9c4] bg-[#f8f3eb] p-5 sm:p-6">
  <section>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-[#342d27]">
        Histórico de despesas ({filteredExpenses.length})
      </h3>

      <Link
        href="/despesas/nova"
        className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#927448]"
      >
        <Plus className="h-4 w-4" />
        Nova despesa
      </Link>
    </div>

    <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block text-xs font-semibold text-stone-600 sm:col-span-2 lg:col-span-4">
        Nome
        <input
          type="text"
          value={expenseName}
          onChange={(event) => setExpenseName(event.target.value)}
          placeholder="Buscar pelo nome da despesa"
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>

      <label className="block text-xs font-semibold text-stone-600">
        Data da despesa — de
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>

      <label className="block text-xs font-semibold text-stone-600">
        Data da despesa — até
        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>

      <label className="block text-xs font-semibold text-stone-600">
        Valor alocado mínimo (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={valueFrom}
          onChange={(event) => setValueFrom(event.target.value)}
          placeholder="0,00"
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>

      <label className="block text-xs font-semibold text-stone-600">
        Valor alocado máximo (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={valueTo}
          onChange={(event) => setValueTo(event.target.value)}
          placeholder="0,00"
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>
    </div>

    {expensesLoading ? (
      <p className="rounded-xl border border-[#eee8df] p-5 text-sm text-stone-500">
        Carregando despesas...
      </p>
    ) : expensesError ? (
      <div className="rounded-xl border border-red-100 p-5 text-sm text-red-700">
        {expensesError}
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="ml-3 font-semibold underline"
        >
          Tentar novamente
        </button>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-[#eee8df]">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-[#faf9f7] text-xs text-stone-500">
            <tr>
              <th className="px-4 py-3">Despesa</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data da despesa</th>
              <th className="px-4 py-3 text-right">
                Visualizar / Editar
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f0ece5]">
            {filteredExpenses.map((expense) => (
              <tr
                key={expense.id}
                className="odd:bg-white even:bg-[#e9e3da] hover:!bg-[#ded3c4] transition-colors"
              >
                <td className="px-4 py-4 font-medium">
                  <Link
                    href={`/despesas/${encodeURIComponent(expense.id)}`}
                    className="text-[#342d27] hover:text-[#a98a58] hover:underline"
                  >
                    {expense.name}
                  </Link>
                </td>

                <td className="px-4 py-4 font-semibold text-[#342d27]">
                  {currency.format(expense.allocatedValue)}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      expenseStatusClasses[expense.status] ??
                      "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {expenseStatusLabels[expense.status] ?? expense.status}
                  </span>
                </td>

                <td className="px-4 py-4 text-[#51473d]">
                  {expenseDate(expense.expenseDate)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/despesas/${encodeURIComponent(expense.id)}`}
                      title="Visualizar despesa"
                      aria-label="Visualizar despesa"
                      className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"
                    >
                      <Eye size={17} />
                    </Link>

                    <Link
                      href={`/despesas/${encodeURIComponent(expense.id)}/editar`}
                      title="Editar despesa"
                      aria-label="Editar despesa"
                      className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"
                    >
                      <Pencil size={17} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-stone-500"
                >
                  Nenhuma despesa encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    {!expensesLoading && !expensesError && (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6d7c2] bg-[#efe4d4] px-5 py-4">
        <span className="text-sm font-semibold text-[#51473d]">
          Total das despesas
        </span>

        <span className="text-xl font-bold text-[#342d27]">
          {currency.format(totalFilteredExpenses)}
        </span>
      </div>
    )}
  </section>
</div>

      </div> : null}
    </div>
  </DashboardLayout>;
}

export default function ProductDetailsPage() {
  return <Suspense fallback={null}><ProductDetailsContent /></Suspense>;
}
