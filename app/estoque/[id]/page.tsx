"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Boxes, Pencil, RefreshCw, Eye, Plus } from "lucide-react";

import { api } from "../../../src/lib/api";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";
import Loading from "@/src/components/layout/Loading";

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
  category?: string;
  description?: string | null;
  allocationType?: string;
  createdAt?: string;
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
  const [expenseAdvanced, setExpenseAdvanced] = useState<Record<string, string>>({});
  const setExpenseAdvancedField = (field: string, value: string) =>
    setExpenseAdvanced((previous) => ({ ...previous, [field]: value }));

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
    const contains = (value: string | null | undefined, query: string) =>
      (value ?? "").toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"));
    if (nameFilter.trim() && !contains(expense.name, nameFilter)) return false;
    const date = expense.expenseDate.slice(0, 10);
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    if (minValue !== "" && expense.value < Number(minValue)) return false;
    if (maxValue !== "" && expense.value > Number(maxValue)) return false;
    const advanced = expenseAdvanced;
    if (advanced.description?.trim() && !contains(expense.description, advanced.description)) return false;
    if (advanced.category && expense.category !== advanced.category) return false;
    if (advanced.status && expense.status !== advanced.status) return false;
    if (advanced.allocationType && expense.allocationType !== advanced.allocationType) return false;
    if (advanced.exactValue !== "" && advanced.exactValue !== undefined && expense.value !== Number(advanced.exactValue)) return false;
    if (advanced.quantity !== "" && advanced.quantity !== undefined && expense.quantity !== Number(advanced.quantity)) return false;
    if (advanced.minQuantity !== "" && advanced.minQuantity !== undefined && (expense.quantity == null || expense.quantity < Number(advanced.minQuantity))) return false;
    if (advanced.maxQuantity !== "" && advanced.maxQuantity !== undefined && (expense.quantity == null || expense.quantity > Number(advanced.maxQuantity))) return false;
    if (advanced.exactDate && date !== advanced.exactDate) return false;
    const created = expense.createdAt?.slice(0, 10) ?? "";
    if (advanced.createdFrom && (!created || created < advanced.createdFrom)) return false;
    if (advanced.createdTo && (!created || created > advanced.createdTo)) return false;
    return true;
  }), [expenses, nameFilter, dateFrom, dateTo, minValue, maxValue, expenseAdvanced]);

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.value, 0);
  const statusLabels: Record<string, string> = { PAID: "Pago", PENDING: "Pendente", CANCELLED: "Cancelado" };

  if (loadingExpenses || expenseError || expenses.length === 0) {
  return null;
}

  
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block text-xs font-semibold text-[#51473d] sm:col-span-2 lg:col-span-4">
        Nome
        <input type="search" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} placeholder="Buscar pelo nome da despesa" className={`mt-2 ${INPUT_CLASS}`} />
      </label>
      <label className="block text-xs font-semibold text-[#51473d]">
        Data da despesa — de
        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={`mt-2 ${INPUT_CLASS}`} />
      </label>
      <label className="block text-xs font-semibold text-[#51473d]">
        Data da despesa — até
        <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className={`mt-2 ${INPUT_CLASS}`} />
      </label>
      <label className="block text-xs font-semibold text-[#51473d]">
        Valor mínimo (R$)
        <input type="number" min="0" step="0.01" value={minValue} onChange={(event) => setMinValue(event.target.value)} placeholder="0,00" className={`mt-2 ${INPUT_CLASS}`} />
      </label>
      <label className="block text-xs font-semibold text-[#51473d]">
        Valor máximo (R$)
        <input type="number" min="0" step="0.01" value={maxValue} onChange={(event) => setMaxValue(event.target.value)} placeholder="0,00" className={`mt-2 ${INPUT_CLASS}`} />
      </label>
    </div>
    <details className="group mt-4">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#927448] hover:bg-[#f0e5d4] [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true">☰</span> Filtros avançados
        {Object.values(expenseAdvanced).some((value) => value.trim()) && <span className="rounded-full bg-[#e8d7bb] px-2 py-0.5 text-xs">Ativos</span>}
        <span className="transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 grid gap-4 rounded-xl border border-[#e8d7bb] bg-white/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs font-semibold text-[#51473d]">Categoria
          <select value={expenseAdvanced.category ?? ""} onChange={(event) => setExpenseAdvancedField("category", event.target.value)} className={`mt-2 ${INPUT_CLASS}`}>
            <option value="">Todas as categorias</option>
            {[...new Set(expenses.map((expense) => expense.category).filter((category): category is string => Boolean(category)))].sort((a, b) => a.localeCompare(b, "pt-BR")).map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-[#51473d]">Descrição
          <input type="search" value={expenseAdvanced.description ?? ""} onChange={(event) => setExpenseAdvancedField("description", event.target.value)} placeholder="Buscar pela descrição" className={`mt-2 ${INPUT_CLASS}`} />
        </label>
        <label className="block text-xs font-semibold text-[#51473d]">Status
          <select value={expenseAdvanced.status ?? ""} onChange={(event) => setExpenseAdvancedField("status", event.target.value)} className={`mt-2 ${INPUT_CLASS}`}>
            <option value="">Todos os status</option><option value="PENDING">Pendente</option><option value="PAID">Pago</option><option value="CANCELLED">Cancelado</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-[#51473d]">Tipo de alocação
          <select value={expenseAdvanced.allocationType ?? ""} onChange={(event) => setExpenseAdvancedField("allocationType", event.target.value)} className={`mt-2 ${INPUT_CLASS}`}>
            <option value="">Todas as alocações</option><option value="GENERAL">Geral</option><option value="SPECIFIC_PRODUCT">Produto específico</option><option value="CATEGORY_PRODUCTS">Diversos produtos por categoria</option>
          </select>
        </label>
        {([["exactValue", "Valor exato (R$)", "0.01"], ["quantity", "Quantidade exata", "1"], ["minQuantity", "Quantidade mínima", "1"], ["maxQuantity", "Quantidade máxima", "1"]] as const).map(([field, label, step]) => (
          <label key={field} className="block text-xs font-semibold text-[#51473d]">{label}
            <input type="number" min="0" step={step} value={expenseAdvanced[field] ?? ""} onChange={(event) => setExpenseAdvancedField(field, event.target.value)} placeholder="0" className={`mt-2 ${INPUT_CLASS}`} />
          </label>
        ))}
        {([["exactDate", "Data exata da despesa"], ["createdFrom", "Cadastro a partir de"], ["createdTo", "Cadastro até"]] as const).map(([field, label]) => (
          <label key={field} className="block text-xs font-semibold text-[#51473d]">{label}
            <input type="date" value={expenseAdvanced[field] ?? ""} onChange={(event) => setExpenseAdvancedField(field, event.target.value)} className={`mt-2 ${INPUT_CLASS}`} />
          </label>
        ))}
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
            <Loading />
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
          <Loading />
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

            {item.description?.trim() && (
              <Section title="Descrição">
                {item.description}
              </Section>
            )}

            <Section title="Controle de estoque">
              <Detail label="Qtd disponível" value={item.quantity} />

              {item.minimumQuantity !== null && item.minimumQuantity !== undefined && (
                <Detail label="Qtd mínima p/ alertar" value={item.minimumQuantity} />
              )}

              {item.unit?.trim() && (
                <Detail
                  label="Unidade de medida"
                  value={UNITS[item.unit] ?? item.unit}
                />
              )}
            </Section>

                      {[
            item.color,
            item.size,
            item.material,
            item.brand,
            item.model,
          ].some((value) => value?.trim()) && (
            <Section title="Detalhes do item">
              {item.color?.trim() && <Detail label="Cor" value={item.color} />}
              {item.size?.trim() && <Detail label="Tamanho" value={item.size} />}
              {item.material?.trim() && <Detail label="Material" value={item.material} />}
              {item.brand?.trim() && <Detail label="Marca" value={item.brand} />}
              {item.model?.trim() && <Detail label="Modelo" value={item.model} />}
            </Section>
          )}

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
    <Suspense fallback={<Loading />}>
      <VisualizarEstoqueContent />
    </Suspense>
  );
}
