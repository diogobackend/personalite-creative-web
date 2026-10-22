"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import DashboardLayout from "../../../../src/components/layout/DashboardLayout";
import { api } from "../../../../src/lib/api";

type Price = { id?: string; key: string; minimumQuantity: string; unitPrice: string };
type Fee = { id?: string; key: string; name: string; amount: string; chargeType: string; required: boolean; active: boolean };
type Product = {
  id: string; code: string; name: string; category: string; description: string | null;
  minimumQuantity: number | null; pricingType: string; shelfLifeDays: number | null;
  productionLeadTimeMinDays: number | null; productionLeadTimeMaxDays: number | null;
  active: boolean;
  prices: { id: string; minimumQuantity: number; unitPrice: number }[];
  fees: { id: string; name: string; amount: number; chargeType: string; required: boolean; active: boolean }[];
};

const categories = ["SAVORY", "SWEET", "BEVERAGE", "OTHER"];
const pricingTypes = ["FIXED", "TIERED", "QUOTE"];
const chargeTypes = ["FIXED", "PER_UNIT", "PERCENTAGE"];
const inputClass = "w-full rounded-xl border border-[#e8e1d7] bg-white px-3 py-2.5 text-sm text-[#342d27] outline-none focus:border-[#a98a58]";
const labelClass = "mb-1.5 block text-sm font-medium text-[#342d27]";
const sectionClass = "space-y-4 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm";
const newKey = () => crypto.randomUUID();
const num = (value: string) => Number(value);
const optionalNumber = (value: string) => value.trim() === "" ? null : Number(value);
const errorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? `Erro HTTP ${error.response?.status ?? "de conexão"}.`;
  return error instanceof Error ? error.message : "Erro inesperado.";
};

function EditProductContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [original, setOriginal] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "", category: "", description: "", minimumQuantity: "", pricingType: "",
    shelfLifeDays: "", productionLeadTimeMinDays: "", productionLeadTimeMaxDays: "", active: true,
  });
  const [prices, setPrices] = useState<Price[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Sessão não encontrada. Faça login novamente.");
        const { data } = await api.get<Product>(`/products/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setOriginal(data);
        setForm({
          name: data.name, category: data.category, description: data.description ?? "",
          minimumQuantity: data.minimumQuantity?.toString() ?? "", pricingType: data.pricingType,
          shelfLifeDays: data.shelfLifeDays?.toString() ?? "",
          productionLeadTimeMinDays: data.productionLeadTimeMinDays?.toString() ?? "",
          productionLeadTimeMaxDays: data.productionLeadTimeMaxDays?.toString() ?? "", active: data.active,
        });
        setPrices(data.prices.map(p => ({ id: p.id, key: p.id, minimumQuantity: String(p.minimumQuantity), unitPrice: String(p.unitPrice) })));
        setFees(data.fees.map(f => ({ ...f, key: f.id, amount: String(f.amount) })));
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

  function updateForm<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm(current => ({ ...current, [field]: value }));
  }
  function updatePrice(key: string, patch: Partial<Price>) {
    setPrices(current => current.map(row => row.key === key ? { ...row, ...patch } : row));
  }
  function updateFee(key: string, patch: Partial<Fee>) {
    setFees(current => current.map(row => row.key === key ? { ...row, ...patch } : row));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!original || saving) return;
    setError(null);
    try {
      if (!form.name.trim()) throw new Error("Informe o nome do produto.");
      for (const field of ["minimumQuantity", "shelfLifeDays", "productionLeadTimeMinDays", "productionLeadTimeMaxDays"] as const) {
        if (form[field] !== "" && (!Number.isInteger(num(form[field])) || num(form[field]) < (field === "productionLeadTimeMinDays" || field === "productionLeadTimeMaxDays" ? 0 : 1))) {
          throw new Error(`Valor inválido para ${field}.`);
        }
      }
      if (form.productionLeadTimeMinDays !== "" && form.productionLeadTimeMaxDays !== "" && num(form.productionLeadTimeMaxDays) < num(form.productionLeadTimeMinDays)) {
        throw new Error("O prazo máximo não pode ser inferior ao mínimo.");
      }
      if (form.pricingType === "FIXED" && prices.length !== 1) throw new Error("Preço fixo exige exatamente uma faixa.");
      if (form.pricingType === "TIERED" && prices.length === 0) throw new Error("Preço por faixas exige pelo menos uma faixa.");
      if (form.pricingType === "QUOTE" && prices.length !== 0) throw new Error("Produtos sob orçamento não devem possuir faixas.");
      if (form.pricingType !== "QUOTE" && form.minimumQuantity === "") throw new Error("Informe a quantidade mínima do produto.");
      const quantities = new Set<number>();
      for (const p of prices) {
        if (!Number.isInteger(num(p.minimumQuantity)) || num(p.minimumQuantity) <= 0 || p.minimumQuantity.trim() === "") throw new Error("Quantidade da faixa inválida.");
        if (p.unitPrice.trim() === "" || !Number.isFinite(num(p.unitPrice)) || num(p.unitPrice) <= 0) throw new Error("Preço unitário deve ser maior que zero.");
        if (quantities.has(num(p.minimumQuantity))) throw new Error("Existem faixas com quantidades mínimas duplicadas.");
        quantities.add(num(p.minimumQuantity));
      }
      if (prices.length && Math.min(...prices.map(p => num(p.minimumQuantity))) !== optionalNumber(form.minimumQuantity)) {
        throw new Error("A menor faixa deve corresponder à quantidade mínima do produto.");
      }
      for (const fee of fees) {
        if (!fee.name.trim()) throw new Error("Informe o nome da taxa.");
        if (fee.amount.trim() === "" || !Number.isFinite(num(fee.amount)) || num(fee.amount) < 0) throw new Error("Valor da taxa inválido.");
      }

      const body: Record<string, unknown> = {};
      const scalarFields = ["name", "category", "description", "pricingType", "active"] as const;
      for (const field of scalarFields) {
        const value = field === "description" ? form.description.trim() || null : form[field];
        if (value !== original[field]) body[field] = value;
      }
      const numberFields = ["minimumQuantity", "shelfLifeDays", "productionLeadTimeMinDays", "productionLeadTimeMaxDays"] as const;
      for (const field of numberFields) {
        const value = optionalNumber(form[field]);
        if (value !== original[field]) body[field] = value;
      }

      const originalPrices = new Map(original.prices.map(p => [p.id, p]));
      const originalFees = new Map(original.fees.map(f => [f.id, f]));
      const updatedPrices = prices.filter(p => p.id).flatMap(p => {
        const before = originalPrices.get(p.id!);
        if (!before) return [];
        const patch: Record<string, unknown> = { id: p.id };
        if (num(p.minimumQuantity) !== before.minimumQuantity) patch.minimumQuantity = num(p.minimumQuantity);
        if (num(p.unitPrice) !== Number(before.unitPrice)) patch.unitPrice = num(p.unitPrice);
        return Object.keys(patch).length > 1 ? [patch] : [];
      });
      const addedPrices = prices.filter(p => !p.id).map(p => ({ minimumQuantity: num(p.minimumQuantity), unitPrice: num(p.unitPrice) }));
      const removedPrices = original.prices.filter(p => !prices.some(row => row.id === p.id)).map(p => p.id);
      const updatedFees = fees.filter(f => f.id).flatMap(f => {
        const before = originalFees.get(f.id!);
        if (!before) return [];
        const patch: Record<string, unknown> = { id: f.id };
        if (f.name !== before.name) patch.name = f.name;
        if (num(f.amount) !== Number(before.amount)) patch.amount = num(f.amount);
        if (f.chargeType !== before.chargeType) patch.chargeType = f.chargeType;
        if (f.required !== before.required) patch.required = f.required;
        if (f.active !== before.active) patch.active = f.active;
        return Object.keys(patch).length > 1 ? [patch] : [];
      });
      const addedFees = fees.filter(f => !f.id).map(f => ({ name: f.name, amount: num(f.amount), chargeType: f.chargeType, required: f.required, active: f.active }));
      const removedFees = original.fees.filter(f => !fees.some(row => row.id === f.id)).map(f => f.id);
      if (updatedPrices.length) body.prices = updatedPrices;
      if (addedPrices.length) body.addPrices = addedPrices;
      if (removedPrices.length) body.removePriceIds = removedPrices;
      if (updatedFees.length) body.fees = updatedFees;
      if (addedFees.length) body.addFees = addedFees;
      if (removedFees.length) body.removeFeeIds = removedFees;
      if (!Object.keys(body).length) { router.push(`/produtos/${encodeURIComponent(id)}`); return; }
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Sessão não encontrada. Faça login novamente.");
      setSaving(true);
      await api.patch(`/products/${encodeURIComponent(id)}`, body, { headers: { Authorization: `Bearer ${token}` } });
      router.push(`/produtos/${encodeURIComponent(id)}`);
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
                <div className="mx-auto max-w-5xl space-y-6">
                    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 className="font-serif text-4xl text-[#342d27]">
                Editar produto
                </h1>

                <p className="mt-2 text-sm text-stone-500">
                {original && `Código ${original.code} · ${original.name}`}
                </p>
            </div>

            <Link
                href={`/produtos/${encodeURIComponent(id)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e8d8c5] bg-white px-4 py-3 text-sm font-medium text-[#6b5138] transition-colors hover:bg-[#fdfbf8]"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao produto
            </Link>
            </div>
        {loading ? <p className="text-sm text-stone-500">Carregando produto...</p> : !original ? <p className="text-sm text-red-700">{error ?? "Produto não encontrado."}</p> : (
         
          <form onSubmit={save} className="space-y-6">
            <section className={sectionClass}>
              <h2 className="text-lg font-semibold text-[#342d27]">Informações gerais</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className={labelClass}>Nome</span><input required maxLength={150} className={inputClass} value={form.name} onChange={e => updateForm("name", e.target.value)} /></label>
                <label><span className={labelClass}>Categoria</span><select className={inputClass} value={form.category} onChange={e => updateForm("category", e.target.value)}>{Array.from(new Set([form.category, ...categories])).filter(Boolean).map(x => <option key={x} value={x}>{x}</option>)}</select></label>
                <label className="sm:col-span-2"><span className={labelClass}>Descrição</span><textarea rows={3} className={inputClass} value={form.description} onChange={e => updateForm("description", e.target.value)} /></label>
                <label>
                    <span className={labelClass}>Tipo de precificação</span>
                    <select
                        className={inputClass}
                        value={form.pricingType}
                        onChange={(e) => updateForm("pricingType", e.target.value)}
                    >
                        <option value="TIERED">Por quantidade</option>
                        <option value="FIXED">Preço fixo</option>
                        <option value="QUOTE">Sob orçamento</option>
                    </select>
                    </label>
                <label><span className={labelClass}>Qtd mínima</span><input type="number" min={1} step={1} className={inputClass} value={form.minimumQuantity} onChange={e => updateForm("minimumQuantity", e.target.value)} /></label>
                <label><span className={labelClass}>Prazo mínimo de produção (dias)</span><input type="number" min={0} step={1} className={inputClass} value={form.productionLeadTimeMinDays} onChange={e => updateForm("productionLeadTimeMinDays", e.target.value)} /></label>
                <label><span className={labelClass}>Prazo máximo de produção (dias)</span><input type="number" min={0} step={1} className={inputClass} value={form.productionLeadTimeMaxDays} onChange={e => updateForm("productionLeadTimeMaxDays", e.target.value)} /></label>
                <label><span className={labelClass}>Validade (dias)</span><input type="number" min={1} step={1} className={inputClass} value={form.shelfLifeDays} onChange={e => updateForm("shelfLifeDays", e.target.value)} /></label>
                <label className="flex items-center gap-2 pt-6 text-sm text-[#342d27]"><input type="checkbox" checked={form.active} onChange={e => updateForm("active", e.target.checked)} /> Produto ativo</label>
              </div>
            </section>

            <section className={sectionClass}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-[#342d27]">
                            Faixas de preço
                            </h2>

                            <button
                            type="button"
                            onClick={() =>
                                setPrices((prev) => [
                                ...prev,
                                { key: newKey(), minimumQuantity: "", unitPrice: "" },
                                ])
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-[#a98a58] px-3 py-2 text-sm font-semibold text-[#927448]"
                            >
                            <Plus className="h-4 w-4" />
                            Adicionar faixa
                            </button>
                        </div>

                        {prices.length === 0 && (
                            <p className="text-sm text-stone-500">
                            Nenhuma faixa cadastrada.
                            </p>
                        )}

                        {prices.map((price) => (
                            <div
                            key={price.key}
                            className="grid gap-3 rounded-xl border border-[#ece6dc] bg-[#fdfbf8] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                            >
                            <label>
                                <span className={labelClass}>Qtd mínima</span>
                                <input
                                type="number"
                                min={1}
                                step={1}
                                required
                                className={inputClass}
                                value={price.minimumQuantity}
                                onChange={(e) =>
                                    updatePrice(price.key, {
                                    minimumQuantity: e.target.value,
                                    })
                                }
                                />
                            </label>

                            <label>
                                <span className={labelClass}>Preço unitário (R$)</span>
                                <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                                className={inputClass}
                                value={price.unitPrice}
                                onChange={(e) =>
                                    updatePrice(price.key, {
                                    unitPrice: e.target.value,
                                    })
                                }
                                />
                            </label>

                            <button
                                type="button"
                                title="Excluir faixa"
                                aria-label="Excluir faixa"
                                onClick={() =>
                                setPrices((prev) =>
                                    prev.filter((item) => item.key !== price.key)
                                )
                                }
                                className="rounded-xl border border-red-200 p-2.5 text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                            </div>
                        ))}
                        </section>

            <section className={sectionClass}>
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-lg font-semibold text-[#342d27]">
      Taxas adicionais
    </h2>

    <button
      type="button"
      onClick={() =>
        setFees((prev) => [
          ...prev,
          {
            key: newKey(),
            name: "",
            amount: "",
            chargeType: "FIXED",
            required: false,
            active: true,
          },
        ])
      }
      className="inline-flex items-center gap-2 rounded-xl border border-[#a98a58] px-3 py-2 text-sm font-semibold text-[#927448]"
    >
      <Plus className="h-4 w-4" />
      Adicionar taxa
    </button>
  </div>

  {fees.length === 0 && (
    <p className="text-sm text-stone-500">
      Nenhuma taxa cadastrada.
    </p>
  )}

  {fees.map((fee) => (
    <div
      key={fee.key}
      className="space-y-3 rounded-xl border border-[#ece6dc] bg-[#fdfbf8] p-4"
    >
      <div className="flex justify-end">
        <button
          type="button"
          title="Excluir taxa"
          aria-label="Excluir taxa"
          onClick={() =>
            setFees((prev) =>
              prev.filter((item) => item.key !== fee.key)
            )
          }
          className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          <span className={labelClass}>Nome</span>
          <input
            required
            className={inputClass}
            value={fee.name}
            onChange={(e) =>
              updateFee(fee.key, { name: e.target.value })
            }
          />
        </label>

        <label>
          <span className={labelClass}>Valor</span>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            className={inputClass}
            value={fee.amount}
            onChange={(e) =>
              updateFee(fee.key, { amount: e.target.value })
            }
          />
        </label>

        <label>
          <span className={labelClass}>Tipo de cobrança</span>
          <select
            className={inputClass}
            value={fee.chargeType}
            onChange={(e) =>
              updateFee(fee.key, { chargeType: e.target.value })
            }
          >
            <option value="FIXED">Valor fixo</option>
            <option value="PERCENTAGE">Percentual</option>
            <option value="PER_UNIT">Por unidade</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fee.required}
            onChange={(e) =>
              updateFee(fee.key, { required: e.target.checked })
            }
          />
          Obrigatória
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fee.active}
            onChange={(e) =>
              updateFee(fee.key, { active: e.target.checked })
            }
          />
          Ativa
        </label>
      </div>
    </div>
  ))}
</section>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-3"><Link href={`/produtos/${encodeURIComponent(id)}`} className="rounded-xl border border-[#e8e1d7] px-5 py-3 text-sm font-semibold text-[#342d27]">Cancelar</Link><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}</button></div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EditProductPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-stone-500">Carregando...</p>}><EditProductContent /></Suspense>;
}
