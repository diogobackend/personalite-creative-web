"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Package, Pencil, RefreshCw } from "lucide-react";
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
      </div> : null}
    </div>
  </DashboardLayout>;
}

export default function ProductDetailsPage() {
  return <Suspense fallback={null}><ProductDetailsContent /></Suspense>;
}
