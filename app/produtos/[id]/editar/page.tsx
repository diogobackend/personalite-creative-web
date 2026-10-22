"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Save } from "lucide-react";
import DashboardLayout from "../../../../src/components/layout/DashboardLayout";
import { api } from "../../../../src/lib/api";

type Category = "GOURMET" | "AGUAS" | "GARRAFAS" | "GLOSS" | "BOLSAS" | "NECESSAIRES" | "LENCOS" | "PAPELARIA" | "CAIXAS" | "KITS";
type PricingType = "FIXED" | "TIERED" | "QUOTE";
type ChargeType = "PER_ORDER" | "PER_UNIT" | "FIRST_PURCHASE";
type Price = { id: string; minimumQuantity: number; unitPrice: number };
type Fee = { id: string; name: string; amount: number; chargeType: ChargeType; required: boolean; active: boolean };
type Product = {
  id: string; code: string; name: string; category: Category; description: string | null;
  minimumQuantity: number | null; pricingType: PricingType; shelfLifeDays: number | null;
  productionLeadTimeMinDays: number | null; productionLeadTimeMaxDays: number | null;
  active: boolean; prices: Price[]; fees: Fee[];
};
type Form = {
  name: string; category: Category; description: string; minimumQuantity: string;
  pricingType: PricingType; shelfLifeDays: string; productionLeadTimeMinDays: string;
  productionLeadTimeMaxDays: string; active: boolean;
};
type PriceForm = { id: string; minimumQuantity: string; unitPrice: string };
type FeeForm = { id: string; name: string; amount: string; chargeType: ChargeType; required: boolean; active: boolean };

const categories: Record<Category, string> = {
  GOURMET: "Gourmet", AGUAS: "Águas", GARRAFAS: "Garrafas", GLOSS: "Gloss", BOLSAS: "Bolsas",
  NECESSAIRES: "Necessaires", LENCOS: "Lenços", PAPELARIA: "Papelaria", CAIXAS: "Caixas", KITS: "Kits",
};
const pricingTypes: Record<PricingType, string> = { FIXED: "Preço fixo", TIERED: "Por quantidade", QUOTE: "Sob consulta" };
const chargeTypes: Record<ChargeType, string> = { PER_ORDER: "Por pedido", PER_UNIT: "Por unidade", FIRST_PURCHASE: "Primeira compra" };
const inputClass = "w-full rounded-xl border border-[#e6ded2] bg-white px-3.5 py-3 text-sm text-[#302c29] outline-none transition focus:border-[#b18b52] focus:ring-2 focus:ring-[#b18b52]/10";
const sectionClass = "rounded-2xl border border-[#e8e1d7] bg-white p-5 shadow-sm sm:p-7";
const optionalNumber = (value: string) => value.trim() === "" ? null : Number(value);
const positiveInteger = (value: string) => /^\d+$/.test(value) && Number(value) > 0;
const nonNegativeInteger = (value: string) => /^\d+$/.test(value) && Number(value) >= 0;
const moneyValid = (value: string, zeroAllowed = false) =>
  value.trim() !== "" && /^\d+(\.\d{1,2})?$/.test(value) && (zeroAllowed ? Number(value) >= 0 : Number(value) > 0);

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Não foi possível conectar ao servidor.";
    if (error.response.status === 401) return "Sua sessão expirou. Faça login novamente.";
    if (error.response.status === 403) return "Você não possui permissão para editar produtos.";
    if (error.response.status === 404) return "Produto não encontrado.";
    const message = error.response.data?.message;
    return typeof message === "string" && message.trim() ? message : `Falha na requisição (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-sm font-medium text-[#51483f]">{label}</span>{children}</label>;
}

function toForm(product: Product): Form {
  return {
    name: product.name, category: product.category, description: product.description ?? "",
    minimumQuantity: product.minimumQuantity?.toString() ?? "", pricingType: product.pricingType,
    shelfLifeDays: product.shelfLifeDays?.toString() ?? "",
    productionLeadTimeMinDays: product.productionLeadTimeMinDays?.toString() ?? "",
    productionLeadTimeMaxDays: product.productionLeadTimeMaxDays?.toString() ?? "", active: product.active,
  };
}

function EditarProdutoContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [original, setOriginal] = useState<Product | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [prices, setPrices] = useState<PriceForm[]>([]);
  const [fees, setFees] = useState<FeeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") throw new Error("Sessão não encontrada. Faça login novamente.");
        const { data } = await api.get<Product>(`/products/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setOriginal(data);
        setForm(toForm(data));
        setPrices(data.prices.map((p) => ({ id: p.id, minimumQuantity: String(p.minimumQuantity), unitPrice: String(p.unitPrice) })));
        setFees(data.fees.map((f) => ({ ...f, amount: String(f.amount) })));
      } catch (cause) {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    if (id) void load();
    else { setError("ID do produto não informado."); setLoading(false); }
    return () => controller.abort();
  }, [id]);

  function updateForm<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }
  function updatePrice<K extends keyof PriceForm>(id: string, key: K, value: PriceForm[K]) {
    setPrices((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
  }
  function updateFee<K extends keyof FeeForm>(id: string, key: K, value: FeeForm[K]) {
    setFees((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!original || !form || saving) return;
    setError(null);
    if (!form.name.trim()) return setError("Informe o nome do produto.");
    if (form.minimumQuantity && !positiveInteger(form.minimumQuantity)) return setError("A quantidade mínima deve ser um inteiro maior que zero.");
    if (form.shelfLifeDays && !positiveInteger(form.shelfLifeDays)) return setError("A validade deve ser um inteiro maior que zero.");
    if (form.productionLeadTimeMinDays && !nonNegativeInteger(form.productionLeadTimeMinDays)) return setError("O prazo mínimo deve ser um inteiro não negativo.");
    if (form.productionLeadTimeMaxDays && !nonNegativeInteger(form.productionLeadTimeMaxDays)) return setError("O prazo máximo deve ser um inteiro não negativo.");
    const minDays = optionalNumber(form.productionLeadTimeMinDays);
    const maxDays = optionalNumber(form.productionLeadTimeMaxDays);
    if (minDays !== null && maxDays !== null && minDays > maxDays) return setError("O prazo máximo não pode ser inferior ao mínimo.");
    if (prices.some((p) => !positiveInteger(p.minimumQuantity) || !moneyValid(p.unitPrice))) return setError("Preços exigem quantidade positiva e valor maior que zero, com até duas casas decimais.");
    if (new Set(prices.map((p) => Number(p.minimumQuantity))).size !== prices.length) return setError("Não repita quantidades mínimas nas faixas de preço.");
    if (fees.some((f) => !f.name.trim() || !moneyValid(f.amount, true))) return setError("Taxas exigem nome e valor não negativo, com até duas casas decimais.");
    const quantity = optionalNumber(form.minimumQuantity);
    if (form.pricingType === "FIXED" && (prices.length !== 1 || quantity === null)) return setError("Preço fixo exige uma faixa e quantidade mínima.");
    if (form.pricingType === "TIERED" && (prices.length === 0 || quantity === null)) return setError("Preço por quantidade exige faixas e quantidade mínima.");
    if (form.pricingType === "QUOTE" && prices.length > 0) return setError("Para mudar para sob consulta, é necessário remover as faixas no backend primeiro.");
    if (form.pricingType !== "QUOTE" && Math.min(...prices.map((p) => Number(p.minimumQuantity))) !== quantity) return setError("A primeira faixa deve corresponder à quantidade mínima do produto.");

    const payload: Record<string, unknown> = {};
    const fields: (keyof Form)[] = ["name", "category", "description", "minimumQuantity", "pricingType", "shelfLifeDays", "productionLeadTimeMinDays", "productionLeadTimeMaxDays", "active"];
    const originalForm = toForm(original);
    for (const key of fields) {
      if (form[key] === originalForm[key]) continue;
      if (key === "description") payload[key] = form.description.trim() || null;
      else if (key === "minimumQuantity" || key === "shelfLifeDays" || key === "productionLeadTimeMinDays" || key === "productionLeadTimeMaxDays") payload[key] = optionalNumber(form[key]);
      else payload[key] = form[key];
    }
    const priceChanges = prices.flatMap((row) => {
      const previous = original.prices.find((p) => p.id === row.id);
      if (!previous) return [];
      const change: Record<string, unknown> = { id: row.id };
      if (Number(row.minimumQuantity) !== previous.minimumQuantity) change.minimumQuantity = Number(row.minimumQuantity);
      if (Number(row.unitPrice) !== previous.unitPrice) change.unitPrice = Number(row.unitPrice);
      return Object.keys(change).length > 1 ? [change] : [];
    });
    if (priceChanges.length) payload.prices = priceChanges;
    const feeChanges = fees.flatMap((row) => {
      const previous = original.fees.find((f) => f.id === row.id);
      if (!previous) return [];
      const change: Record<string, unknown> = { id: row.id };
      if (row.name.trim() !== previous.name) change.name = row.name.trim();
      if (Number(row.amount) !== previous.amount) change.amount = Number(row.amount);
      if (row.chargeType !== previous.chargeType) change.chargeType = row.chargeType;
      if (row.required !== previous.required) change.required = row.required;
      if (row.active !== previous.active) change.active = row.active;
      return Object.keys(change).length > 1 ? [change] : [];
    });
    if (feeChanges.length) payload.fees = feeChanges;
    if (!Object.keys(payload).length) return setError("Nenhuma alteração foi realizada.");

    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined" || token === "null") return setError("Sessão inválida. Faça login novamente.");
    setSaving(true);
    try {
      await api.patch(`/products/${encodeURIComponent(id)}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      router.push(`/produtos/${encodeURIComponent(id)}`);
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return <DashboardLayout>
    <main className="mx-auto w-full max-w-6xl pb-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[#302c29]">Editar produto</h1>
          {original && <p className="mt-2 text-sm text-[#8b8176]">Código {original.code} · {original.name}</p>}
        </div>
        <button type="button" onClick={() => router.push(`/produtos/${id}`)} className="inline-flex items-center gap-2 rounded-xl border border-[#e2d7c9] bg-white px-4 py-3 text-sm text-[#65584b] hover:bg-[#faf7f2]"><ArrowLeft size={16} /> Voltar ao produto</button>
      </div>
      {loading ? <div className={sectionClass}>Carregando dados do produto...</div> : !form || !original ?
        <div role="alert" className={sectionClass}>{error ?? "Produto não encontrado."}</div> :
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <section className={sectionClass}>
            <h2 className="mb-5 font-serif text-xl text-[#302c29]">Informações do produto</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Código (não editável)"><input className={`${inputClass} bg-[#f5f1eb]`} value={original.code} readOnly /></Field>
              <div className="lg:col-span-2"><Field label="Nome do produto"><input className={inputClass} maxLength={150} value={form.name} onChange={(e) => updateForm("name", e.target.value)} /></Field></div>
              <Field label="Categoria"><select className={inputClass} value={form.category} onChange={(e) => updateForm("category", e.target.value as Category)}>{Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Tipo de precificação"><select className={inputClass} value={form.pricingType} onChange={(e) => updateForm("pricingType", e.target.value as PricingType)}>{Object.entries(pricingTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Quantidade mínima"><input className={inputClass} type="number" min="1" step="1" value={form.minimumQuantity} onChange={(e) => updateForm("minimumQuantity", e.target.value)} /></Field>
              <div className="md:col-span-2 lg:col-span-3"><Field label="Descrição"><textarea className={`${inputClass} min-h-28 resize-y`} value={form.description} onChange={(e) => updateForm("description", e.target.value)} /></Field></div>
            </div>
            <label className="mt-5 inline-flex items-center gap-2.5 text-sm text-[#51483f]"><input type="checkbox" checked={form.active} onChange={(e) => updateForm("active", e.target.checked)} className="h-4 w-4 accent-[#a98a58]" /> Produto ativo</label>
          </section>
          <section className={sectionClass}>
            <h2 className="mb-5 font-serif text-xl text-[#302c29]">Produção e validade</h2>
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Validade (dias)"><input className={inputClass} type="number" min="1" step="1" value={form.shelfLifeDays} onChange={(e) => updateForm("shelfLifeDays", e.target.value)} /></Field>
              <Field label="Produção mínima (dias)"><input className={inputClass} type="number" min="0" step="1" value={form.productionLeadTimeMinDays} onChange={(e) => updateForm("productionLeadTimeMinDays", e.target.value)} /></Field>
              <Field label="Produção máxima (dias)"><input className={inputClass} type="number" min="0" step="1" value={form.productionLeadTimeMaxDays} onChange={(e) => updateForm("productionLeadTimeMaxDays", e.target.value)} /></Field>
            </div>
          </section>
          <section className={sectionClass}>
            <h2 className="mb-2 font-serif text-xl text-[#302c29]">Faixas de preço</h2>
            <p className="mb-5 text-sm text-[#8b8176]">Altere qualquer quantidade ou preço individualmente.</p>
            {prices.length === 0 ? <p className="text-sm text-stone-500">Nenhuma faixa cadastrada.</p> : <div className="space-y-3">{prices.map((price) => <div key={price.id} className="grid gap-4 rounded-xl bg-[#faf8f5] p-4 sm:grid-cols-2">
              <Field label="Quantidade mínima"><input className={inputClass} type="number" min="1" step="1" value={price.minimumQuantity} onChange={(e) => updatePrice(price.id, "minimumQuantity", e.target.value)} /></Field>
              <Field label="Preço unitário (R$)"><input className={inputClass} type="number" min="0.01" step="0.01" value={price.unitPrice} onChange={(e) => updatePrice(price.id, "unitPrice", e.target.value)} /></Field>
            </div>)}</div>}
          </section>
          <section className={sectionClass}>
            <h2 className="mb-5 font-serif text-xl text-[#302c29]">Taxas adicionais</h2>
            {fees.length === 0 ? <p className="text-sm text-stone-500">Nenhuma taxa cadastrada.</p> : <div className="space-y-4">{fees.map((fee) => <div key={fee.id} className="rounded-xl border border-[#eee6dd] bg-[#faf8f5] p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Nome da taxa"><input className={inputClass} maxLength={100} value={fee.name} onChange={(e) => updateFee(fee.id, "name", e.target.value)} /></Field>
                <Field label="Valor (R$)"><input className={inputClass} type="number" min="0" step="0.01" value={fee.amount} onChange={(e) => updateFee(fee.id, "amount", e.target.value)} /></Field>
                <Field label="Cobrança"><select className={inputClass} value={fee.chargeType} onChange={(e) => updateFee(fee.id, "chargeType", e.target.value as ChargeType)}>{Object.entries(chargeTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              </div>
              <div className="mt-4 flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-[#51483f]"><input type="checkbox" checked={fee.required} onChange={(e) => updateFee(fee.id, "required", e.target.checked)} className="accent-[#a98a58]" /> Taxa obrigatória</label>
                <label className="inline-flex items-center gap-2 text-sm text-[#51483f]"><input type="checkbox" checked={fee.active} onChange={(e) => updateFee(fee.id, "active", e.target.checked)} className="accent-[#a98a58]" /> Taxa ativa</label>
              </div>
            </div>)}</div>}
          </section>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" disabled={saving} onClick={() => router.push(`/produtos/${id}`)} className="rounded-xl border border-[#e2d7c9] bg-white px-6 py-3 text-sm text-[#65584b] disabled:opacity-60">Cancelar</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-6 py-3 text-sm font-semibold text-white hover:bg-[#927448] disabled:opacity-60"><Save size={17} /> {saving ? "Salvando..." : "Salvar alterações"}</button>
          </div>
        </form>}
    </main>
  </DashboardLayout>;
}

export default function EditarProdutoPage() {
  return (
    <Suspense fallback={null}>
      <EditarProdutoContent />
    </Suspense>
  );
}
