"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Pencil, Filter,
  Plus, RefreshCw, Search, X, ShoppingBag, Wallet, CircleDollarSign, CalendarDays,
} from "lucide-react";

import { api } from "../../src/lib/api";
import DashboardLayout from "../../src/components/layout/DashboardLayout";

type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";
type DeadlineStatus = "NO_DEADLINE" | "ON_TIME" | "DUE_TODAY" | "OVERDUE";

type SaleItem = {
  id: string;
  productId: string;
  inventoryId: string | null;
  quantity: number;
  color: string | null;
  brand: string | null;
  model: string | null;
  size: string | null;
  material: string | null;
};

type Sale = {
  id: string;
  customerId: string;
  deliveryDeadline: string | null;
  totalAmount: number;
  downPaymentPercentage: number;
  downPaymentAmount: number;
  paidPercentage: number;
  paidAmount: number;
  remainingPercentage: number;
  remainingAmount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  deadlineStatus: DeadlineStatus;
  observation: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
};

type SalesResponse = {
  sales: Sale[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  summary: {
    totalSales: number;
    totalAmount: number;
    totalDownPayment: number;
    totalReceived: number;
    totalRemaining: number;
    unpaidSales: number;
    partiallyPaidSales: number;
    paidSales: number;
    overdueSales: number;
    dueTodaySales: number;
    upcomingSales: number;
  };
};

type Filters = {
  productName: string;
  customer: string;
  minTotalAmount: string;
  maxTotalAmount: string;
  saleId: string;
  search: string;
  productCommercialCode: string;
  color: string;
  brand: string;
  model: string;
  size: string;
  material: string;
  observation: string;
  paymentMethod: string;
  paymentStatus: string;
  deadlineStatus: string;
  deliveryDeadlineFrom: string;
  deliveryDeadlineTo: string;
  createdAtFrom: string;
  createdAtTo: string;
  dueWithinDays: string;
  minRemainingAmount: string;
  maxRemainingAmount: string;
  downPaymentFrom: string;
  downPaymentTo: string;
  paidFrom: string;
  paidTo: string;
  remainingFrom: string;
  remainingTo: string;
};

const EMPTY_FILTERS: Filters = {
  productName: "", customer: "", minTotalAmount: "", maxTotalAmount: "",
  saleId: "", search: "", productCommercialCode: "", color: "", brand: "",
  model: "", size: "", material: "", observation: "", paymentMethod: "",
  paymentStatus: "", deadlineStatus: "", deliveryDeadlineFrom: "",
  deliveryDeadlineTo: "", createdAtFrom: "", createdAtTo: "",
  dueWithinDays: "", minRemainingAmount: "", maxRemainingAmount: "",
  downPaymentFrom: "", downPaymentTo: "", paidFrom: "", paidTo: "",
  remainingFrom: "", remainingTo: "",
};

const INPUT_CLASS = "w-full min-w-0 rounded-xl border border-[#e8e0d4] bg-white px-3 py-2.5 text-sm text-[#342d27] outline-none transition focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";
const LABEL_CLASS = "mb-2 block text-sm font-medium text-[#51473d]";
const BUTTON_CLASS = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#342d27] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#51473d] disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY_BUTTON_CLASS = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e0d4] bg-white px-4 py-2.5 text-sm font-medium text-[#51473d] transition hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-50";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = value.split("T")[0];
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Não paga", PARTIALLY_PAID: "Parcialmente paga", PAID: "Paga",
};
const DEADLINE_LABELS: Record<DeadlineStatus, string> = {
  NO_DEADLINE: "Sem prazo", ON_TIME: "No prazo", DUE_TODAY: "Vence hoje", OVERDUE: "Atrasada",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><label className={LABEL_CLASS}>{label}</label>{children}</div>;
}

function DeadlineBadge({ status }: { status: DeadlineStatus }) {
  const colors: Record<DeadlineStatus, string> = {
    NO_DEADLINE: "bg-stone-100 text-stone-600 ring-stone-200",
    ON_TIME: "bg-sky-50 text-sky-700 ring-sky-200",
    DUE_TODAY: "bg-amber-50 text-amber-700 ring-amber-200",
    OVERDUE: "bg-red-50 text-red-700 ring-red-200",
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${colors[status]}`}>{DEADLINE_LABELS[status]}</span>;
}

function SummaryCard({ title, value, icon, detail }: { title: string; value: string; icon: ReactNode; detail?: string }) {
  return (
    <div className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-[#81766b]">{title}</p><span className="text-[#a98a58]">{icon}</span></div>
      <p className="mt-3 break-words text-xl font-semibold text-[#342d27] sm:text-2xl">{value}</p>
      {detail && <p className="mt-1 text-xs text-[#81766b]">{detail}</p>}
    </div>
  );
}

const QUICK_FILTERS: { label: string; field: keyof Filters; value: string }[] = [
  { label: "Não pagas", field: "paymentStatus", value: "UNPAID" },
  { label: "Parcialmente pagas", field: "paymentStatus", value: "PARTIALLY_PAID" },
  { label: "Pagas", field: "paymentStatus", value: "PAID" },
  { label: "Atrasadas", field: "deadlineStatus", value: "OVERDUE" },
  { label: "Vencem hoje", field: "deadlineStatus", value: "DUE_TODAY" },
  { label: "Próximos 7 dias", field: "dueWithinDays", value: "7" },
  { label: "Próximos 30 dias", field: "dueWithinDays", value: "30" },
  { label: "Sem prazo", field: "deadlineStatus", value: "NO_DEADLINE" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Data de cadastro" },
  { value: "totalAmount", label: "Valor total" },
  { value: "remainingAmount", label: "Valor restante" },
  { value: "deliveryDeadline", label: "Prazo de entrega" },
  { value: "paidPercentage", label: "Percentual pago" },
];

function buildParams(filters: Filters, page: number, size: number, sortBy: string, sortDirection: string) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value.trim()) params.set(key, value.trim());
  });
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sortBy", sortBy);
  params.set("sortDirection", sortDirection);
  return params;
}

export default function SalesPageScreen() {
  const [draft, setDraft] = useState<Filters>({ ...EMPTY_FILTERS });
  const [applied, setApplied] = useState<Filters>({ ...EMPTY_FILTERS });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [result, setResult] = useState<SalesResponse | null>(null);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const router = useRouter();

  const updateDraft = (field: keyof Filters, value: string) =>
    setDraft((previous) => ({ ...previous, [field]: value }));

  const applyFilters = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setPage(0);
    setApplied({ ...draft });
  };

  const clearFilters = () => {
    setDraft({ ...EMPTY_FILTERS });
    setApplied({ ...EMPTY_FILTERS });
    setPage(0);
  };

  const toggleQuickFilter = (field: keyof Filters, value: string) => {
    const next = { ...draft, [field]: draft[field] === value ? "" : value };
    // Prazo específico e janela de vencimento não devem se contradizer.
    if (field === "deadlineStatus") next.dueWithinDays = "";
    if (field === "dueWithinDays") next.deadlineStatus = "";
    setDraft(next);
    setApplied(next);
    setPage(0);
  };

  const fetchSales = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(applied, page, size, sortBy, sortDirection);
params.delete("size");
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const response = await api.get<SalesResponse>(`/sales?${params.toString()}`, {
        signal,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (signal.aborted) return;
      setResult(response.data);

      const customerIds = [...new Set(response.data.sales.map((sale) => sale.customerId))];
      const customerResponses = await Promise.allSettled(
        customerIds.map(async (userId) => {
          const { data } = await api.get<{ userId: string; name: string }>("/users/id", {
            params: { userId },
            signal,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          return { userId, name: data.name };
        }),
      );

      if (!signal.aborted) {
        setCustomerNames((previous) => {
          const next = { ...previous };
          customerResponses.forEach((customerResponse) => {
            if (customerResponse.status === "fulfilled") {
              next[customerResponse.value.userId] = customerResponse.value.name;
            }
          });
          return next;
        });
      }
    } catch (exception) {
      if (signal.aborted || axios.isCancel(exception)) return;
      setError(axios.isAxiosError(exception)
        ? (exception.response?.data?.message ?? "Não foi possível carregar as vendas.")
        : "Ocorreu um erro ao carregar as vendas.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [applied, page, size, sortBy, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchSales(controller.signal);
    return () => controller.abort();
  }, [fetchSales, reloadKey]);

  const pagination = result?.pagination;
  const summary = result?.summary;
  const totalElements = pagination?.totalElements ?? 0;
  const currentPage = pagination?.page ?? page;
  const firstElement = totalElements === 0 ? 0 : currentPage * size + 1;
  const lastElement = totalElements === 0 ? 0 : Math.min(firstElement + (result?.sales.length ?? 0) - 1, totalElements);
  const activeCount = useMemo(() => Object.values(applied).filter((value) => value.trim()).length, [applied]);

  const advancedTextFields: { field: keyof Filters; label: string; placeholder: string }[] = [
    { field: "search", label: "Busca geral", placeholder: "Cliente, produto ou observação" },
    { field: "productCommercialCode", label: "Código do produto", placeholder: "Código comercial" },
    { field: "color", label: "Cor", placeholder: "Cor do item" },
    { field: "brand", label: "Marca", placeholder: "Marca do item" },
    { field: "model", label: "Modelo", placeholder: "Modelo do item" },
    { field: "size", label: "Tamanho", placeholder: "Tamanho do item" },
    { field: "material", label: "Material", placeholder: "Material do item" },
    { field: "observation", label: "Observação", placeholder: "Texto da observação" },
  ];

  const advancedNumberFields: { field: keyof Filters; label: string; max?: number }[] = [
    { field: "minRemainingAmount", label: "Restante mínimo" },
    { field: "maxRemainingAmount", label: "Restante máximo" },
    { field: "downPaymentFrom", label: "Entrada (%) de", max: 100 },
    { field: "downPaymentTo", label: "Entrada (%) até", max: 100 },
    { field: "paidFrom", label: "Pago (%) de", max: 100 },
    { field: "paidTo", label: "Pago (%) até", max: 100 },
    { field: "remainingFrom", label: "Restante (%) de", max: 100 },
    { field: "remainingTo", label: "Restante (%) até", max: 100 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="mt-2 font-serif text-3xl text-[#342d27] sm:text-4xl">Vendas</h1>
          </div>
          <Link href="/vendas/nova" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#927448]">
            <Plus size={18} /> Nova venda
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Valor total" value={formatCurrency(summary?.totalAmount ?? 0)}  icon={<ShoppingBag size={20} />} />
          <SummaryCard title="Total recebido" value={formatCurrency(summary?.totalReceived ?? 0)}  icon={<CircleDollarSign size={20} />} />
          <SummaryCard title="Valor a receber" value={formatCurrency(summary?.totalRemaining ?? 0)} icon={<Wallet size={20} />} />
          <SummaryCard title="Entradas previstas" value={formatCurrency(summary?.totalDownPayment ?? 0)} icon={<CalendarDays size={20} />} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <form onSubmit={applyFilters}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="Produto">
                  <input className={INPUT_CLASS} value={draft.productName} onChange={(event) => updateDraft("productName", event.target.value)} placeholder="Qualquer produto da venda" />
                </Field>
                <Field label="Cliente">
                  <input className={INPUT_CLASS} value={draft.customer} onChange={(event) => updateDraft("customer", event.target.value)} placeholder="Nome, CPF, e-mail ou telefone" />
                </Field>
                <Field label="Valor da compra — de">
                  <input className={INPUT_CLASS} type="number" min="0" step="0.01" value={draft.minTotalAmount} onChange={(event) => updateDraft("minTotalAmount", event.target.value)} placeholder="R$ 0,00" />
                </Field>
                <Field label="Valor da compra — até">
                  <input className={INPUT_CLASS} type="number" min="0" step="0.01" value={draft.maxTotalAmount} onChange={(event) => updateDraft("maxTotalAmount", event.target.value)} placeholder="Sem limite" />
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[#81766b]">Filtros rápidos</span>
                {QUICK_FILTERS.map((quick) => {
                  const active = applied[quick.field] === quick.value;
                  return (
                    <button key={`${quick.field}-${quick.value}`} type="button" onClick={() => toggleQuickFilter(quick.field, quick.value)} aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-[#a98a58] bg-[#f2e9da] text-[#725934]" : "border-[#e8e0d4] bg-white text-[#81766b] hover:bg-[#f7f3ed]"}`}>
                      {quick.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => setShowAdvanced((previous) => !previous)} className={SECONDARY_BUTTON_CLASS} aria-expanded={showAdvanced}>
                  <Filter size={17} /> Filtros avançados {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={clearFilters} className={SECONDARY_BUTTON_CLASS}><X size={16} /> Limpar {activeCount > 0 ? `(${activeCount})` : ""}</button>
                  <button type="submit" className={BUTTON_CLASS}><Search size={17} /> Buscar vendas</button>
                </div>
              </div>

              {showAdvanced && (
                <div className="-mx-5 -mb-5 mt-6 border-t border-[#f0ece5] bg-[#fdfcfb] px-5 py-6 sm:-mx-6 sm:-mb-6 sm:px-6">
                  <h3 className="mb-5 text-sm font-semibold text-[#342d27]">Filtros avançados</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {advancedTextFields.map(({ field, label, placeholder }) => (
                      <Field key={field} label={label}><input className={INPUT_CLASS} value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} placeholder={placeholder} /></Field>
                    ))}
                    <Field label="Forma de pagamento">
                      <select className={INPUT_CLASS} value={draft.paymentMethod} onChange={(event) => updateDraft("paymentMethod", event.target.value)}>
                        <option value="">Todas</option>
                        <option value="PIX">PIX</option>
                        <option value="CREDIT_CARD">Cartão de crédito</option>
                        <option value="DEBIT_CARD">Cartão de débito</option>
                        <option value="CASH">Dinheiro</option>
                        <option value="BANK_TRANSFER">Transferência bancária</option>
                        <option value="BOLETO">Boleto</option>
                      </select>
                    </Field>
                    <Field label="Situação do pagamento">
                      <select className={INPUT_CLASS} value={draft.paymentStatus} onChange={(event) => updateDraft("paymentStatus", event.target.value)}>
                        <option value="">Todas</option>
                        {Object.entries(PAYMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </Field>
                    <Field label="Situação do prazo">
                      <select className={INPUT_CLASS} value={draft.deadlineStatus} onChange={(event) => updateDraft("deadlineStatus", event.target.value)}>
                        <option value="">Todas</option>
                        {Object.entries(DEADLINE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </Field>
                    {advancedNumberFields.map(({ field, label, max }) => (
                      <Field key={field} label={label}><input className={INPUT_CLASS} type="number" min="0" max={max} step="0.01" value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} placeholder="0" /></Field>
                    ))}
                    <Field label="Entrega de"><input className={INPUT_CLASS} type="date" value={draft.deliveryDeadlineFrom} onChange={(event) => updateDraft("deliveryDeadlineFrom", event.target.value)} /></Field>
                    <Field label="Entrega até"><input className={INPUT_CLASS} type="date" value={draft.deliveryDeadlineTo} onChange={(event) => updateDraft("deliveryDeadlineTo", event.target.value)} /></Field>
                    <Field label="Cadastro de"><input className={INPUT_CLASS} type="date" value={draft.createdAtFrom} onChange={(event) => updateDraft("createdAtFrom", event.target.value)} /></Field>
                    <Field label="Cadastro até"><input className={INPUT_CLASS} type="date" value={draft.createdAtTo} onChange={(event) => updateDraft("createdAtTo", event.target.value)} /></Field>
                    <Field label="Vence em até (dias)"><input className={INPUT_CLASS} type="number" min="0" step="1" value={draft.dueWithinDays} onChange={(event) => updateDraft("dueWithinDays", event.target.value)} placeholder="Ex.: 15" /></Field>
                  </div>
                  <div className="mt-6 flex justify-end gap-3"><button type="button" className={SECONDARY_BUTTON_CLASS} onClick={clearFilters}>Limpar</button><button type="submit" className={BUTTON_CLASS}><Search size={17} /> Aplicar filtros</button></div>
                </div>
              )}
            </form>
          </div>
        </section>

        
<section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
  <div className="flex flex-col justify-between gap-4 border-b border-[#f0ece5] p-5 sm:p-6 lg:flex-row lg:items-center">
    <div>
      <h2 className="text-lg font-semibold text-[#342d27]">Histórico</h2>
      <p className="mt-1 text-sm text-[#81766b]">
        {loading
          ? "Carregando vendas..."
          : `${totalElements} ${totalElements === 1 ? " encontrada" : " encontradas"}`}
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
    <table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
      <colgroup>
        <col style={{ width: "15%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "19%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "11%" }} />
      </colgroup>

      <thead className="bg-[#f8f5f0]">
        <tr className="text-xs font-semibold uppercase tracking-wide text-[#81766b]">
          <th className="px-5 py-4">Cliente</th>
          <th className="px-5 py-4">Produtos</th>
          <th className="px-5 py-4">Valor total</th>
          <th className="px-5 py-4">Recebido / restante</th>
          <th className="px-5 py-4">Pagamento</th>
          <th className="px-5 py-4">Entrega</th>
          <th className="px-3 py-4 text-center">Visualizar / Editar</th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td
              colSpan={7}
              className="px-5 py-16 text-center text-sm text-[#81766b]"
            >
              Carregando vendas...
            </td>
          </tr>
        ) : !result?.sales.length ? (
          <tr>
            <td
              colSpan={7}
              className="px-5 py-16 text-center text-sm text-[#81766b]"
            >
              Nenhuma venda encontrada. Experimente remover alguns filtros.
            </td>
          </tr>
        ) : (
          result.sales.map((sale) => {
            const shortId = sale.id.slice(0, 8).toUpperCase();
            const customerName =
              customerNames[sale.customerId] ?? "Cliente indisponível";

            
                return (
                <tr
                    key={sale.id}
                    onClick={() => router.push(`/vendas/${sale.id}`)}
                    className="cursor-pointer border-b border-[#eee8df] bg-white transition-colors even:bg-[#e9e4dc] hover:bg-[#ded7cc]"
                    >
                    <td className="px-5 py-4 align-middle">
                    <span
                        className="block truncate font-semibold text-[#342d27]"
                        title={customerName}
                    >
                        {customerName.slice(0, 13)}
                    </span>
                    <p className="mt-1 text-xs text-[#81766b]">
                        {formatDate(sale.createdAt)}
                    </p>
                    </td>

                    <td className="px-5 py-4 align-middle text-sm text-[#51473d]">
                    {sale.items.length}{" "}
                    {sale.items.length === 1 ? "item" : "itens"}
                    <p className="text-xs text-[#81766b]">
                        {sale.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                        )}{" "}
                        unidades
                    </p>
                    </td>

                    <td className="px-5 py-4 align-middle text-sm font-semibold text-[#342d27]">
                    {formatCurrency(sale.totalAmount)}
                    </td>

                    <td className="px-5 py-4 align-middle text-sm text-[#51473d]">
                    <p className="font-medium text-emerald-700">
                        {formatCurrency(sale.paidAmount)} recebido
                    </p>
                    <p className="text-xs text-[#81766b]">
                        {formatCurrency(sale.remainingAmount)} restante
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eee8df]">
                        <div
                        className="h-full rounded-full bg-[#a98a58]"
                        style={{
                            width: `${Math.min(
                            100,
                            Math.max(0, sale.paidPercentage),
                            )}%`,
                        }}
                        />
                    </div>
                    </td>

                    <td className="px-5 py-4 align-middle">
                    <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                        sale.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : sale.paymentStatus === "UNPAID"
                            ? "bg-red-50 text-red-700 ring-red-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                    >
                        {sale.paidPercentage}% pago
                    </span>
                    <p className="mt-1 text-xs text-[#81766b]">
                        {{
                        PIX: "Pix",
                        CASH: "Dinheiro",
                        CREDIT_CARD: "Cartão de crédito",
                        DEBIT_CARD: "Cartão de débito",
                        BANK_TRANSFER: "Transferência bancária",
                        }[sale.paymentMethod] ?? sale.paymentMethod}
                    </p>
                    </td>

                    <td className="px-5 py-4 align-middle">
                    <DeadlineBadge status={sale.deadlineStatus} />
                    <p className="mt-1 text-xs text-[#81766b]">
                        {formatDate(sale.deliveryDeadline)}
                    </p>
                    </td>

                    <td className="px-3 py-4 align-middle">
                    
                        <div className="flex items-center justify-center gap-2">
                        <Link
                            href={`/vendas/${sale.id}`}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Visualizar venda ${shortId}`}
                            title="Visualizar venda"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a98a58] transition group-hover:bg-[#f2e9da] group-hover:text-[#735a36] hover:bg-[#e8d9c1]"
                        >
                            <Eye size={19} />
                        </Link>

                        <button
                            type="button"
                            title="Editar dados da venda"
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Editar venda ${shortId}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a98a58] transition hover:bg-[#f2e9da]"
                        >
                            <Pencil size={18} />
                        </button>
                        </div>

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
      <strong className="text-[#342d27]">{firstElement}</strong> a{" "}
      <strong className="text-[#342d27]">{lastElement}</strong> de{" "}
      <strong className="text-[#342d27]">{totalElements}</strong> resultados
    </p>

    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setPage((previous) => Math.max(0, previous - 1))}
        disabled={loading || !pagination?.hasPrevious}
        className={SECONDARY_BUTTON_CLASS}
      >
        <ChevronLeft size={17} />
        Anterior
      </button>

      <span className="whitespace-nowrap text-sm font-medium text-[#51473d]">
        Página {pagination?.totalPages ? currentPage + 1 : 0} de{" "}
        {pagination?.totalPages ?? 0}
      </span>

      <button
        type="button"
        onClick={() => setPage((previous) => previous + 1)}
        disabled={loading || !pagination?.hasNext}
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