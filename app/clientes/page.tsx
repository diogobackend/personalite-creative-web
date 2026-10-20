"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import axios from "axios";
import {
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye,
  Filter, RefreshCw, Search, SlidersHorizontal, Users, X, Plus
} from "lucide-react";
import DashboardLayout from "../../src/components/layout/DashboardLayout";
import { api } from "../../src/lib/api";

type User = {
  userId: string;
  name: string;
  email: string;
  login: string;
  role: string;
  status: string;
  phone: string | null;
  cpf: string | null;
  rg: string | null;
  address: string | null;
  birthDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type PagedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElementsThisPage: number;
  totalElements: number;
  totalPages: number;
};

type Filters = {
  name: string;
  email: string;
  login: string;
  phone: string;
  cpf: string;
  rg: string;
  address: string;
  status: string;
  birthDate: string;
  dateField: string;
  dateFrom: string;
  dateTo: string;
};

const initialFilters: Filters = {
  name: "", email: "", login: "", phone: "", cpf: "", rg: "",
  address: "", status: "", birthDate: "", dateField: "", dateFrom: "",
  dateTo: "",
};

const inputClass =
  "w-full min-w-0 rounded-xl border border-[#e8e0d4] bg-white px-3 py-2.5 text-sm font-normal text-[#342d27] outline-none transition focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";

const sortOptions = [
  ["name", "Nome"],
  ["email", "E-mail"],
  ["login", "Login"],
  ["createdAt", "Data de cadastro"],
  ["updatedAt", "Última atualização"],
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-stone-600">
      {label}
      {children}
    </label>
  );
}

function formatPhone(value: string | null) {
  return value?.trim() || "—";
}

function getRequestError(error: unknown): string {
  if (axios.isCancel(error)) return "";
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Sessão expirada ou inválida. Faça login novamente.";
    if (error.response?.status === 403) return "Você não possui permissão para consultar clientes.";
    if (!error.response) return "Não foi possível conectar ao servidor.";
    return `Não foi possível consultar clientes (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : "Erro inesperado ao carregar clientes.";
}

export default function ClientesPage() {
  const [draft, setDraft] = useState<Filters>(initialFilters);
  const [applied, setApplied] = useState<Filters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortBy, setSortBy] = useState("name");
  const [direction, setDirection] = useState("ASC");
  const [result, setResult] = useState<PagedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const update = (field: keyof Filters, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const fetchClients = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token || token === "undefined" || token === "null") {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        sortBy,
        direction,
        role: "CANDIDATE",
      });

      Object.entries(applied).forEach(([key, value]) => {
        if (value.trim()) params.set(key, value.trim());
      });

      const { data } = await api.get<PagedResponse<User>>(`/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });

      if (!signal.aborted) setResult(data);
    } catch (cause) {
      if (!signal.aborted) {
        const message = getRequestError(cause);
        if (message) {
          setResult(null);
          setError(message);
        }
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [applied, page, size, sortBy, direction, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchClients(controller.signal);
    return () => controller.abort();
  }, [fetchClients]);

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if ((draft.dateFrom || draft.dateTo) && !draft.dateField) {
      setError("Selecione qual data deseja filtrar no período.");
      return;
    }
    if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) {
      setError("A data inicial não pode ser posterior à data final.");
      return;
    }
    setError(null);
    setPage(0);
    setApplied({ ...draft });
  };

  const clear = () => {
    setDraft({ ...initialFilters });
    setApplied({ ...initialFilters });
    setPage(0);
  };

  const hasFilters = Object.values(applied).some(Boolean);

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Clientes</h1>
        </div>

        <Link
          href="/clientes/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#927448]"
        >
          <Plus className="h-4 w-4" />
          Cadastrar cliente
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
        <form onSubmit={search}>
          <div className="flex flex-wrap items-end gap-3 p-5 sm:p-6">
            <div className="min-w-[190px] flex-[2]">
              <Field label="Cliente">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <input className={`${inputClass} pl-10`} placeholder="Buscar pelo nome..." value={draft.name} onChange={(e) => update("name", e.target.value)} />
                </div>
              </Field>
            </div>
            <div className="min-w-[180px] flex-1">
              <Field label="E-mail">
                <input type="text" className={inputClass} placeholder="Buscar pelo e-mail..." value={draft.email} onChange={(e) => update("email", e.target.value)} />
              </Field>
            </div>
            <button type="submit" className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-[#39342f] px-5 text-sm font-semibold text-white hover:bg-[#514941]">
              <Search className="h-4 w-4" /> Buscar
            </button>
            <button type="button" onClick={() => setFiltersOpen((current) => !current)} className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border border-[#e8e0d4] px-4 text-sm font-semibold text-stone-600 hover:bg-[#faf8f4]">
              <SlidersHorizontal className="h-4 w-4" /> Filtros {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {filtersOpen && (
            <div className="border-t border-[#f0ece5] bg-[#fdfcfb] px-5 py-6 sm:px-6">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
                <Filter className="h-4 w-4 text-[#a98a58]" /> Filtros avançados
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Field label="Telefone"><input className={inputClass} value={draft.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Telefone" /></Field>
                <Field label="CPF"><input className={inputClass} value={draft.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="CPF" /></Field>
                <Field label="RG"><input className={inputClass} value={draft.rg} onChange={(e) => update("rg", e.target.value)} placeholder="RG" /></Field>
                <Field label="Endereço"><input className={inputClass} value={draft.address} onChange={(e) => update("address", e.target.value)} placeholder="Endereço" /></Field>
                <Field label="Situação"><select className={inputClass} value={draft.status} onChange={(e) => update("status", e.target.value)}><option value="">Todas</option><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option><option value="BLOCKED">Bloqueado</option></select></Field>
                <Field label="Data exata de Nascimento">
                  <input type="date" className={inputClass} value={draft.birthDate} onChange={(e) => update("birthDate", e.target.value)} />
                </Field>
              </div>

              <div className="mt-6 rounded-xl border border-[#eee7dc] bg-white p-4 sm:p-5">
                <p className="text-sm font-semibold text-[#342d27]">Filtrar por período</p>
                <p className="mt-1 text-xs text-stone-500">Escolha uma data e informe o início e/ou o fim do período.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Field label="Qual data?">
                    <select className={inputClass} value={draft.dateField} onChange={(e) => update("dateField", e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="createdAt">Data de cadastro</option>
                      <option value="updatedAt">Última atualização</option>
                      <option value="birthDate">Data de nascimento</option>
                    </select>
                  </Field>
                  <Field label="De">
                    <input type="date" className={inputClass} value={draft.dateFrom} onChange={(e) => update("dateFrom", e.target.value)} />
                  </Field>
                  <Field label="Até">
                    <input type="date" className={inputClass} min={draft.dateFrom || undefined} value={draft.dateTo} onChange={(e) => update("dateTo", e.target.value)} />
                  </Field>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button type="button" onClick={clear} className="inline-flex items-center gap-2 rounded-xl border border-[#e8e0d4] px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-white"><X className="h-4 w-4" /> Limpar filtros</button>
                <button type="submit" className="rounded-xl bg-[#a98a58] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#927448]">Aplicar filtros</button>
              </div>
            </div>
          )}
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#f0ece5] px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-base font-semibold">Clientes cadastrados</h2>
            <p className="mt-1 text-xs text-stone-400">
              {loading ? "Carregando..." : result ? `${result.totalElements} cliente(s) encontrado(s)` : "Consulta de clientes"}
              {hasFilters ? " · Filtros aplicados" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Ordenar por"><select className={`${inputClass} w-auto min-w-[145px]`} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Direção"><select className={`${inputClass} w-auto`} value={direction} onChange={(e) => { setDirection(e.target.value); setPage(0); }}><option value="ASC">Crescente</option><option value="DESC">Decrescente</option></select></Field>
            <Field label="Por página"><select className={`${inputClass} w-auto`} value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></Field>
            <button type="button" aria-label="Atualizar clientes" title="Atualizar clientes" onClick={() => setReloadKey((value) => value + 1)} className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#e8e0d4] text-stone-600 hover:bg-[#faf8f4]"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-12 text-center"><p className="text-sm font-semibold text-red-700">{error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 text-sm font-semibold text-[#a98a58]">Tentar novamente</button></div>
        ) : loading ? (
          <div className="px-6 py-16 text-center text-sm text-stone-400">Consultando clientes...</div>
        ) : !result || result.content.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center"><Users className="mb-4 h-10 w-10 text-[#cbb58e]" /><h3 className="text-base font-semibold">Nenhum cliente encontrado</h3><p className="mt-2 text-sm text-stone-400">Ajuste os filtros para consultar outros clientes.</p></div>
        ) : (
          <div className="overflow-x-auto">
            
                <table className="w-full min-w-[600px] text-left">
                <thead className="bg-[#faf9f7] text-xs font-medium text-stone-500">
                <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-4 py-4">E-mail</th>
                    <th className="px-4 py-4">CPF</th>
                    <th className="px-6 py-4 text-right">Visualizar</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ece5]">
                {result.content.map((client) => (
                    <tr
                    key={client.userId}
                    className="transition-colors hover:bg-[#faf9f7]"
                    >
                    <td className="px-6 py-4 text-sm font-semibold text-[#342d27]">
                        {client.name}
                    </td>

                    <td className="px-4 py-4 text-sm text-stone-600">
                        {/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}@gmail\.com$/i.test(client.email)
                            ? "—"
                            : client.email}
                    </td>

                    <td className="px-4 py-4 text-sm text-stone-600">
                        {client.cpf || "—"}
                    </td>

                    <td className="px-6 py-4 text-right">
                        <Link
                        href={`/clientes/${client.userId}`}
                        aria-label={`Visualizar ${client.name}`}
                        title="Visualizar cliente"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a98a58] hover:bg-[#f7f0e6] hover:text-[#927448]"
                        >
                        <Eye className="h-5 w-5" />
                        </Link>
                    </td>
                    </tr>
                ))}
                </tbody>
                </table>

          </div>
        )}

        {result && !loading && !error && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f0ece5] px-5 py-5 sm:px-7">
            <p className="text-xs text-stone-500">Exibindo {result.totalElementsThisPage} de {result.totalElements} cliente(s) · Página {result.page + 1} de {Math.max(result.totalPages, 1)}</p>
            <div className="flex gap-2">
              <button type="button" disabled={result.page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-1 rounded-xl border border-[#e8e0d4] px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Anterior</button>
              <button type="button" disabled={result.page + 1 >= result.totalPages} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 rounded-xl border border-[#e8e0d4] px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40">Próxima <ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
