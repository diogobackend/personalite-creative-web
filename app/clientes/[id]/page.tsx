"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Eye, Pencil, Plus, UserRound } from "lucide-react";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";
import { api } from "../../../src/lib/api";
import Loading from "@/src/components/layout/Loading";

type Client = {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  rg: string | null;
  address: string | null;
  birthDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type Sale = {
  id: string;
  customerId: string;
  totalAmount: number;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  paymentMethod?: string | null;
  createdAt: string;
  observation?: string | null;
  deliveryDeadline?: string | null;
  deliveredAt?: string | null;
  remainingAmount?: number;
  items?: Array<{ productId: string; quantity: number; color?: string | null; brand?: string | null; model?: string | null; size?: string | null; material?: string | null }>;
};
type SalesResponse = { sales: Sale[]; pagination: { totalPages: number } };
type ProductInfo = { id: string; name: string; category?: string | null; categoryId?: string | null };
type Category = { id: string; name: string; type: string };

const uuidEmail = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}@gmail\.com$/i;
const display = (value: string | null | undefined) => value?.trim() || "—";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR");
const paymentLabels: Record<Sale["paymentStatus"], string> = { UNPAID: "Não paga", PARTIALLY_PAID: "Parcialmente paga", PAID: "Paga" };
const paymentClasses: Record<Sale["paymentStatus"], string> = {
  UNPAID: "bg-red-50 text-red-700", PARTIALLY_PAID: "bg-amber-50 text-amber-700", PAID: "bg-green-50 text-green-700",
};
const methodLabels: Record<string, string> = {
  DEBIT_CARD: "Cartão de débito", CREDIT_CARD: "Cartão de crédito", PIX: "Pix", CASH: "Dinheiro", BANK_TRANSFER: "Transferência bancária", BOLETO: "Boleto",
};
function date(value: string | null | undefined) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}
function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[#eee8df] bg-[#fdfcfb] px-4 py-4">
    <dt className="mb-2 text-xs font-semibold text-stone-500">{label}</dt>
    <dd className="break-words text-sm font-medium text-[#342d27]">{value}</dd>
  </div>;
}
const fieldClass = "mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98a58]";

function ClientDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [productsById, setProductsById] = useState<Record<string, ProductInfo>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productOptionsOpen, setProductOptionsOpen] = useState(false);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [valueFrom, setValueFrom] = useState("");
  const [valueTo, setValueTo] = useState("");
  const [status, setStatus] = useState("");
  const [advanced, setAdvanced] = useState<Record<string, string>>({});
  const setAdvancedField = (key: string, value: string) => setAdvanced((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") throw new Error("Sessão não encontrada. Faça login novamente.");
        const { data } = await api.get<Client>("/users/id", {
          params: { userId: id },
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setClient(data);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setClient(null);
        if (axios.isAxiosError(cause)) {
          if (cause.response?.status === 404) setError("Cliente não encontrado.");
          else if (cause.response?.status === 401) setError("Sessão expirada ou inválida. Faça login novamente.");
          else if (cause.response?.status === 403) setError("Você não possui permissão para visualizar este cliente.");
          else setError(cause.response?.data?.message || "Não foi possível carregar o cliente.");
        } else setError(cause instanceof Error ? cause.message : "Erro inesperado.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    async function loadSales() {
      setSalesLoading(true);
      setSalesError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") throw new Error("Sessão não encontrada. Faça login novamente.");
        const collected: Sale[] = [];
        let page = 0;
        let totalPages = 1;
        do {
          const { data } = await api.get<SalesResponse>("/sales", {
            params: { page, size: 100, sortBy: "createdAt", sortDirection: "DESC" },
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          collected.push(...(data.sales ?? []).filter((sale) => sale.customerId === id));
          totalPages = data.pagination?.totalPages ?? 1;
          page += 1;
        } while (page < totalPages && !controller.signal.aborted);
        if (!controller.signal.aborted) setSales(collected.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      } catch (cause) {
        if (!controller.signal.aborted) setSalesError(axios.isAxiosError(cause) ? `Não foi possível carregar as compras${cause.response ? ` (HTTP ${cause.response.status})` : ""}.` : cause instanceof Error ? cause.message : "Erro ao carregar compras.");
      } finally { if (!controller.signal.aborted) setSalesLoading(false); }
    }
    void loadSales();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCategories() {
      try {
        const token = localStorage.getItem("access_token");
        const { data } = await api.get<Category[]>("/categories", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setCategories(data.filter((category) => category.type === "PRODUCT")
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
        }
      } catch { if (!controller.signal.aborted) setCategories([]); }
    }
    void loadCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const ids = [...new Set(sales.flatMap((sale) => (sale.items ?? []).map((item) => item.productId)))];
    if (!ids.length) { setProductsById({}); return; }
    async function loadPurchasedProducts() {
      const token = localStorage.getItem("access_token");
      const entries = await Promise.all(ids.map(async (productId) => {
        try {
          const { data } = await api.get<ProductInfo>(`/products/${encodeURIComponent(productId)}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          return [productId, data] as const;
        } catch { return null; }
      }));
      if (!controller.signal.aborted) {
        setProductsById(Object.fromEntries(entries.filter((entry): entry is readonly [string, ProductInfo] => entry !== null)));
      }
    }
    void loadPurchasedProducts();
    return () => controller.abort();
  }, [sales]);

  const purchasedProducts = useMemo(() =>
    Object.values(productsById).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [productsById],
  );

  const filteredSales = useMemo(() => sales.filter((sale) => {
    if (selectedProductId && !(sale.items ?? []).some((item) => item.productId === selectedProductId)) return false;
    const day = sale.createdAt.slice(0, 10);
    if (dateFrom && day < dateFrom) return false;
    if (dateTo && day > dateTo) return false;
    if (valueFrom && sale.totalAmount < Number(valueFrom)) return false;
    if (valueTo && sale.totalAmount > Number(valueTo)) return false;
    if (status && sale.paymentStatus !== status) return false;
    const includes = (value: string | null | undefined, term: string) => (value ?? "").toLocaleLowerCase("pt-BR").includes(term.trim().toLocaleLowerCase("pt-BR"));
    if (advanced.general && !includes([sale.observation, sale.id].join(" "), advanced.general)) return false;
    if (advanced.observation && !includes(sale.observation, advanced.observation)) return false;
    if (advanced.paymentMethod && sale.paymentMethod !== advanced.paymentMethod) return false;
    if (advanced.category && !(sale.items ?? []).some((item) => {
      const product = productsById[item.productId];
      return product?.categoryId === advanced.category ||
        categories.some((category) => category.id === advanced.category && category.name === product?.category);
    })) return false;
    if (advanced.productCode && !(sale.items ?? []).some((item) => includes(item.productId, advanced.productCode))) return false;
    for (const field of ["color", "brand", "model", "size", "material"] as const) {
      if (advanced[field] && !(sale.items ?? []).some((item) => includes(item[field], advanced[field]))) return false;
    }
    if (advanced.remainingMin && (sale.remainingAmount ?? 0) < Number(advanced.remainingMin)) return false;
    if (advanced.remainingMax && (sale.remainingAmount ?? 0) > Number(advanced.remainingMax)) return false;
    if (advanced.deliveryFrom && (!sale.deliveryDeadline || sale.deliveryDeadline.slice(0, 10) < advanced.deliveryFrom)) return false;
    if (advanced.deliveryTo && (!sale.deliveryDeadline || sale.deliveryDeadline.slice(0, 10) > advanced.deliveryTo)) return false;
    if (advanced.createdFrom && day < advanced.createdFrom) return false;
    if (advanced.createdTo && day > advanced.createdTo) return false;
    if (advanced.delivered === "yes" && !sale.deliveredAt) return false;
    if (advanced.delivered === "no" && sale.deliveredAt) return false;
    return true;
  }), [sales, selectedProductId, dateFrom, dateTo, valueFrom, valueTo, status, advanced, productsById, categories]);
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalUnits = filteredSales.reduce((sum, sale) => sum + (sale.items ?? []).reduce((n, item) => n + item.quantity, 0), 0);

  return <DashboardLayout>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><Link href="/clientes" className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-[#a98a58]">
        <ArrowLeft className="h-4 w-4" /> Voltar para clientes
      </Link></div>
      {client && !loading && <Link href={`/clientes/${encodeURIComponent(id)}/editar`} className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#927448]">
        <Pencil className="h-4 w-4" /> Editar cliente
      </Link>}
    </div>
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
      {loading ? <Loading />
      : error ? <p className="px-6 py-16 text-center text-sm font-medium text-red-700">{error}</p>
      : client ? <div className="space-y-8 p-5 sm:p-7">
        <div className="flex items-center gap-3 border-b border-[#f0ece5] pb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7f0e6] text-[#a98a58]"><UserRound className="h-6 w-6" /></span>
          <h2 className="text-lg font-semibold text-[#342d27]">{client.name}</h2>
        </div>
        <div><h3 className="mb-4 text-sm font-semibold">Dados pessoais</h3>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="CPF" value={display(client.cpf)} />
            <Detail label="RG" value={display(client.rg)} />
            <Detail label="Data de nascimento" value={date(client.birthDate)} />
          </dl>
        </div>
        <div><h3 className="mb-4 text-sm font-semibold">Contato</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="E-mail" value={client.email && !uuidEmail.test(client.email) ? client.email : "—"} />
            <Detail label="Telefone" value={display(client.phone)} />
          </dl>
        </div>
        <div><h3 className="mb-4 text-sm font-semibold">Endereço</h3><dl><Detail label="Endereço cadastrado" value={display(client.address)} /></dl></div>
        <div><h3 className="mb-4 text-sm font-semibold">Informações do cadastro</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Data de cadastro" value={date(client.createdAt)} />
            <Detail label="Última atualização" value={date(client.updatedAt)} />
          </dl>
        </div>
        <section className="rounded-2xl border border-[#e8d9c4] bg-[#f8f3eb] p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#342d27]">Histórico de compras ({filteredSales.length})</h3>
            <Link href="/vendas/nova" className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#927448]"><Plus className="h-4 w-4" /> Nova venda</Link>
          </div>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative block text-xs font-semibold text-stone-600 sm:col-span-2 lg:col-span-3">
              Produto comprado
              <input type="search" autoComplete="off" value={productSearch}
                onFocus={() => setProductOptionsOpen(true)}
                onBlur={() => window.setTimeout(() => setProductOptionsOpen(false), 150)}
                onChange={(event) => { setProductSearch(event.target.value); setSelectedProductId(""); setProductOptionsOpen(true); }}
                placeholder="Digite para selecionar um produto comprado" className={fieldClass} />
              {productOptionsOpen && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[#e8e0d4] bg-white shadow-lg">
                  <button type="button" onMouseDown={(event) => event.preventDefault()}
                    onClick={() => { setSelectedProductId(""); setProductSearch(""); setProductOptionsOpen(false); }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-[#f8f3eb]">Todos os produtos</button>
                  {purchasedProducts.filter((product) => product.name.toLocaleLowerCase("pt-BR").includes(productSearch.trim().toLocaleLowerCase("pt-BR")))
                    .map((product) => (
                      <button key={product.id} type="button" onMouseDown={(event) => event.preventDefault()}
                        onClick={() => { setSelectedProductId(product.id); setProductSearch(product.name); setProductOptionsOpen(false); }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-[#f8f3eb]">{product.name}</button>
                    ))}
                </div>
              )}
            </div>
            <label className="block text-xs font-semibold text-stone-600 lg:col-start-4 lg:row-start-1">Status de pagamento
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
                <option value="">Todos</option><option value="UNPAID">Não paga</option><option value="PARTIALLY_PAID">Parcialmente paga</option><option value="PAID">Paga</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-stone-600">Data da compra — de<input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={fieldClass} /></label>
            <label className="block text-xs font-semibold text-stone-600">Data da compra — até<input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={fieldClass} /></label>
            <label className="block text-xs font-semibold text-stone-600">Valor da compra — de (R$)<input type="number" min="0" step="0.01" value={valueFrom} onChange={(e) => setValueFrom(e.target.value)} placeholder="0,00" className={fieldClass} /></label>
            <label className="block text-xs font-semibold text-stone-600">Valor da compra — até (R$)<input type="number" min="0" step="0.01" value={valueTo} onChange={(e) => setValueTo(e.target.value)} placeholder="0,00" className={fieldClass} /></label>
          </div>
          <details className="group mb-5">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#927448] hover:bg-[#f0e5d4] [&::-webkit-details-marker]:hidden">☰ Filtros avançados <span className="transition-transform group-open:rotate-180">⌄</span></summary>
            <div className="mt-3 grid gap-4 rounded-xl border border-[#e8d7bb] bg-white/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {([
                ["general", "Busca geral"], ["observation", "Observação"], ["color", "Cor"], ["brand", "Marca"], ["model", "Modelo"], ["size", "Tamanho"], ["material", "Material"],
              ] as const).map(([field, label]) => <label key={field} className="block text-xs font-semibold text-stone-600">{label}<input type="search" value={advanced[field] ?? ""} onChange={(e) => setAdvancedField(field, e.target.value)} className={fieldClass} /></label>)}
              <label className="block text-xs font-semibold text-stone-600">Categoria do produto
                <select value={advanced.category ?? ""} onChange={(e) => setAdvancedField("category", e.target.value)} className={fieldClass}>
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-stone-600">Forma de pagamento<select value={advanced.paymentMethod ?? ""} onChange={(e) => setAdvancedField("paymentMethod", e.target.value)} className={fieldClass}>
                <option value="">Todas</option>
                {[...new Set(sales.map((sale) => sale.paymentMethod).filter((value): value is string => Boolean(value)))].map((method) => <option key={method} value={method}>{methodLabels[method] ?? method}</option>)}
              </select></label>
              {([ ["remainingMin", "Restante mínimo"], ["remainingMax", "Restante máximo"] ] as const).map(([field, label]) => <label key={field} className="block text-xs font-semibold text-stone-600">{label}<input type="number" min="0" step="0.01" value={advanced[field] ?? ""} onChange={(e) => setAdvancedField(field, e.target.value)} className={fieldClass} /></label>)}
              {([ ["deliveryFrom", "Entrega de"], ["deliveryTo", "Entrega até"], ["createdFrom", "Cadastro de"], ["createdTo", "Cadastro até"] ] as const).map(([field, label]) => <label key={field} className="block text-xs font-semibold text-stone-600">{label}<input type="date" value={advanced[field] ?? ""} onChange={(e) => setAdvancedField(field, e.target.value)} className={fieldClass} /></label>)}
              <label className="block text-xs font-semibold text-stone-600">Entrega<select value={advanced.delivered ?? ""} onChange={(e) => setAdvancedField("delivered", e.target.value)} className={fieldClass}><option value="">Todas</option><option value="yes">Entregues</option><option value="no">Não entregues</option></select></label>
            </div>
          </details>
          {salesLoading && <Loading />}
          {salesError && <p className="mb-4 text-sm text-red-700">{salesError}</p>}
          <div className="overflow-x-auto rounded-xl border border-[#eee8df] bg-white">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-[#faf9f7] text-xs text-stone-500"><tr><th className="px-4 py-3">Produto(s)</th><th className="px-4 py-3">Qtd. de itens</th><th className="px-4 py-3">Valor da venda</th><th className="px-4 py-3">Pagamento</th><th className="px-4 py-3">Data da venda</th><th className="px-4 py-3 text-right">Visualizar / Editar</th></tr></thead>
              <tbody className="divide-y divide-[#f0ece5]">
                {filteredSales.map((sale) => <tr key={sale.id} className="odd:bg-white even:bg-[#e9e3da] transition-colors hover:!bg-[#ded3c4]">
                  <td className="px-4 py-4 font-medium">{(() => {
                    const items = sale.items ?? [];
                    if (!items.length) return "—";
                    const firstName = productsById[items[0].productId]?.name ?? "Produto indisponível";
                    return items.length > 1 ? `${firstName} +${items.length - 1}` : firstName;
                  })()}</td>
                  <td className="px-4 py-4">{number.format((sale.items ?? []).reduce((sum, item) => sum + item.quantity, 0))}</td>
                  <td className="px-4 py-4 font-semibold">{money.format(sale.totalAmount)}</td>
                  <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentClasses[sale.paymentStatus]}`}>{paymentLabels[sale.paymentStatus]}</span></td>
                  <td className="px-4 py-4">{date(sale.createdAt)}</td>
                  <td className="px-4 py-4"><div className="flex items-center justify-end gap-2">
                    <Link href={`/vendas/${encodeURIComponent(sale.id)}`} title="Visualizar venda" aria-label="Visualizar venda" className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"><Eye size={17} /></Link>
                    <Link href={`/vendas/${encodeURIComponent(sale.id)}/atualizar`} title="Atualizar venda" aria-label="Atualizar venda" className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"><Pencil size={17} /></Link>
                  </div></td>
                </tr>)}
                {!salesLoading && filteredSales.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-500">Nenhuma compra encontrada.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6d7c2] bg-[#efe4d4] px-5 py-4">
            <span className="text-sm font-semibold text-[#51473d]">{number.format(totalUnits)} unidade(s) · Total das compras deste cliente</span>
            <span className="text-xl font-bold text-[#342d27]">{money.format(totalSales)}</span>
          </div>
        </section>
      </div> : null}
    </section>
  </DashboardLayout>;
}

export default function ClientDetailsPage() {
  return <Suspense fallback={null}><ClientDetailsContent /></Suspense>;
}
