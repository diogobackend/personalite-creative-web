"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Boxes, Pencil, RefreshCw, Eye, Plus } from "lucide-react";

import { api } from "../../../src/lib/api";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";

type Inventory = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  productId: string | null;
  quantity: number;
  minimumQuantity: number | null;
  unit: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  createdAt: string;
  updatedAt: string;
};

type Expense = {
  id: string;
  inventoryId: string | null;
  name: string;
  value: number;
  quantity: number | null;
  status: string;
  expenseDate: string;
};

type ExpensePage = {
  content: Expense[];
  totalPages: number;
};

const CATEGORIES: Record<string, string> = {
  GOURMET: "Gourmet", AGUAS: "Águas", GARRAFAS: "Garrafas", GLOSS: "Gloss",
  BOLSAS: "Bolsas", NECESSAIRES: "Necessaires", LENCOS: "Lenços",
  PAPELARIA: "Papelaria", CAIXAS: "Caixas", KITS: "Kits",
};

const UNITS: Record<string, string> = {
  UN: "Unidade (un)", PAR: "Par", KIT: "Kit", CX: "Caixa", PCT: "Pacote",
  DZ: "Dúzia", M: "Metro (m)", CM: "Centímetro (cm)", M2: "Metro quadrado (m²)",
  KG: "Quilograma (kg)", G: "Grama (g)", L: "Litro (L)", ML: "Mililitro (mL)",
  ROLO: "Rolo", FOLHA: "Folha",
};

const INPUT_CLASS = "w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none transition placeholder:text-[#aaa197] focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";

function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function formatExpenseDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return display(value);
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-[#81766b]">{label}</dt>
      <dd className="mt-2 break-words text-sm font-medium text-[#342d27]">{display(value)}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-6 border-b border-[#f0ece5] pb-4 text-lg font-semibold text-[#342d27]">{title}</h2>
      <dl className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  );
}

function ExpenseHistory({ inventoryId }: { inventoryId: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadExpenses() {
      setLoadingExpenses(true);
      setExpenseError(null);
      setExpenses([]);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        const headers = { Authorization: `Bearer ${token}` };
        const pageSize = 100;
        const first = await api.get<ExpensePage>("/expenses", {
          params: { page: 0, size: pageSize },
          headers,
          signal: controller.signal,
        });
        const totalPages = first.data.totalPages;
        if (!Number.isInteger(totalPages) || totalPages < 0) {
          throw new Error("Paginação de despesas inválida.");
        }
        const all = [...first.data.content];
        for (let page = 1; page < totalPages; page++) {
          const response = await api.get<ExpensePage>("/expenses", {
            params: { page, size: pageSize },
            headers,
            signal: controller.signal,
          });
          all.push(...response.data.content);
        }
        if (!controller.signal.aborted) {
          setExpenses(all.filter((expense) => expense.inventoryId === inventoryId));
        }
      } catch (cause) {
        if (controller.signal.aborted || axios.isCancel(cause)) return;
        if (axios.isAxiosError(cause)) {
          setExpenseError(cause.response?.data?.message || "Não foi possível carregar o histórico de despesas.");
        } else {
          setExpenseError(cause instanceof Error ? cause.message : "Não foi possível carregar o histórico de despesas.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingExpenses(false);
      }
    }
    void loadExpenses();
    return () => controller.abort();
  }, [inventoryId]);

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
  if (!expense.name.toLocaleLowerCase("pt-BR").includes(nameFilter.toLocaleLowerCase("pt-BR"))) return false;
  if (dateFrom && expense.expenseDate < dateFrom) return false;
  if (dateTo && expense.expenseDate > dateTo) return false;
  if (minValue !== "" && expense.value < Number(minValue.replace(",", "."))) return false;
  if (maxValue !== "" && expense.value > Number(maxValue.replace(",", "."))) return false;
  if (minQuantity !== "" && (expense.quantity ?? 0) < Number(minQuantity)) return false;
  if (maxQuantity !== "" && (expense.quantity ?? 0) > Number(maxQuantity)) return false;

  return true;
}), [expenses, nameFilter, dateFrom, dateTo, minValue, maxValue, minQuantity, maxQuantity]);

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.value, 0);
  const statusLabels: Record<string, string> = { PAID: "Pago", PENDING: "Pendente", CANCELLED: "Cancelado" };

  return (
    <section className="rounded-2xl border border-[#e8d7bb] bg-[#f8f3ea] p-5 sm:p-6">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <h2 className="text-sm font-semibold text-[#342d27]">
      Histórico de compras ({expenses.length})
    </h2>

    <Link
      href="/despesas/nova"
      className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#927448]"
    >
      <Plus size={16} /> Nova despesa
    </Link>
  </div>

  <div className="mt-5">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
      <div>
        <label htmlFor="expense-name" className="mb-2 block text-xs font-semibold text-[#51473d]">
          Nome
        </label>
        <input
          id="expense-name"
          type="search"
          placeholder="Buscar pelo nome da despesa"
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="expense-from" className="mb-2 block text-xs font-semibold text-[#51473d]">
          Data da compra — de
        </label>
        <input
          id="expense-from"
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="expense-to" className="mb-2 block text-xs font-semibold text-[#51473d]">
          Data da compra — até
        </label>
        <input
          id="expense-to"
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className={INPUT_CLASS}
        />
      </div>
    </div>

    <details className="group mt-4">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#927448] transition hover:bg-[#f0e5d4] [&::-webkit-details-marker]:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 7h16M7 12h10M10 17h4" />
        </svg>

        Filtros avançados

        {(minValue !== "" ||
          maxValue !== "" ||
          minQuantity !== "" ||
          maxQuantity !== "") && (
          <span className="rounded-full bg-[#e8d7bb] px-2 py-0.5 text-xs text-[#725934]">
            Ativos
          </span>
        )}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <div className="mt-3 grid gap-4 rounded-xl border border-[#e8d7bb] bg-white/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="expense-min" className="mb-2 block text-xs font-semibold text-[#51473d]">
            Valor mínimo (R$)
          </label>
          <input
            id="expense-min"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={minValue}
            onChange={(event) => setMinValue(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="expense-max" className="mb-2 block text-xs font-semibold text-[#51473d]">
            Valor máximo (R$)
          </label>
          <input
            id="expense-max"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={maxValue}
            onChange={(event) => setMaxValue(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="expense-min-quantity" className="mb-2 block text-xs font-semibold text-[#51473d]">
            Qtd mínima comprada
          </label>
          <input
            id="expense-min-quantity"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={minQuantity}
            onChange={(event) => setMinQuantity(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="expense-max-quantity" className="mb-2 block text-xs font-semibold text-[#51473d]">
            Qtd máxima comprada
          </label>
          <input
            id="expense-max-quantity"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={maxQuantity}
            onChange={(event) => setMaxQuantity(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </details>
  </div>

  <div className="mt-5 overflow-x-auto rounded-xl border border-[#e8e0d4] bg-white">
    <table className="w-full min-w-[750px] text-left text-sm">
      <thead className="bg-[#faf9f7] text-xs font-medium text-[#81766b]">
        <tr>
          <th className="px-4 py-4">Compra</th>
          <th className="px-4 py-4">Valor</th>
          <th className="px-4 py-4">Qtd</th>
          <th className="px-4 py-4">Status</th>
          <th className="px-4 py-4">Data </th>
          <th className="px-4 py-4 text-right">Visualizar / Editar</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-[#eee8df]">
        {loadingExpenses ? (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-[#81766b]">
              Carregando histórico...
            </td>
          </tr>
        ) : expenseError ? (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-red-700">
              {expenseError}
            </td>
          </tr>
        ) : filteredExpenses.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-[#81766b]">
              Nenhuma despesa encontrada para este item.
            </td>
          </tr>
        ) : (
          filteredExpenses.map((expense) => (
            <tr key={expense.id} className="even:bg-[#f2eee7]">
              <td className="px-4 py-4 text-[#342d27]">
                {expense.name}
              </td>

              <td className="px-4 py-4 font-semibold text-[#342d27]">
                {formatCurrency(expense.value)}
              </td>

              <td className="px-4 py-4 font-semibold text-[#342d27]">
                {expense.quantity ?? "—"}
              </td>

              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    expense.status === "PAID"
                      ? "bg-green-50 text-green-700"
                      : expense.status === "CANCELLED"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {statusLabels[expense.status] ?? expense.status}
                </span>
              </td>

              <td className="px-4 py-4 text-[#342d27]">
                {formatExpenseDate(expense.expenseDate)}
              </td>

              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/despesas/${expense.id}`}
                    title="Visualizar despesa"
                    aria-label={`Visualizar ${expense.name}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e0d4] text-[#927448] hover:bg-[#f8f5f0]"
                  >
                    <Eye size={16} />
                  </Link>

                  <Link
                    href={`/despesas/${expense.id}/editar`}
                    title="Editar despesa"
                    aria-label={`Editar ${expense.name}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e0d4] text-[#927448] hover:bg-[#f8f5f0]"
                  >
                    <Pencil size={16} />
                  </Link>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  <div className="mt-5 flex items-center justify-between rounded-xl border border-[#e8d7bb] bg-[#f0e5d4] px-5 py-4">
    <span className="text-sm font-semibold text-[#51473d]">
      Valor total das compras
    </span>
    <span className="text-lg font-bold text-[#342d27]">
      {formatCurrency(total)}
    </span>
  </div>
</section>
  );
}

function VisualizarEstoqueContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [item, setItem] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        if (!id) throw new Error("Identificador do item inválido.");

        const { data } = await api.get<Inventory>(`/inventory/${encodeURIComponent(id)}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!controller.signal.aborted) setItem(data);
      } catch (cause) {
        if (controller.signal.aborted || axios.isCancel(cause)) return;
        setItem(null);
        if (axios.isAxiosError(cause)) {
          if (cause.response?.status === 404) setError("Item do estoque não encontrado.");
          else if (cause.response?.status === 401) setError("Sua sessão expirou. Faça login novamente.");
          else if (cause.response?.status === 403) setError("Você não possui permissão para consultar este item.");
          else setError(cause.response?.data?.message || "Não foi possível consultar o item.");
        } else {
          setError(cause instanceof Error ? cause.message : "Não foi possível consultar o item.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void fetchItem();
    return () => controller.abort();
  }, [id, reloadKey]);

  const lowStock = item && item.minimumQuantity !== null && item.quantity <= item.minimumQuantity;

  return (
    <DashboardLayout>
      <main className="space-y-6 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/estoque" className="inline-flex items-center gap-2 text-sm font-medium text-[#927448] hover:underline">
              <ArrowLeft size={17} /> Voltar ao estoque
            </Link>
          </div>
          {item && !loading && (
            <Link href={`/estoque/${item.id}/editar`} className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#927448]">
              <Pencil size={17} /> Editar item
            </Link>
          )}
        </div>

        {loading ? (
          <section className="rounded-2xl border border-[#ece6dc] bg-white px-6 py-16 text-center text-sm text-[#81766b]">Carregando item...</section>
        ) : error ? (
          <section className="rounded-2xl border border-[#ece6dc] bg-white px-6 py-14 text-center">
            <Boxes size={38} className="mx-auto mb-4 text-[#cbb58e]" />
            <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#927448] hover:underline">
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </section>
        ) : item ? (
          <>
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
              <div className="min-w-0">
                <h2 className="break-words font-serif text-2xl text-[#342d27]">{item.name} </h2>
                <p className="mt-1 text-sm text-[#81766b]">Categoria: {display(item.category)}</p>
                <p className="mt-1 text-sm text-[#81766b]">SKU: {display(item.sku)}</p>
              </div>
              {lowStock && <span className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">Estoque baixo</span>}
            </section>

            <Section title="Descrição">
              {item.description}
            </Section>

            <Section title="Controle de estoque">
              <Detail label="Qtd disponível" value={item.quantity} />
              <Detail label="Qtd mínima p/ alertar" value={item.minimumQuantity} />
              <Detail label="Unidade de medida" value={item.unit ? UNITS[item.unit] ?? item.unit : null} />
            </Section>

            <Section title="Detalhes do item">
              <Detail label="Cor" value={item.color} />
              <Detail label="Tamanho" value={item.size} />
              <Detail label="Material" value={item.material} />
              <Detail label="Marca" value={item.brand} />
              <Detail label="Modelo" value={item.model} />
            </Section>

            <Section title="Registro">
              <Detail label="Data de cadastro" value={formatDate(item.createdAt)} />
              <Detail label="Última atualização" value={formatDate(item.updatedAt)} />
            </Section>

            <ExpenseHistory inventoryId={item.id} />
          </>
        ) : null}
      </main>
    </DashboardLayout>
  );
}

export default function VisualizarEstoquePage() {
  return (
    <Suspense fallback={<div>Carregando item...</div>}>
      <VisualizarEstoqueContent />
    </Suspense>
  );
}
