
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import axios from "axios";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { api } from "../../src/lib/api";
import DashboardLayout from "../../src/components/layout/DashboardLayout";

type ExpenseCategory =
  | "TRANSPORT"
  | "PRODUCTION"
  | "INVESTMENT"
  | "BILLS"
  | "MARKETING"
  | "PACKAGING"
  | "EQUIPMENT"
  | "STOCK"
  | "OTHER";

type ExpenseAllocationType =
  | "GENERAL"
  | "SPECIFIC_PRODUCT"
  | "CATEGORY_PRODUCTS";

type ExpenseStatus = "PENDING" | "PAID" | "CANCELLED";

type ExpenseProduct = {
  productId: string;
  allocatedValue: number;
};

type Expense = {
  id: string;
  name: string;
  description: string | null;
  value: number;
  category: ExpenseCategory;
  allocationType: ExpenseAllocationType;
  status: ExpenseStatus;
  quantity: number | null;
  products: ExpenseProduct[];
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
};

type ExpensesPage = {
  content: Expense[];
  page: number;
  size: number;
  totalElements: number;
  totalElementsThisPage: number;
  totalPages: number;
};

type Filters = {
  name: string;
  description: string;
  value: string;
  minValue: string;
  maxValue: string;
  category: string;
  allocationType: string;
  status: string;
  productId: string;
  quantity: string;
  minQuantity: string;
  maxQuantity: string;
  expenseDate: string;
  expenseDateFrom: string;
  expenseDateTo: string;
  createdAt: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
};

const EMPTY_FILTERS: Filters = {
  name: "",
  description: "",
  value: "",
  minValue: "",
  maxValue: "",
  category: "",
  allocationType: "",
  status: "",
  productId: "",
  quantity: "",
  minQuantity: "",
  maxQuantity: "",
  expenseDate: "",
  expenseDateFrom: "",
  expenseDateTo: "",
  createdAt: "",
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
};

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "TRANSPORT", label: "Transporte" },
  { value: "PRODUCTION", label: "Produção" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "BILLS", label: "Contas" },
  { value: "MARKETING", label: "Marketing" },
  { value: "PACKAGING", label: "Embalagens" },
  { value: "EQUIPMENT", label: "Equipamentos" },
  { value: "STOCK", label: "Estoque" },
  { value: "OTHER", label: "Outros" },
];

const ALLOCATION_OPTIONS: {
  value: ExpenseAllocationType;
  label: string;
}[] = [
  { value: "GENERAL", label: "Geral" },
  { value: "SPECIFIC_PRODUCT", label: "Produto específico" },
  { value: "CATEGORY_PRODUCTS", label: "Produtos da categoria" },
];

const STATUS_OPTIONS: { value: ExpenseStatus; label: string }[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Paga" },
  { value: "CANCELLED", label: "Cancelada" },
];

const SORT_OPTIONS = [
  { value: "expenseDate", label: "Data da despesa" },
  { value: "createdAt", label: "Data de cadastro" },
  { value: "updatedAt", label: "Última atualização" },
  { value: "name", label: "Nome" },
  { value: "value", label: "Valor" },
  { value: "category", label: "Categoria" },
  { value: "allocationType", label: "Alocação" },
  { value: "status", label: "Status" },
  { value: "quantity", label: "Quantidade" },
];

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border border-[#e8e0d4] bg-white px-3 py-2.5 text-sm font-normal text-[#342d27] outline-none transition focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";

const LABEL_CLASS =
  "mb-2 block text-sm font-medium text-[#51473d]";

const BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#342d27] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#51473d] disabled:cursor-not-allowed disabled:opacity-50";

const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e0d4] bg-white px-4 py-2.5 text-sm font-medium text-[#51473d] transition hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-50";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = value.split("T")[0];
  const parts = date.split("-");

  if (parts.length !== 3) return value;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const categoryLabel = (category: ExpenseCategory) =>
  CATEGORY_OPTIONS.find((option) => option.value === category)?.label ??
  category;

const allocationLabel = (allocation: ExpenseAllocationType) =>
  ALLOCATION_OPTIONS.find((option) => option.value === allocation)?.label ??
  allocation;

function StatusLabel({ status }: { status: ExpenseStatus }) {
  const styles: Record<ExpenseStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  };

  const label =
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className={LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}

function buildParams(
  filters: Filters,
  page: number,
  size: number,
  sortBy: string,
  sortDirection: string,
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (!value.trim()) return;

    if (
      ["createdFrom", "createdTo", "updatedFrom", "updatedTo"].includes(key)
    ) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        params.set(key, date.toISOString());
      }

      return;
    }

    params.set(key, value.trim());
  });

  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", sortBy);
  params.set("sortDirection", sortDirection);

  return params;
}

export default function ExpensesPageScreen() {
  const [draft, setDraft] = useState<Filters>({ ...EMPTY_FILTERS });
  const [applied, setApplied] = useState<Filters>({ ...EMPTY_FILTERS });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortBy, setSortBy] = useState("expenseDate");
  const [sortDirection, setSortDirection] = useState("DESC");

  const [result, setResult] = useState<ExpensesPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const updateDraft = (field: keyof Filters, value: string) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleInput =
    (field: keyof Filters) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateDraft(field, event.target.value);
    };

  const applyFilters = () => {
    setPage(0);
    setApplied({ ...draft });
  };

  const clearFilters = () => {
    setDraft({ ...EMPTY_FILTERS });
    setApplied({ ...EMPTY_FILTERS });
    setPage(0);
  };

  const fetchExpenses = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const params = buildParams(
          applied,
          page,
          size,
          sortBy,
          sortDirection,
        );

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;

        const response = await api.get<ExpensesPage>(
          `/expenses?${params.toString()}`,
          {
            signal,
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
          },
        );

        if (signal.aborted) return;

        setResult(response.data);
      } catch (exception) {
        if (signal.aborted || axios.isCancel(exception)) return;

        setError(
          axios.isAxiosError(exception)
            ? (exception.response?.data?.message ??
                "Não foi possível carregar as despesas.")
            : "Ocorreu um erro ao carregar as despesas.",
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [applied, page, size, sortBy, sortDirection],
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetchExpenses(controller.signal);

    return () => controller.abort();
  }, [fetchExpenses, reloadKey]);

  const totalElements = result?.totalElements ?? 0;
  const totalPages = result?.totalPages ?? 0;
  const currentPage = result?.page ?? page;

  const firstElement =
    totalElements === 0 ? 0 : currentPage * size + 1;

  const lastElement =
    totalElements === 0
      ? 0
      : Math.min(
          currentPage * size + (result?.totalElementsThisPage ?? 0),
          totalElements,
        );

  const hasActiveFilters = Object.values(applied).some(
    (value) => value.trim() !== "",
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="mt-2 font-serif text-3xl text-[#342d27] sm:text-4xl">
              Despesas
            </h1>

          </div>

          <Link
            href="/despesas/novo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#927448]"
          >
            <Plus size={18} />
            Cadastrar despesa
          </Link>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            
              {hasActiveFilters && (
                <span className="rounded-full bg-[#f4ede2] px-3 py-1 text-xs font-medium text-[#927448]">
                  Filtros ativos
                </span>
              )}
            

            <form
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto] xl:items-end">
                <FilterField label="Nome">
                  <input
                    type="text"
                    value={draft.name}
                    onChange={handleInput("name")}
                    placeholder="Buscar despesa"
                    className={INPUT_CLASS}
                  />
                </FilterField>

                <FilterField label="Categoria">
                  <select
                    value={draft.category}
                    onChange={handleInput("category")}
                    className={INPUT_CLASS}
                  >
                    <option value="">Todas as categorias</option>

                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <button type="submit" className={BUTTON_CLASS}>
                  <Search size={17} />
                  Buscar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowAdvancedFilters((previous) => !previous)
                  }
                  className={SECONDARY_BUTTON_CLASS}
                >
                  <Filter size={17} />
                  Filtros
                  {showAdvancedFilters ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>

              {showAdvancedFilters && (
                <div className="-mx-5 -mb-5 mt-6 border-t border-[#f0ece5] bg-[#fdfcfb] px-5 py-6 sm:-mx-6 sm:-mb-6 sm:px-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#342d27]">
                      Filtros avançados
                    </h3>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#927448] hover:text-[#725934]"
                    >
                      <X size={15} />
                      Limpar filtros
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <FilterField label="Descrição">
                      <input
                        type="text"
                        value={draft.description}
                        onChange={handleInput("description")}
                        placeholder="Buscar pela descrição"
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Status">
                      <select
                        value={draft.status}
                        onChange={handleInput("status")}
                        className={INPUT_CLASS}
                      >
                        <option value="">Todos os status</option>

                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FilterField>

                    <FilterField label="Tipo de alocação">
                      <select
                        value={draft.allocationType}
                        onChange={handleInput("allocationType")}
                        className={INPUT_CLASS}
                      >
                        <option value="">Todas as alocações</option>

                        {ALLOCATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FilterField>

                    <FilterField label="Valor exato">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.value}
                        onChange={handleInput("value")}
                        placeholder="0,00"
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Valor mínimo">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.minValue}
                        onChange={handleInput("minValue")}
                        placeholder="0,00"
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Valor máximo">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.maxValue}
                        onChange={handleInput("maxValue")}
                        placeholder="0,00"
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Quantidade exata">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={draft.quantity}
                        onChange={handleInput("quantity")}
                        placeholder="Quantidade"
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Quantidade mínima">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={draft.minQuantity}
                        onChange={handleInput("minQuantity")}
                        placeholder="Mínima"
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Quantidade máxima">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={draft.maxQuantity}
                        onChange={handleInput("maxQuantity")}
                        placeholder="Máxima"
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Data exata da despesa">
                      <input
                        type="date"
                        value={draft.expenseDate}
                        onChange={handleInput("expenseDate")}
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Despesa a partir de">
                      <input
                        type="date"
                        value={draft.expenseDateFrom}
                        onChange={handleInput("expenseDateFrom")}
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Despesa até">
                      <input
                        type="date"
                        value={draft.expenseDateTo}
                        onChange={handleInput("expenseDateTo")}
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Data exata de cadastro">
                      <input
                        type="date"
                        value={draft.createdAt}
                        onChange={handleInput("createdAt")}
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Cadastro a partir de">
                      <input
                        type="datetime-local"
                        value={draft.createdFrom}
                        onChange={handleInput("createdFrom")}
                        className={INPUT_CLASS}
                      />
                    </FilterField>

                    <FilterField label="Cadastro até">
                      <input
                        type="datetime-local"
                        value={draft.createdTo}
                        onChange={handleInput("createdTo")}
                        className={INPUT_CLASS}
                      />
                    </FilterField>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className={SECONDARY_BUTTON_CLASS}
                    >
                      <X size={16} />
                      Limpar
                    </button>

                    <button type="submit" className={BUTTON_CLASS}>
                      <Search size={17} />
                      Aplicar filtros
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-[#f0ece5] p-5 sm:p-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold text-[#342d27]">
                Despesas cadastradas
              </h2>

              <p className="mt-1 text-sm text-[#81766b]">
                {loading
                  ? "Carregando despesas..."
                  : `${totalElements} ${
                      totalElements === 1
                        ? "despesa encontrada"
                        : "despesas encontradas"
                    }`}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#81766b]">
                  Ordenar por
                </label>

                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setPage(0);
                  }}
                  className={INPUT_CLASS}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#81766b]">
                  Direção
                </label>

                <select
                  value={sortDirection}
                  onChange={(event) => {
                    setSortDirection(event.target.value);
                    setPage(0);
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="DESC">Decrescente</option>
                  <option value="ASC">Crescente</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#81766b]">
                  Por página
                </label>

                <select
                  value={size}
                  onChange={(event) => {
                    setSize(Number(event.target.value));
                    setPage(0);
                  }}
                  className={INPUT_CLASS}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setReloadKey((previous) => previous + 1)}
                disabled={loading}
                title="Atualizar listagem"
                aria-label="Atualizar listagem"
                className={SECONDARY_BUTTON_CLASS}
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-[#f8f5f0]">
                <tr className="text-xs font-semibold uppercase tracking-wide text-[#81766b]">
                  <th className="px-5 py-4">Despesa</th>
                  <th className="px-5 py-4">Categoria</th>
                  <th className="px-5 py-4">Valor</th>
                  <th className="px-5 py-4">Alocação</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Data da despesa</th>
                  <th className="px-5 py-4 text-center">Ações</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-sm text-[#81766b]"
                    >
                      Carregando despesas...
                    </td>
                  </tr>
                ) : !result?.content.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-sm text-[#81766b]"
                    >
                      Nenhuma despesa encontrada.
                    </td>
                  </tr>
                ) : (
                  result.content.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-[#eee8df] odd:bg-white even:bg-[#e9e3da] transition-colors hover:!bg-[#ded3c4]"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/despesas/${expense.id}`}
                          className="font-semibold text-[#342d27] transition hover:text-[#a98a58] hover:underline"
                        >
                          {expense.name}
                        </Link>

                        {expense.description && (
                          <p className="mt-1 max-w-[260px] truncate text-xs text-[#81766b]">
                            {expense.description}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#51473d]">
                        {categoryLabel(expense.category)}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[#342d27]">
                        {formatCurrency(expense.value)}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#51473d]">
                        {allocationLabel(expense.allocationType)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusLabel status={expense.status} />
                      </td>

                      <td className="px-5 py-4 text-sm text-[#51473d]">
                        {formatDate(expense.expenseDate)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/despesas/${expense.id}`}
                            title="Visualizar despesa"
                            aria-label={`Visualizar ${expense.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a98a58] transition hover:bg-white/70 hover:text-[#806438]"
                          >
                            <Eye size={19} />
                          </Link>

                          <Link
                            href={`/despesas/${expense.id}/editar`}
                            title="Editar despesa"
                            aria-label={`Editar ${expense.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a98a58] transition hover:bg-white/70 hover:text-[#806438]"
                          >
                            <Pencil size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-[#eee8df] px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-[#81766b]">
              Exibindo{" "}
              <span className="font-semibold text-[#342d27]">
                {firstElement}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-[#342d27]">
                {lastElement}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-[#342d27]">
                {totalElements}
              </span>{" "}
              resultados
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPage((previous) => Math.max(0, previous - 1))}
                disabled={loading || page === 0}
                className={SECONDARY_BUTTON_CLASS}
              >
                <ChevronLeft size={17} />
                Anterior
              </button>

              <span className="whitespace-nowrap text-sm font-medium text-[#51473d]">
                Página {totalPages === 0 ? 0 : currentPage + 1} de{" "}
                {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((previous) => previous + 1)}
                disabled={loading || totalPages === 0 || page >= totalPages - 1}
                className={SECONDARY_BUTTON_CLASS}
              >
                Próxima
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
