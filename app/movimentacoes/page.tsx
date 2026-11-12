
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import axios from "axios";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  RefreshCw,
  Search,
  X,
  Wallet,
  ArrowLeftRight,
  CalendarDays,
} from "lucide-react";

import { api } from "../../src/lib/api";
import DashboardLayout from "../../src/components/layout/DashboardLayout";
import Loading from "@/src/components/layout/Loading";

type MovementOrigin = "SALE" | "EXPENSE";
type MovementDirection = "IN" | "OUT" | null;

type MovementOperation =
  | "CREATED"
  | "UPDATED"
  | "PAYMENT"
  | "REFUND"
  | "VALUE_ADJUSTMENT_INCREASE"
  | "VALUE_ADJUSTMENT_DECREASE"
  | "CANCELLED";

type Movement = {
  id: string;
  originId: string;
  originCode: string;
  origin: MovementOrigin;
  operation: MovementOperation;
  direction: MovementDirection;
  status: string | null;
  previousValue: number | null;
  currentValue: number | null;
  amount: number;
  description: string | null;
  createdAt: string;
};

type MovementsPageResponse = {
  content: Movement[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

type Filters = {
  createdFrom: string;
  createdTo: string;
  minAmount: string;
  maxAmount: string;
  originId: string;
  origin: string;
  direction: string;
  operation: string;
  status: string;
  description: string;
};

const EMPTY_FILTERS: Filters = {
  createdFrom: "",
  createdTo: "",
  minAmount: "",
  maxAmount: "",
  originId: "",
  origin: "",
  direction: "",
  operation: "",
  status: "",
  description: "",
};

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border border-[#e8e0d4] bg-white px-3 py-2.5 text-sm text-[#342d27] outline-none transition focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";

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

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const OPERATION_LABELS: Record<MovementOperation, string> = {
  CREATED: "Criação",
  UPDATED: "Atualização",
  PAYMENT: "Pagamento / recebimento",
  REFUND: "Estorno",
  VALUE_ADJUSTMENT_INCREASE: "Aumento de valor",
  VALUE_ADJUSTMENT_DECREASE: "Redução de valor",
  CANCELLED: "Cancelamento",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PARTIALLY_PAID: "Parcialmente paga",
  PAID: "Paga",
  CANCELLED: "Cancelada",
};

const SORT_OPTIONS = [
  { value: "createdAt", label: "Data da movimentação" },
  { value: "amount", label: "Valor" },
  { value: "origin", label: "Origem" },
  { value: "operation", label: "Operação" },
  { value: "status", label: "Status" },
];

const QUICK_FILTERS: {
  label: string;
  field: keyof Filters;
  value: string;
}[] = [
  { label: "Entradas", field: "direction", value: "IN" },
  { label: "Saídas", field: "direction", value: "OUT" },
  { label: "Vendas", field: "origin", value: "SALE" },
  { label: "Despesas", field: "origin", value: "EXPENSE" },
  { label: "Pagamentos", field: "operation", value: "PAYMENT" }
];

function Field({
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

function SummaryCard({
  title,
  value,
  icon,
  detail,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[#81766b]">{title}</p>
        <span className="text-[#a98a58]">{icon}</span>
      </div>
      <p className="mt-3 break-words text-xl font-semibold text-[#342d27] sm:text-2xl">
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-xs text-[#81766b]">{detail}</p>
      )}
    </div>
  );
}

function toApiDate(value: string, endOfDay: boolean) {
  if (!value) return "";

  const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
  return new Date(`${value}T${time}`).toISOString();
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
    const trimmed = value.trim();
    if (!trimmed) return;

    if (key === "createdFrom" || key === "createdTo") {
      params.set(key, toApiDate(trimmed, key === "createdTo"));
    } else {
      params.set(key, trimmed);
    }
  });

  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", sortBy);
  params.set("sortDirection", sortDirection);

  return params;
}

function MovementDirectionBadge({
  direction,
}: {
  direction: MovementDirection;
}) {
  if (direction === "IN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <ArrowDownLeft size={13} />
        Entrada
      </span>
    );
  }

  if (direction === "OUT") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
        <ArrowUpRight size={13} />
        Saída
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-inset ring-stone-200">
      Sem fluxo financeiro
    </span>
  );
}

export default function MovementsPageScreen() {
  const [draft, setDraft] = useState<Filters>({ ...EMPTY_FILTERS });
  const [applied, setApplied] = useState<Filters>({ ...EMPTY_FILTERS });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("DESC");

  const [result, setResult] =
    useState<MovementsPageResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const updateDraft = (field: keyof Filters, value: string) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const applyFilters = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (
      draft.createdFrom &&
      draft.createdTo &&
      draft.createdFrom > draft.createdTo
    ) {
      setError("A data inicial não pode ser posterior à data final.");
      return;
    }

    if (
      draft.minAmount &&
      draft.maxAmount &&
      Number(draft.minAmount) > Number(draft.maxAmount)
    ) {
      setError("O valor mínimo não pode ultrapassar o valor máximo.");
      return;
    }

    setError(null);
    setPage(0);
    setApplied({ ...draft });
  };

  const clearFilters = () => {
    setDraft({ ...EMPTY_FILTERS });
    setApplied({ ...EMPTY_FILTERS });
    setError(null);
    setPage(0);
  };

  const toggleQuickFilter = (
    field: keyof Filters,
    value: string,
  ) => {
    const next = {
      ...draft,
      [field]: draft[field] === value ? "" : value,
    };

    setDraft(next);
    setApplied(next);
    setPage(0);
  };

  const fetchMovements = useCallback(
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

        const response = await api.get<MovementsPageResponse>(
          `/moviments?${params.toString()}`,
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
                "Não foi possível carregar as movimentações.")
            : "Ocorreu um erro ao carregar as movimentações.",
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

    void fetchMovements(controller.signal);

    return () => controller.abort();
  }, [fetchMovements, reloadKey]);

  const movements = result?.content ?? [];
  const totalElements = result?.totalElements ?? 0;
  const currentPage = result?.page ?? page;

  const firstElement =
    totalElements === 0 ? 0 : currentPage * size + 1;

  const lastElement =
    totalElements === 0
      ? 0
      : Math.min(
          firstElement + movements.length - 1,
          totalElements,
        );

  const activeCount = useMemo(
    () =>
      Object.values(applied).filter((value) => value.trim()).length,
    [applied],
  );

  // Totais referentes apenas à página carregada.
  const pageSummary = useMemo(() => {
    const entries = movements
      .filter((movement) => movement.direction === "IN")
      .reduce((total, movement) => total + movement.amount, 0);

    const exits = movements
      .filter((movement) => movement.direction === "OUT")
      .reduce((total, movement) => total + movement.amount, 0);

    return {
      entries,
      exits,
      balance: entries - exits,
      count: movements.length,
    };
  }, [movements]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div>
          <h1 className="mt-2 font-serif text-3xl text-[#342d27] sm:text-4xl">
            Movimentações financeiras
          </h1>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Entradas"
            value={formatCurrency(pageSummary.entries)}
            icon={<ArrowDownLeft size={20} />}
          />

          <SummaryCard
            title="Saídas"
            value={formatCurrency(pageSummary.exits)}
            icon={<ArrowUpRight size={20} />}
          />

          <SummaryCard
            title="Saldo"
            value={formatCurrency(pageSummary.balance)}
            icon={<Wallet size={20} />}
          />

          <SummaryCard
            title="Movimentações"
            value={String(totalElements)}
            icon={<ArrowLeftRight size={20} />}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <form onSubmit={applyFilters}>
              <div className="mb-5 flex items-center gap-2">
                <CalendarDays size={19} className="text-[#a98a58]" />
                <h2 className="text-base font-semibold text-[#342d27]">
                  Filtrar
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Data da movimentação — De">
                  <input
                    type="date"
                    className={INPUT_CLASS}
                    value={draft.createdFrom}
                    onChange={(event) =>
                      updateDraft("createdFrom", event.target.value)
                    }
                  />
                </Field>

                <Field label="Data da movimentação — Até">
                  <input
                    type="date"
                    className={INPUT_CLASS}
                    value={draft.createdTo}
                    onChange={(event) =>
                      updateDraft("createdTo", event.target.value)
                    }
                  />
                </Field>

                <Field label="ID da venda / despesa">
                  <input
                    className={INPUT_CLASS}
                    value={draft.originId}
                    onChange={(event) =>
                      updateDraft("originId", event.target.value)
                    }
                    maxLength={36}
                  />
                </Field>

                <Field label="Valor — A partir de">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={INPUT_CLASS}
                    value={draft.minAmount}
                    onChange={(event) =>
                      updateDraft("minAmount", event.target.value)
                    }
                    placeholder="R$ 0,00"
                  />
                </Field>

                <Field label="Valor — Até">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={INPUT_CLASS}
                    value={draft.maxAmount}
                    onChange={(event) =>
                      updateDraft("maxAmount", event.target.value)
                    }
                    placeholder="Sem limite"
                  />
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[#81766b]">
                  Filtros rápidos
                </span>

                {QUICK_FILTERS.map((quick) => {
                  const active =
                    applied[quick.field] === quick.value;

                  return (
                    <button
                      key={`${quick.field}-${quick.value}`}
                      type="button"
                      onClick={() =>
                        toggleQuickFilter(quick.field, quick.value)
                      }
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-[#a98a58] bg-[#f2e9da] text-[#725934]"
                          : "border-[#e8e0d4] bg-white text-[#81766b] hover:bg-[#f7f3ed]"
                      }`}
                    >
                      {quick.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowAdvanced((previous) => !previous)
                  }
                  className={SECONDARY_BUTTON_CLASS}
                  aria-expanded={showAdvanced}
                >
                  <Filter size={17} />
                  Filtros avançados
                  {showAdvanced ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={SECONDARY_BUTTON_CLASS}
                  >
                    <X size={16} />
                    Limpar
                    {activeCount > 0 ? ` (${activeCount})` : ""}
                  </button>

                  <button type="submit" className={BUTTON_CLASS}>
                    <Search size={17} />
                    Buscar movimentações
                  </button>
                </div>
              </div>

              {showAdvanced && (
                <div className="-mx-5 -mb-5 mt-6 border-t border-[#f0ece5] bg-[#fdfcfb] px-5 py-6 sm:-mx-6 sm:-mb-6 sm:px-6">
                  <h3 className="mb-5 text-sm font-semibold text-[#342d27]">
                    Filtros avançados
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <Field label="Origem">
                      <select
                        className={INPUT_CLASS}
                        value={draft.origin}
                        onChange={(event) =>
                          updateDraft("origin", event.target.value)
                        }
                      >
                        <option value="">Todas</option>
                        <option value="SALE">Vendas</option>
                        <option value="EXPENSE">Despesas</option>
                      </select>
                    </Field>

                    <Field label="Direção">
                      <select
                        className={INPUT_CLASS}
                        value={draft.direction}
                        onChange={(event) =>
                          updateDraft("direction", event.target.value)
                        }
                      >
                        <option value="">Todas</option>
                        <option value="IN">Entradas</option>
                        <option value="OUT">Saídas</option>
                      </select>
                    </Field>

                    <Field label="Operação">
                      <select
                        className={INPUT_CLASS}
                        value={draft.operation}
                        onChange={(event) =>
                          updateDraft("operation", event.target.value)
                        }
                      >
                        <option value="">Todas</option>
                        {Object.entries(OPERATION_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </Field>

                    <Field label="Status">
                      <select
                        className={INPUT_CLASS}
                        value={draft.status}
                        onChange={(event) =>
                          updateDraft("status", event.target.value)
                        }
                      >
                        <option value="">Todos</option>
                        <option value="PENDING">Pendente</option>
                        <option value="PARTIALLY_PAID">
                          Parcialmente paga
                        </option>
                        <option value="PAID">Paga</option>
                        <option value="CANCELLED">Cancelada</option>
                      </select>
                    </Field>

                    <Field label="Descrição">
                      <input
                        className={INPUT_CLASS}
                        value={draft.description}
                        onChange={(event) =>
                          updateDraft("description", event.target.value)
                        }
                        placeholder="Buscar na descrição"
                      />
                    </Field>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className={SECONDARY_BUTTON_CLASS}
                      onClick={clearFilters}
                    >
                      Limpar
                    </button>

                    <button
                      type="submit"
                      className={BUTTON_CLASS}
                    >
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
                Histórico
              </h2>

              <p className="mt-1 text-sm text-[#81766b]">
                {loading
                  ? "Carregando movimentações..."
                  : `${totalElements} ${
                      totalElements === 1
                        ? "movimentação encontrada"
                        : "movimentações encontradas"
                    }`}

                {activeCount > 0 &&
                  ` · ${activeCount} filtro${
                    activeCount > 1 ? "s" : ""
                  } aplicado${activeCount > 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <Field label="Ordenar por">
                <select
                  className={INPUT_CLASS}
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setPage(0);
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Direção">
                <select
                  className={INPUT_CLASS}
                  value={sortDirection}
                  onChange={(event) => {
                    setSortDirection(event.target.value);
                    setPage(0);
                  }}
                >
                  <option value="DESC">Decrescente</option>
                  <option value="ASC">Crescente</option>
                </select>
              </Field>

              <Field label="Por página">
                <select
                  className={INPUT_CLASS}
                  value={size}
                  onChange={(event) => {
                    setSize(Number(event.target.value));
                    setPage(0);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </Field>

              <button
                type="button"
                onClick={() =>
                  setReloadKey((previous) => previous + 1)
                }
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
            <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "25%" }} />
              </colgroup>

              <thead className="bg-[#f8f5f0]">
                <tr className="text-xs font-semibold uppercase tracking-wide text-[#81766b]">
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Operação</th>
                  <th className="px-5 py-4">Entrada / Saída</th>
                  <th className="px-5 py-4">Valor</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Data</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-sm text-[#81766b]"
                    >
                      <Loading />
                    </td>
                  </tr>
                ) : !movements.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-sm text-[#81766b]"
                    >
                      Nenhuma movimentação encontrada
                    </td>
                  </tr>
                ) : (
                  
                movements.map((movement) => {
                  const isEntry = movement.direction === "IN";
                  const isExit = movement.direction === "OUT";

                  const originPath =
                    movement.origin === "SALE"
                      ? `/vendas/${movement.originId}`
                      : `/despesas/${movement.originId}`;

                  return (
                    <tr
                      key={movement.id}
                      className="border-b border-[#eee8df] bg-white transition-colors even:bg-[#e9e4dc] hover:bg-[#ded7cc]"
                    >
                      <td className="px-5 py-4 align-middle">
                        <Link
                          href={originPath}
                          title={`Abrir ${
                            movement.origin === "SALE" ? "venda" : "despesa"
                          } ${movement.originId}`}
                          className="font-semibold text-[#342d27] hover:text-[#a98a58] hover:underline"
                        >
                          {movement.origin === "SALE" ? "Venda" : "Despesa"}
                        </Link>

                        <p
                          className="mt-1 text-xs text-[#81766b]"
                          title={movement.originId}
                        >
                          ID: {movement.originCode}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-middle text-sm font-medium text-[#51473d]">
                        {OPERATION_LABELS[movement.operation] ?? movement.operation}
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <MovementDirectionBadge direction={movement.direction} />
                      </td>

                      <td
                        className={`px-5 py-4 align-middle text-sm font-semibold ${
                          isEntry
                            ? "text-emerald-700"
                            : isExit
                              ? "text-red-700"
                              : "text-[#342d27]"
                        }`}
                      >
                        {isEntry ? "+ " : isExit ? "− " : ""}
                        {formatCurrency(movement.amount)}
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <p className="text-sm text-[#51473d]">
                          {movement.description ?? "—"}
                        </p>

                        {movement.status && (
                          <span className="mt-2 inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                            {STATUS_LABELS[movement.status] ?? movement.status}
                          </span>
                        )}

                        {movement.previousValue !== null &&
                          movement.currentValue !== null && (
                            <p className="mt-2 text-xs text-[#81766b]">
                              {formatCurrency(movement.previousValue)} →{" "}
                              {formatCurrency(movement.currentValue)}
                            </p>
                          )}
                      </td>

                      <td className="px-5 py-4 align-middle text-sm text-[#51473d]">
                        {formatDateTime(movement.createdAt)}
                      </td>
                    </tr>
                  );
                })

                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-[#eee8df] px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-[#81766b]">
              Exibindo{" "}
              <strong className="text-[#342d27]">
                {firstElement}
              </strong>{" "}
              a{" "}
              <strong className="text-[#342d27]">
                {lastElement}
              </strong>{" "}
              de{" "}
              <strong className="text-[#342d27]">
                {totalElements}
              </strong>{" "}
              resultados
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setPage((previous) => Math.max(0, previous - 1))
                }
                disabled={loading || result?.first !== false}
                className={SECONDARY_BUTTON_CLASS}
              >
                <ChevronLeft size={17} />
                Anterior
              </button>

              <span className="whitespace-nowrap text-sm font-medium text-[#51473d]">
                Página {result?.totalPages ? currentPage + 1 : 0} de{" "}
                {result?.totalPages ?? 0}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((previous) => previous + 1)
                }
                disabled={loading || result?.last !== false}
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
