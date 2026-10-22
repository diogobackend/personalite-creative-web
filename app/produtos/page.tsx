"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import Link from "next/link";
import axios from "axios";
import { api } from "../../src/lib/api";

import {

  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Filter,

  Package, Plus, RefreshCw, Search, SlidersHorizontal, X, Pencil,

} from "lucide-react";

import DashboardLayout from "../../src/components/layout/DashboardLayout";

type Category = "GOURMET" | "AGUAS" | "GARRAFAS" | "GLOSS" | "BOLSAS" | "NECESSAIRES" | "LENCOS" | "PAPELARIA" | "CAIXAS" | "KITS";

type PricingType = "FIXED" | "TIERED" | "QUOTE";

type ChargeType = "PER_ORDER" | "PER_UNIT" | "FIRST_PURCHASE";

type ProductPrice = {

  id: string;

  minimumQuantity: number;

  unitPrice: number;

  createdAt: string;

  updatedAt: string;

};

type ProductFee = {

  id: string;

  name: string;

  amount: number;

  chargeType: ChargeType;

  required: boolean;

  active: boolean;

  createdAt: string;

  updatedAt: string;

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

  createdAt: string;

  updatedAt: string;

};

type ProductsPage = {

  content: Product[];

  page: number;

  size: number;

  totalElementsThisPage: number;

  totalElements: number;

  totalPages: number;

};

type Filters = {

  code: string; name: string; description: string; category: string;

  active: string; pricingType: string; feeName: string; chargeType: string;

  minQuantity: string; maxQuantity: string;

  minShelfLifeDays: string; maxShelfLifeDays: string;

  minPrice: string; maxPrice: string;

  minFeeAmount: string; maxFeeAmount: string;

  hasFees: string; createdFrom: string; createdTo: string;

};

const initialFilters: Filters = {

  code: "", name: "", description: "", category: "", active: "",

  pricingType: "", feeName: "", chargeType: "", minQuantity: "",

  maxQuantity: "", minShelfLifeDays: "", maxShelfLifeDays: "",

  minPrice: "", maxPrice: "", minFeeAmount: "", maxFeeAmount: "",

  hasFees: "", createdFrom: "", createdTo: "",

};

const categories: Record<Category, string> = {

  GOURMET: "Gourmet", AGUAS: "Águas", GARRAFAS: "Garrafas",

  GLOSS: "Gloss", BOLSAS: "Bolsas", NECESSAIRES: "Necessaires",

  LENCOS: "Lenços", PAPELARIA: "Papelaria", CAIXAS: "Caixas", KITS: "Kits",

};

const pricingLabels: Record<PricingType, string> = {

  FIXED: "Preço fixo", TIERED: "Por quantidade", QUOTE: "Sob consulta",

};

const chargeLabels: Record<ChargeType, string> = {

  PER_ORDER: "Por pedido", PER_UNIT: "Por unidade", FIRST_PURCHASE: "Primeira compra",

};

const sortOptions = [

  ["name", "Nome"], ["code", "Código"], ["createdAt", "Data de cadastro"],

  ["updatedAt", "Última atualização"], ["minimumQuantity", "Quantidade mínima"],

  ["shelfLifeDays", "Validade"], ["price", "Menor preço"],

];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function toIso(value: string) {

  return value ? new Date(value).toISOString() : "";

}

function Field({ label, children }: { label: string; children: ReactNode }) {

  return (

    <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-stone-600">

      {label}

      {children}

    </label>

  );

}

const inputClass = "w-full min-w-0 rounded-xl border border-[#e8e0d4] bg-white px-3 py-2.5 text-sm font-normal text-[#342d27] outline-none transition focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";

export default function ProductsPageScreen() {

  const [draft, setDraft] = useState<Filters>(initialFilters);

  const [applied, setApplied] = useState<Filters>(initialFilters);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [page, setPage] = useState(0);

  const [size, setSize] = useState(20);

  const [sortBy, setSortBy] = useState("name");

  const [sortDirection, setSortDirection] = useState("ASC");

  const [result, setResult] = useState<ProductsPage | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const update = (field: keyof Filters, value: string) => setDraft((current) => ({ ...current, [field]: value }));

  const fetchProducts = useCallback(async (signal: AbortSignal) => {

    const token = localStorage.getItem("access_token");

    if (!token) return;

    setLoading(true);

    setError(null);

    try {

      const params = new URLSearchParams();

      Object.entries(applied).forEach(([key, value]) => {

        if (value !== "") params.set(key, key === "createdFrom" || key === "createdTo" ? toIso(value) : value);

      });

      params.set("page", String(page));

      params.set("size", String(size));

      params.set("sortBy", sortBy);

      params.set("sortDirection", sortDirection);

      const { data } = await api.get<ProductsPage>(`/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });

      if (!signal.aborted) setResult(data);

    } catch (cause) {

      if (!signal.aborted) {

        setResult(null);

        if (axios.isAxiosError(cause)) {
          const status = cause.response?.status;
          setError(
            status === 401 ? "Sessão expirada ou inválida. Faça login novamente."
              : status === 403 ? "Você não possui permissão para consultar produtos."
              : !cause.response ? "Não foi possível conectar ao servidor."
              : cause.response.data?.message || `Não foi possível consultar os produtos (HTTP ${status}).`
          );
        } else {
          setError(cause instanceof Error ? cause.message : "Erro inesperado ao carregar produtos.");
        }

      }

    } finally {

      if (!signal.aborted) setLoading(false);

    }

  }, [applied, page, size, sortBy, sortDirection, reloadKey]);

  useEffect(() => {

    const controller = new AbortController();

    void fetchProducts(controller.signal);

    return () => controller.abort();

  }, [fetchProducts]);

  const search = (event: React.FormEvent<HTMLFormElement>) => {

    event.preventDefault();

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

          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Produtos</h1>

          

        </div>

        <Link href="/produtos/novo" className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#927448]">

          <Plus className="h-4 w-4" /> Cadastrar produto

        </Link>

      </div>

      <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">

        <form onSubmit={search}>

          <div className="flex flex-wrap items-end gap-3 p-5 sm:p-6">

            <div className="min-w-[180px] flex-[2]">

              <Field label="">

                <div className="relative">

                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />

                  <input className={`${inputClass} pl-10`} placeholder="Buscar pelo nome do Produto..." value={draft.name} onChange={(e) => update("name", e.target.value)} />

                </div>

              </Field>

            </div>

            <div className="min-w-[110px] flex-1 sm:max-w-[180px]">

              <Field label="Código">

                <input className={inputClass} inputMode="numeric" maxLength={3} placeholder="Ex.: 011" value={draft.code} onChange={(e) => update("code", e.target.value.replace(/\D/g, ""))} />

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

              <div className="mb-5 flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4 text-[#a98a58]" /> Filtros avançados</div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                <Field label="Descrição"><input className={inputClass} value={draft.description} onChange={(e) => update("description", e.target.value)} placeholder="Buscar na descrição" /></Field>

                <Field label="Categoria"><select className={inputClass} value={draft.category} onChange={(e) => update("category", e.target.value)}><option value="">Todas</option>{Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>

                <Field label="Situação"><select className={inputClass} value={draft.active} onChange={(e) => update("active", e.target.value)}><option value="">Todas</option><option value="true">Ativo</option><option value="false">Inativo</option></select></Field>

                <Field label="Tipo de precificação"><select className={inputClass} value={draft.pricingType} onChange={(e) => update("pricingType", e.target.value)}><option value="">Todos</option>{Object.entries(pricingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>

                <Field label="Nome da taxa"><input className={inputClass} value={draft.feeName} onChange={(e) => update("feeName", e.target.value)} placeholder="Buscar taxa" /></Field>

                <Field label="Tipo de cobrança"><select className={inputClass} value={draft.chargeType} onChange={(e) => update("chargeType", e.target.value)}><option value="">Todos</option>{Object.entries(chargeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>

                <Field label="Possui taxas"><select className={inputClass} value={draft.hasFees} onChange={(e) => update("hasFees", e.target.value)}><option value="">Todos</option><option value="true">Sim</option><option value="false">Não</option></select></Field>

                {([

                  ["minQuantity", "Quantidade mínima — de"], ["maxQuantity", "Quantidade mínima — até"],

                  ["minShelfLifeDays", "Validade (dias) — de"], ["maxShelfLifeDays", "Validade (dias) — até"],

                  ["minPrice", "Preço unitário — de"], ["maxPrice", "Preço unitário — até"],

                  ["minFeeAmount", "Valor da taxa — de"], ["maxFeeAmount", "Valor da taxa — até"],

                ] as [keyof Filters, string][]).map(([key, label]) => (

                  <Field key={key} label={label}><input type="number" min="0" step={key.toLowerCase().includes("price") || key.toLowerCase().includes("amount") ? "0.01" : "1"} className={inputClass} value={draft[key]} onChange={(e) => update(key, e.target.value)} placeholder="Sem limite" /></Field>

                ))}


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

            <h2 className="text-base font-semibold">Produtos cadastrados</h2>

            <p className="mt-1 text-xs text-stone-400">{loading ? "Carregando..." : result ? `${result.totalElements} produto(s) encontrado(s)` : "Consulta de produtos"}{hasFilters ? " · Filtros aplicados" : ""}</p>

          </div>

          <div className="flex flex-wrap items-end gap-3">

            <Field label="Ordenar por"><select className={`${inputClass} w-auto min-w-[145px]`} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>

            <Field label="Direção"><select className={`${inputClass} w-auto`} value={sortDirection} onChange={(e) => { setSortDirection(e.target.value); setPage(0); }}><option value="ASC">Crescente</option><option value="DESC">Decrescente</option></select></Field>

            <Field label="Por página"><select className={`${inputClass} w-auto`} value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></Field>

            <button type="button" aria-label="Atualizar produtos" title="Atualizar produtos" onClick={() => setReloadKey((value) => value + 1)} className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#e8e0d4] text-stone-600 hover:bg-[#faf8f4]"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>

          </div>

        </div>

        {error ? (

          <div className="px-6 py-12 text-center"><p className="text-sm font-semibold text-red-700">{error}</p><button onClick={() => setReloadKey((value) => value + 1)} className="mt-4 text-sm font-semibold text-[#a98a58]">Tentar novamente</button></div>

        ) : loading ? (

          <div className="px-6 py-16 text-center text-sm text-stone-400">Consultando produtos...</div>

        ) : !result || result.content.length === 0 ? (

          <div className="flex flex-col items-center px-6 py-16 text-center"><Package className="mb-4 h-10 w-10 text-[#cbb58e]" /><h3 className="text-base font-semibold">Nenhum produto encontrado</h3><p className="mt-2 text-sm text-stone-400">Ajuste os filtros ou cadastre um novo produto.</p></div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[790px] text-left">

              <thead className="bg-[#faf9f7] text-xs font-medium text-stone-500"><tr><th className="px-6 py-4">Código</th><th className="px-4 py-4">Produto</th><th className="px-4 py-4">Categoria</th><th className="px-4 py-4">Preço inicial</th><th className="px-4 py-4">Qtd. mínima</th><th className="px-6 py-4 text-right">Visualizar</th></tr></thead>

              <tbody className="divide-y divide-[#f0ece5]">

                {result.content.map((product) => {

                  const lowestPrice = product.prices.length
                      ? [...product.prices].sort((a, b) => a.minimumQuantity - b.minimumQuantity)[0].unitPrice
                      : null;

                  return (

                    <tr
                      key={product.id}
                      className="odd:bg-white even:bg-[#e9e3da] hover:!bg-[#ded3c4] transition-colors"
                    >

                      <td className="px-6 py-4 text-sm font-semibold text-[#a98a58]">{product.code}</td>
                      <td className="px-4 py-4">
                      <Link
                        href={`/produtos/${product.id}`}
                        title="Visualizar produto"
                        className="block max-w-[280px] truncate text-sm font-semibold transition-colors hover:text-[#a98a58]"
                      >
                        {product.name}
                      </Link>
                    </td>
                      <td className="px-4 py-4 text-sm text-stone-600">{categories[product.category] || product.category}</td>
                      <td className="px-4 py-4 text-sm font-semibold">{lowestPrice == null ? "Sob consulta" : currency.format(lowestPrice)}</td>
                      <td className="px-4 py-4 text-sm text-stone-600">{product.minimumQuantity ?? "—"}</td>
                      <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/produtos/${product.id}`}
                          aria-label={`Visualizar produto ${product.name}`}
                          title="Visualizar produto"
                          className="inline-flex items-center justify-center rounded-lg p-2 text-[#a98a58] transition-colors hover:bg-[#f7f0e6] hover:text-[#927448]"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>

                        <Link
                          href={`/produtos/${product.id}/editar`}
                          aria-label={`Editar produto ${product.name}`}
                          title="Editar produto"
                          className="inline-flex items-center justify-center rounded-lg p-2 text-[#a98a58] transition-colors hover:bg-[#f7f0e6] hover:text-[#927448]"
                        >
                          <Pencil className="h-5 w-5" />
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

        {result && !loading && !error && (

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f0ece5] px-5 py-5 sm:px-7">

            <p className="text-xs text-stone-500">Exibindo {result.totalElementsThisPage} de {result.totalElements} produto(s) · Página {result.page + 1} de {Math.max(result.totalPages, 1)}</p>

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
