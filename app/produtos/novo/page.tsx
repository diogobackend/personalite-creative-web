"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import DashboardLayout from "../../../src/components/layout/DashboardLayout"
import { getColor } from "../../../src/utils/colors";
import { api } from "../../../src/lib/api"

type Category = { id: string; name: string; type: string };
type PricingType = "FIXED" | "TIERED" | "QUOTE";
type ChargeType = "PER_ORDER" | "PER_UNIT" | "FIRST_PURCHASE";
type PriceRow = { minimumQuantity: string; unitPrice: string };
type FeeRow = { name: string; amount: string; chargeType: ChargeType; required: boolean; active: boolean };
type CharacteristicKey = "colors" | "sizes" | "brands" | "models" | "materials";
type Characteristics = Record<CharacteristicKey, string[]>;
const characteristicFields: { key: CharacteristicKey; label: string; placeholder: string }[] = [
  { key: "colors", label: "Cores", placeholder: "Ex.: Azul" },
  { key: "sizes", label: "Tamanhos", placeholder: "Ex.: M" },
  { key: "brands", label: "Marcas", placeholder: "Ex.: Personalité" },
  { key: "models", label: "Modelos", placeholder: "Ex.: Clássico" },
  { key: "materials", label: "Materiais", placeholder: "Ex.: Algodão" },
];
type ProductForm = {
  code: string;
  name: string;
  categoryId: string;
  description: string;
  minimumQuantity: string;
  pricingType: PricingType;
  shelfLifeDays: string;
  productionLeadTimeMinDays: string;
  productionLeadTimeMaxDays: string;
  active: boolean;
};



const pricingTypes: { value: PricingType; label: string }[] = [
  { value: "FIXED", label: "Preço fixo" },
  { value: "TIERED", label: "Por quantidade" },
  { value: "QUOTE", label: "Sob consulta" },
];

const chargeTypes: { value: ChargeType; label: string }[] = [
  { value: "PER_ORDER", label: "Por pedido" },
  { value: "PER_UNIT", label: "Por unidade" },
  { value: "FIRST_PURCHASE", label: "Primeira compra" },
];

const inputClass = "w-full rounded-xl border border-[#e6ded2] bg-white px-3.5 py-3 text-sm text-[#302c29] outline-none transition focus:border-[#b18b52] focus:ring-2 focus:ring-[#b18b52]/10";
const labelClass = "mb-1.5 block text-sm font-medium text-[#51483f]";
const sectionClass = "rounded-2xl border border-[#e8e1d7] bg-white p-5 shadow-sm sm:p-7";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}{required && <span className="ml-1 text-[#ad7740]">*</span>}</span>
      {children}
    </label>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-serif text-xl text-[#302c29]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[#8b8176]">{description}</p>}
    </div>
  );
}

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function validPositiveInteger(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) > 0;
}

function validNonNegativeInteger(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) >= 0;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Não foi possível conectar ao servidor.";
    if (error.response.status === 401) return "Sua sessão expirou. Faça login novamente.";
    if (error.response.status === 403) return "Você não tem permissão para cadastrar produtos.";
    if (error.response.status === 409) return "Já existe um produto com esse código.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    return `Não foi possível cadastrar o produto (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

export default function NovoProdutoPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>({
    code: "", name: "", categoryId: "", description: "", minimumQuantity: "",
    pricingType: "TIERED", shelfLifeDays: "", productionLeadTimeMinDays: "",
    productionLeadTimeMaxDays: "", active: true,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [prices, setPrices] = useState<PriceRow[]>([{ minimumQuantity: "", unitPrice: "" }]);
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [characteristics, setCharacteristics] = useState<Characteristics>({ colors: [], sizes: [], brands: [], models: [], materials: [] });
  const [characteristicInputs, setCharacteristicInputs] = useState<Record<CharacteristicKey, string>>({ colors: "", sizes: "", brands: "", models: "", materials: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await api.get<Category[]>("/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setCategories(response.data.filter((category) => category.type === "PRODUCT"));
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      }
    };
    void loadCategories();
    return () => { active = false; };
  }, []);

  function updateForm<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePrice(index: number, key: keyof PriceRow, value: string) {
    setPrices((current) => current.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }

  function updateFee<K extends keyof FeeRow>(index: number, key: K, value: FeeRow[K]) {
    setFees((current) => current.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }

  function addCharacteristic(key: CharacteristicKey) {
    const value = characteristicInputs[key].trim();
    if (!value) return;
    setCharacteristics((current) => ({ ...current, [key]: current[key].some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase()) ? current[key] : [...current[key], value] }));
    setCharacteristicInputs((current) => ({ ...current, [key]: "" }));
  }

  function removeCharacteristic(key: CharacteristicKey, value: string) {
    setCharacteristics((current) => ({ ...current, [key]: current[key].filter((item) => item !== value) }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(form.code)) return setError("O código deve conter exatamente 4 números.");
    if (!form.name.trim()) return setError("Informe o nome do produto.");
    const selectedCategory = categories.find((category) => category.id === form.categoryId);
    if (!selectedCategory) return setError("Selecione uma categoria válida.");
    if (form.minimumQuantity && !validPositiveInteger(form.minimumQuantity)) return setError("A quantidade mínima deve ser um número inteiro maior que zero.");
    if (form.shelfLifeDays && !validPositiveInteger(form.shelfLifeDays)) return setError("A validade deve ser um número inteiro maior que zero.");
    if (form.productionLeadTimeMinDays && !validNonNegativeInteger(form.productionLeadTimeMinDays)) return setError("O prazo mínimo de produção deve ser um número inteiro não negativo.");
    if (form.productionLeadTimeMaxDays && !validNonNegativeInteger(form.productionLeadTimeMaxDays)) return setError("O prazo máximo de produção deve ser um número inteiro não negativo.");
    if (form.productionLeadTimeMinDays && form.productionLeadTimeMaxDays && Number(form.productionLeadTimeMinDays) > Number(form.productionLeadTimeMaxDays)) return setError("O prazo mínimo de produção não pode exceder o máximo.");

    if (form.pricingType !== "QUOTE") {
      if (prices.length === 0) return setError("Adicione ao menos uma faixa de preço.");
      if (prices.some((price) => !validPositiveInteger(price.minimumQuantity) || !Number.isFinite(Number(price.unitPrice)) || Number(price.unitPrice) <= 0 || !price.unitPrice.trim())) return setError("Preencha as faixas de preço com quantidade inteira positiva e valor maior que zero.");
      const quantities = prices.map((price) => Number(price.minimumQuantity));
      if (new Set(quantities).size !== quantities.length) return setError("Não repita a mesma quantidade mínima nas faixas de preço.");
    }
    if (fees.some((fee) => !fee.name.trim() || !fee.amount.trim() || !Number.isFinite(Number(fee.amount)) || Number(fee.amount) < 0)) return setError("Preencha o nome e um valor não negativo em todas as taxas.");

    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined" || token === "null") return setError("Sessão inválida. Faça login novamente.");

    const payload = {
      code: form.code,
      name: form.name.trim(),
      category: selectedCategory.name,
      categoryId: selectedCategory.id,
      description: form.description.trim() || null,
      minimumQuantity: optionalNumber(form.minimumQuantity),
      pricingType: form.pricingType,
      shelfLifeDays: optionalNumber(form.shelfLifeDays),
      productionLeadTimeMinDays: optionalNumber(form.productionLeadTimeMinDays),
      productionLeadTimeMaxDays: optionalNumber(form.productionLeadTimeMaxDays),
      active: form.active,
      ...characteristics,
      prices: form.pricingType === "QUOTE" ? [] : prices.map((price) => ({ minimumQuantity: Number(price.minimumQuantity), unitPrice: Number(price.unitPrice) })),
      fees: fees.map((fee) => ({ name: fee.name.trim(), amount: Number(fee.amount), chargeType: fee.chargeType, required: fee.required, active: fee.active })),
    };

    setSaving(true);
    try {
      await api.post("/products", payload, { headers: { Authorization: `Bearer ${token}` } });
      router.push("/produtos");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl pb-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl text-[#302c29]">Cadastrar produto</h1>
          </div>
          <button type="button" onClick={() => router.push("/produtos")} className="inline-flex items-center gap-2 rounded-xl border border-green-600 bg-green-600 px-4 py-3 text-sm text-white hover:bg-green-700">
            <ArrowLeft size={16} /> Voltar aos produtos
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <section className={sectionClass}>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Código" required><input className={inputClass} value={form.code} maxLength={3} inputMode="numeric" placeholder="Ex.: 011" onChange={(e) => updateForm("code", e.target.value.replace(/\D/g, ""))} /></Field>
              <div className="lg:col-span-2"><Field label="Nome" required><input className={inputClass} value={form.name} maxLength={255} placeholder="Produto" onChange={(e) => updateForm("name", e.target.value)} /></Field></div>
              <Field label="Categoria" required><select className={inputClass} value={form.categoryId} onChange={(e) => updateForm("categoryId", e.target.value)}><option value="">Selecione uma categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
              <Field label="Tipo de precificação" required><select className={inputClass} value={form.pricingType} onChange={(e) => updateForm("pricingType", e.target.value as PricingType)}>{pricingTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></Field>
              <Field label="Quantidade mínima"><input className={inputClass} type="number" min="1" step="1" value={form.minimumQuantity} placeholder="Ex.: 50" onChange={(e) => updateForm("minimumQuantity", e.target.value)} /></Field>
              <div className="md:col-span-2 lg:col-span-3"><Field label="Descrição"><textarea className={`${inputClass} min-h-28 resize-y`} value={form.description} placeholder="Descreva o produto..." onChange={(e) => updateForm("description", e.target.value)} /></Field></div>
            </div>
            <label className="mt-5 inline-flex cursor-pointer items-center gap-2.5 text-sm text-[#51483f]"><input type="checkbox" checked={form.active} onChange={(e) => updateForm("active", e.target.checked)} className="h-4 w-4 accent-[#a98a58]" /> Produto ativo</label>
          </section>

          <section className={sectionClass}>
            <SectionHeading title="Características" />
            <div className="grid gap-5 md:grid-cols-2">
              {characteristicFields.map(({ key, label, placeholder }) => (
                <div key={key} className="min-w-0">
                  <Field label={label}>
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        value={characteristicInputs[key]}
                        placeholder={placeholder}
                        onChange={(e) => setCharacteristicInputs((current) => ({ ...current, [key]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCharacteristic(key); } }}
                      />
                      <button type="button" onClick={() => addCharacteristic(key)} aria-label={`Adicionar ${label.toLowerCase()}`} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#e2d7c9] px-3 text-sm text-[#946f3d] hover:bg-[#faf7f2]">
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </Field>
                  {characteristics[key].length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {characteristics[key].map((value) => (
                        <span
                            key={value}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
                            style={{
                              backgroundColor:
                                key === "colors"
                                  ? getColor(value) ?? "#faf8f5"
                                  : "#faf8f5",
                                                      color:
                          (label === "Cores" || key === "colors") && getColor(value)
                            ? ["branco", "branca"].includes(value.trim().toLowerCase())
                              ? "#000000"
                              : "#FFFFFF"
                            : "#342d27",
                              borderColor: "#e6ded2",
                            }}
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => removeCharacteristic(key, value)}
                              aria-label={`Remover ${value}`}
                              className="text-[#a66b55] hover:text-red-700"
                            >
                              <Trash2 className={
                            key === "colors" && getColor(value)
                              ? ["branco", "branca"].includes(value.trim().toLowerCase())
                                ? "text-black hover:text-red-700"
                                : "text-white hover:text-red-200"
                              : "text-[#a66b55] hover:text-red-700"
                          } size={14} />
                            </button>
                          </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <SectionHeading title="Produção e validade" />
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Validade (dias)"><input className={inputClass} type="number" min="1" step="1" value={form.shelfLifeDays} onChange={(e) => updateForm("shelfLifeDays", e.target.value)} placeholder="Ex.: 30" /></Field>
              <Field label="Produção mínima (dias)"><input className={inputClass} type="number" min="0" step="1" value={form.productionLeadTimeMinDays} onChange={(e) => updateForm("productionLeadTimeMinDays", e.target.value)} placeholder="Ex.: 3" /></Field>
              <Field label="Produção máxima (dias)"><input className={inputClass} type="number" min="0" step="1" value={form.productionLeadTimeMaxDays} onChange={(e) => updateForm("productionLeadTimeMaxDays", e.target.value)} placeholder="Ex.: 7" /></Field>
            </div>
          </section>

          {form.pricingType !== "QUOTE" && (
            <section className={sectionClass}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <SectionHeading title="Preços" description={form.pricingType === "TIERED" ? "Defina os preços por faixa de quantidade." : "Defina o preço unitário do produto."} />
                <button type="button" onClick={() => setPrices((current) => [...current, { minimumQuantity: "", unitPrice: "" }])} className="inline-flex items-center gap-2 rounded-xl border border-[#e2d7c9] px-4 py-2.5 text-sm text-[#946f3d] hover:bg-[#faf7f2]"><Plus size={16} /> Add preço</button>
              </div>
              <div className="space-y-3">
                {prices.map((price, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-xl bg-[#faf8f5] p-3 sm:gap-5 sm:p-4">
                    <Field label="Quantidade mínima"><input className={inputClass} type="number" min="1" step="1" value={price.minimumQuantity} placeholder="50" onChange={(e) => updatePrice(index, "minimumQuantity", e.target.value)} /></Field>
                    <Field label="Preço unitário (R$)"><input className={inputClass} type="number" min="0.01" step="0.01" value={price.unitPrice} placeholder="3,50" onChange={(e) => updatePrice(index, "unitPrice", e.target.value)} /></Field>
                    <button type="button" aria-label="Remover preço" title="Remover preço" onClick={() => setPrices((current) => current.filter((_, i) => i !== index))} className="mb-0.5 rounded-xl border border-[#eaded6] bg-white p-3 text-[#a66b55] hover:bg-red-50"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={sectionClass}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <SectionHeading title="Taxas adicionais" />
              <button type="button" onClick={() => setFees((current) => [...current, { name: "", amount: "", chargeType: "PER_ORDER", required: false, active: true }])} className="inline-flex items-center gap-2 rounded-xl border border-[#e2d7c9] px-4 py-2.5 text-sm text-[#946f3d] hover:bg-[#faf7f2]"><Plus size={16} /> Add taxa</button>
            </div>
            {fees.length === 0 ? <p className="rounded-xl border border-dashed border-[#e5dbcf] p-5 text-center text-sm text-[#93877b]">Nenhuma taxa adicional cadastrada.</p> : (
              <div className="space-y-4">
                {fees.map((fee, index) => (
                  <div key={index} className="rounded-xl border border-[#eee6dd] bg-[#faf8f5] p-4">
                    <div className="grid gap-4 md:grid-cols-[2fr_1fr_1.3fr_auto] md:items-end">
                      <Field label="Nome da taxa"><input className={inputClass} value={fee.name} placeholder="Ex.: Carimbo personalizado" onChange={(e) => updateFee(index, "name", e.target.value)} /></Field>
                      <Field label="Valor (R$)"><input className={inputClass} type="number" min="0" step="0.01" value={fee.amount} placeholder="0,00" onChange={(e) => updateFee(index, "amount", e.target.value)} /></Field>
                      <Field label="Cobrança"><select className={inputClass} value={fee.chargeType} onChange={(e) => updateFee(index, "chargeType", e.target.value as ChargeType)}>{chargeTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></Field>
                      <button type="button" aria-label="Remover taxa" title="Remover taxa" onClick={() => setFees((current) => current.filter((_, i) => i !== index))} className="rounded-xl border border-[#eaded6] bg-white p-3 text-[#a66b55] hover:bg-red-50"><Trash2 size={18} /></button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-6">
                      <label className="inline-flex items-center gap-2 text-sm text-[#51483f]"><input type="checkbox" checked={fee.required} onChange={(e) => updateFee(index, "required", e.target.checked)} className="accent-[#a98a58]" /> Taxa obrigatória</label>
                      <label className="inline-flex items-center gap-2 text-sm text-[#51483f]"><input type="checkbox" checked={fee.active} onChange={(e) => updateFee(index, "active", e.target.checked)} className="accent-[#a98a58]" /> Taxa ativa</label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" disabled={saving} onClick={() => router.push("/produtos")} className="rounded-xl border border-[#e2d7c9] bg-white px-6 py-3 text-sm text-[#65584b] hover:bg-[#faf7f2] disabled:opacity-60">Cancelar</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-6 py-3 text-sm font-semibold text-white hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} /> {saving ? "Salvando..." : "Cadastrar produto"}</button>
          </div>
        </form>
      </main>
    </DashboardLayout>
  );
}