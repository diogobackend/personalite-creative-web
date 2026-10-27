"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Boxes, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  Filter, Plus, RefreshCw, Search, X, Eye, Pencil,
} from "lucide-react";

import { api } from "../../src/lib/api";
import DashboardLayout from "../../src/components/layout/DashboardLayout";

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

type InventoryPage = {
  content: Inventory[];
  page: number;
  size: number;
  totalElements: number;
  totalElementsThisPage: number;
  totalPages: number;
};

type Filters = {
  sku: string;
  name: string;
  category: string;
  description: string;
  quantity: string;
  minQuantity: string;
  maxQuantity: string;
  unit: string;
  color: string;
  size: string;
  material: string;
  brand: string;
  model: string;
  createdAt: string;
  createdFrom: string;
  createdTo: string;
};

const EMPTY_FILTERS: Filters = {
  sku: "", name: "", category: "", description: "", quantity: "",
  minQuantity: "", maxQuantity: "", unit: "", color: "", size: "",
  material: "", brand: "", model: "", createdAt: "", createdFrom: "", createdTo: "",
};

const CATEGORY_OPTIONS = [
  ["GOURMET", "Gourmet"], ["AGUAS", "Águas"], ["GARRAFAS", "Garrafas"],
  ["GLOSS", "Gloss"], ["BOLSAS", "Bolsas"], ["NECESSAIRES", "Necessaires"],
  ["LENCOS", "Lenços"], ["PAPELARIA", "Papelaria"], ["CAIXAS", "Caixas"],
  ["KITS", "Kits"],
] as const;

const UNIT_OPTIONS = [
  ["UN", "Unidade (un)"], ["PAR", "Par"], ["KIT", "Kit"],
  ["CX", "Caixa"], ["PCT", "Pacote"], ["DZ", "Dúzia"],
  ["M", "Metro (m)"], ["CM", "Centímetro (cm)"],
  ["M2", "Metro quadrado (m²)"], ["KG", "Quilograma (kg)"],
  ["G", "Grama (g)"], ["L", "Litro (L)"], ["ML", "Mililitro (mL)"],
  ["ROLO", "Rolo"], ["FOLHA", "Folha"],
] as const;

const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG"] as const;

const SORT_OPTIONS = [
  ["name", "Nome"], ["category", "Categoria"], ["quantity", "Quantidade"],
  ["unit", "Unidade"], ["color", "Cor"], ["size", "Tamanho"],
  ["material", "Material"], ["brand", "Marca"], ["model", "Modelo"],
  ["sku", "SKU"], ["createdAt", "Data de cadastro"],
  ["updatedAt", "Última atualização"],
] as const;

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border border-[#e8e0d4] bg-white px-3 py-2.5 text-sm font-normal text-[#342d27] outline-none transition focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";
const BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#342d27] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#51473d] disabled:opacity-50";
const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e0d4] bg-white px-4 py-2.5 text-sm font-medium text-[#51473d] transition hover:bg-[#f7f3ed] disabled:cursor-not-allowed disabled:opacity-50";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-stone-600">
      {label}
      {children}
    </label>
  );
}

function getLabel(value: string | null, options: readonly (readonly [string, string])[]) {
  if (!value) return "—";
  return options.find(([key]) => key === value)?.[1] ?? value;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = value.split("T")[0];
  const parts = date.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function buildParams(filters: Filters, page: number, size: number, sortBy: string, sortDirection: string) {
  const params = new URLSearchParams();
  const sku = filters.sku.trim();

  if (sku) {
    // SKU soberano: não enviar filtros, paginação ou ordenação conflitantes.
    params.set("sku", sku);
    return params;
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (key !== "sku" && value.trim()) params.set(key, value.trim());
  });

  params.set("page", String(page));
  params.set("pageSize", String(size));
  params.set("sortBy", sortBy);
  params.set("sortDirection", sortDirection);
  return params;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Não foi possível conectar ao servidor.";
    if (error.response.status === 401) return "Sua sessão expirou. Faça login novamente.";
    if (error.response.status === 403) return "Você não possui permissão para consultar o estoque.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    return `Não foi possível consultar o estoque (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : "Ocorreu um erro ao consultar o estoque.";
}

export default function EstoquePage() {
  const [draft, setDraft] = useState<Filters>({ ...EMPTY_FILTERS });
  const [applied, setApplied] = useState<Filters>({ ...EMPTY_FILTERS });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [result, setResult] = useState<InventoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const update = (field: keyof Filters, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setApplied({ ...draft });
  };

  const clearFilters = () => {
    setDraft({ ...EMPTY_FILTERS });
    setApplied({ ...EMPTY_FILTERS });
    setPage(0);
  };

  const fetchInventory = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token || token === "undefined" || token === "null") {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      const params = buildParams(applied, page, size, sortBy, sortDirection);
      const { data } = await api.get<InventoryPage>(`/inventory?${params.toString()}`, {
        signal,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!signal.aborted) setResult(data);
    } catch (cause) {
      if (signal.aborted || axios.isCancel(cause)) return;
      setResult(null);
      setError(getErrorMessage(cause));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [applied, page, size, sortBy, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchInventory(controller.signal);
    return () => controller.abort();
  }, [fetchInventory, reloadKey]);

  const hasFilters = Object.values(applied).some((value) => value.trim() !== "");
  const skuActive = applied.sku.trim() !== "";
  const totalElements = result?.totalElements ?? 0;
  const totalPages = result?.totalPages ?? 0;
  const currentPage = result?.page ?? 0;
  const firstElement = totalElements ? currentPage * result!.size + 1 : 0;
  const lastElement = totalElements ? Math.min(firstElement + result!.totalElementsThisPage - 1, totalElements) : 0;

  return (
    <DashboardLayout>
      <main className="space-y-6 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="mt-2 font-serif text-3xl text-[#342d27] sm:text-4xl">Estoque</h1>
            <p className="mt-2 text-sm text-[#81766b]">Consulte materiais, insumos e quantidades disponíveis.</p>
          </div>
          <Link href="/estoque/novo" className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#927448]">
            <Plus size={18} /> Cadastrar item
          </Link>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
          <form onSubmit={applyFilters}>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto] lg:items-end">
              <Field label="Nome">
                <div className="relative">
                  <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a98a58]" />
                  <input className={`${INPUT_CLASS} pl-10`} placeholder="Buscar item pelo nome" value={draft.name} onChange={(e) => update("name", e.target.value)} />
                </div>
              </Field>
              <Field label="SKU">
                <input className={INPUT_CLASS} placeholder="Ex.: GAR-AZUL-001" value={draft.sku} onChange={(e) => update("sku", e.target.value)} />
              </Field>
              <button type="submit" className={BUTTON_CLASS}><Search size={17} /> Buscar</button>
              <button type="button" onClick={() => setFiltersOpen((value) => !value)} className={SECONDARY_BUTTON_CLASS}>
                <Filter size={17} /> Filtros {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {filtersOpen && (
              <div className="border-t border-[#f0ece5] bg-[#fdfcfb] px-5 py-6 sm:px-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[#342d27]">Filtros avançados</h2>
                  <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#927448] hover:text-[#725934]"><X size={15} /> Limpar filtros</button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <Field label="Categoria">
                    <select className={INPUT_CLASS} value={draft.category} onChange={(e) => update("category", e.target.value)}>
                      <option value="">Todas as categorias</option>
                      {CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                  <Field label="Descrição"><input className={INPUT_CLASS} placeholder="Buscar na descrição" value={draft.description} onChange={(e) => update("description", e.target.value)} /></Field>
                  
                  <Field label="Quantidade mínima"><input type="number" min="0" step="1" className={INPUT_CLASS} placeholder="De" value={draft.minQuantity} onChange={(e) => update("minQuantity", e.target.value)} /></Field>
                  <Field label="Quantidade máxima"><input type="number" min="0" step="1" className={INPUT_CLASS} placeholder="Até" value={draft.maxQuantity} onChange={(e) => update("maxQuantity", e.target.value)} /></Field>
                  <Field label="Quantidade exata"><input type="number" min="0" step="1" className={INPUT_CLASS} placeholder="Ex.: 50" value={draft.quantity} onChange={(e) => update("quantity", e.target.value)} /></Field>
                  <Field label="Unidade de medida">
                    <select className={INPUT_CLASS} value={draft.unit} onChange={(e) => update("unit", e.target.value)}>
                      <option value="">Todas as unidades</option>
                      {UNIT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                  <Field label="Cor"><input className={INPUT_CLASS} placeholder="Ex.: Branco" value={draft.color} onChange={(e) => update("color", e.target.value)} /></Field>
                  <Field label="Tamanho">
                    <select className={INPUT_CLASS} value={draft.size} onChange={(e) => update("size", e.target.value)}>
                      <option value="">Todos os tamanhos</option>
                      {SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </Field>
                  <Field label="Material"><input className={INPUT_CLASS} placeholder="Ex.: Algodão" value={draft.material} onChange={(e) => update("material", e.target.value)} /></Field>
                  <Field label="Marca"><input className={INPUT_CLASS} placeholder="Buscar marca" value={draft.brand} onChange={(e) => update("brand", e.target.value)} /></Field>
                  <Field label="Modelo"><input className={INPUT_CLASS} placeholder="Buscar modelo" value={draft.model} onChange={(e) => update("model", e.target.value)} /></Field>
                  <Field label="Data exata de cadastro"><input type="date" className={INPUT_CLASS} value={draft.createdAt} onChange={(e) => update("createdAt", e.target.value)} /></Field>
                  <Field label="Cadastro a partir de"><input type="date" className={INPUT_CLASS} value={draft.createdFrom} onChange={(e) => update("createdFrom", e.target.value)} /></Field>
                  <Field label="Cadastro até"><input type="date" className={INPUT_CLASS} value={draft.createdTo} onChange={(e) => update("createdTo", e.target.value)} /></Field>
                </div>
                
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button type="button" onClick={clearFilters} className={SECONDARY_BUTTON_CLASS}><X size={16} /> Limpar</button>
                  <button type="submit" className={BUTTON_CLASS}><Search size={17} /> Aplicar filtros</button>
                </div>
              </div>
            )}
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#f0ece5] p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-[#342d27]">Itens cadastrados</h2>
              <p className="mt-1 text-sm text-[#81766b]">
                {loading ? "Carregando estoque..." : `${totalElements} ${totalElements === 1 ? "item encontrado" : "itens encontrados"}`}
                {hasFilters ? " · Filtros aplicados" : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Ordenar por">
                <select className={INPUT_CLASS} value={sortBy} disabled={skuActive} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
                  {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Direção">
                <select className={INPUT_CLASS} value={sortDirection} disabled={skuActive} onChange={(e) => { setSortDirection(e.target.value); setPage(0); }}>
                  <option value="ASC">Crescente</option><option value="DESC">Decrescente</option>
                </select>
              </Field>
              <Field label="Por página">
                <select className={INPUT_CLASS} value={size} disabled={skuActive} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}>
                  {[10, 20, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </Field>
              <button type="button" aria-label="Atualizar estoque" title="Atualizar estoque" disabled={loading} onClick={() => setReloadKey((value) => value + 1)} className={SECONDARY_BUTTON_CLASS}>
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {error ? (
            <div role="alert" className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-red-700">{error}</p>
              <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 text-sm font-semibold text-[#a98a58]">Tentar novamente</button>
            </div>
          ) : loading ? (
            <div className="px-6 py-16 text-center text-sm text-[#81766b]">Consultando estoque...</div>
          ) : !result?.content.length ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <Boxes size={40} className="mb-4 text-[#cbb58e]" />
              <h3 className="text-base font-semibold text-[#342d27]">Nenhum item encontrado</h3>
              <p className="mt-2 text-sm text-[#81766b]">Ajuste os filtros ou cadastre um novo item.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-[#f8f5f0] text-xs font-semibold uppercase tracking-wide text-[#81766b]">
                  <tr>
                    <th className="px-5 py-4">Item</th>
                    <th className="px-5 py-4">SKU</th>
                    <th className="px-5 py-4">Categoria</th>
                    <th className="px-5 py-4">Quantidade</th>
                    <th className="px-5 py-4">Unidade</th>
                    <th className="px-5 py-4">Cadastro</th>
                    <th className="px-5 py-4 text-center">Visualizar / Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {result.content.map((item) => {
                    const lowStock = item.minimumQuantity !== null && item.quantity <= item.minimumQuantity;
                    return (
                      <tr key={item.id} className="border-b border-[#eee8df] odd:bg-white even:bg-[#e9e3da] transition-colors hover:!bg-[#ded3c4]">
                        <td className="px-5 py-4">
                          <Link href={`/estoque/${item.id}`} className="block max-w-[230px] truncate text-sm font-semibold text-[#342d27] transition hover:text-[#a98a58] hover:underline" title="Vizualizar item">{item.name}</Link>
                          {item.description && <p className="mt-1 max-w-[230px] truncate text-xs text-[#81766b]" title={item.description}>{item.description}</p>}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-[#927448]">{item.sku || "—"}</td>
                        <td className="px-5 py-4 text-sm text-[#51473d]">{getLabel(item.category, CATEGORY_OPTIONS)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-semibold ${lowStock ? "text-red-700" : "text-[#342d27]"}`}>{item.quantity}</span>
                          {lowStock && <span className="ml-2 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Estoque baixo</span>}
                          {item.minimumQuantity !== null && <p className="mt-1 text-xs text-[#81766b]">Mín.: {item.minimumQuantity}</p>}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#51473d]">{getLabel(item.unit, UNIT_OPTIONS)}</td>
                        <td className="px-5 py-4 text-sm text-[#51473d]">{formatDate(item.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/estoque/${item.id}`} title="Visualizar item" aria-label={`Visualizar ${item.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a98a58] transition hover:bg-white/70 hover:text-[#806438]">
                              <Eye size={19} />
                            </Link>
                            <Link href={`/estoque/${item.id}/editar`} title="Editar item" aria-label={`Editar ${item.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a98a58] transition hover:bg-white/70 hover:text-[#806438]">
                              <Pencil size={18} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && result && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eee8df] px-5 py-4 sm:px-6">
              <p className="text-sm text-[#81766b]">Exibindo <strong className="text-[#342d27]">{firstElement}</strong> a <strong className="text-[#342d27]">{lastElement}</strong> de <strong className="text-[#342d27]">{totalElements}</strong> resultados</p>
              <div className="flex items-center gap-3">
                <button type="button" disabled={loading || skuActive || page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className={SECONDARY_BUTTON_CLASS}><ChevronLeft size={17} /> Anterior</button>
                <span className="whitespace-nowrap text-sm font-medium text-[#51473d]">Página {totalPages === 0 ? 0 : currentPage + 1} de {totalPages}</span>
                <button type="button" disabled={loading || skuActive || totalPages === 0 || page >= totalPages - 1} onClick={() => setPage((value) => value + 1)} className={SECONDARY_BUTTON_CLASS}>Próxima <ChevronRight size={17} /></button>
              </div>
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}
