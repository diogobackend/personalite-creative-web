"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Loader2, Minus, Plus, Save, Trash2 } from "lucide-react";
import { api } from "../../../src/lib/api";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";

type PaymentMethod = "PIX" | "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "BANK_TRANSFER" | "BANK_SLIP";
type Customer = { id: string; name: string; email?: string | null; cpf?: string | null; rg?: string | null; phone?: string | null };
type PriceTier = { minimumQuantity: number; unitPrice: number };
type Product = { id: string; name: string; commercialCode?: string | null; price?: number | null; prices: PriceTier[] };
type SaleItemForm = {
  key: number;
  productId: string;
  quantity: number;
  color: string;
  size: string;
  material: string;
  brand: string;
  model: string;
};

const createSaleItem = (key: number): SaleItemForm => ({
  key, productId: "", quantity: 1,
  color: "", size: "", material: "", brand: "", model: "",
});
type SaleForm = {
  customerId: string;
  hasDeliveryDeadline: boolean;
  deliveryDeadline: string;
  downPaymentPercentage: "0" | "0" | "50" | "100";
  paidPercentage: string;
  paymentMethod: PaymentMethod;
  observation: string;
  items: SaleItemForm[];
};

const INPUT_CLASS = "w-full rounded-xl border border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#342d27] outline-none transition placeholder:text-[#aaa197] focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";
const LABEL_CLASS = "mb-2 block text-sm font-semibold text-[#51473d]";
const SECTION_CLASS = "rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6";
const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "PIX", label: "Pix" },
  { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT_CARD", label: "Cartão de crédito" },
  { value: "DEBIT_CARD", label: "Cartão de débito" },
  { value: "BANK_TRANSFER", label: "Transferência bancária" },
  { value: "BANK_SLIP", label: "Boleto" },
];

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <div><label className={LABEL_CLASS}>{label}{required && <span className="ml-1 text-red-500">*</span>}</label>{children}</div>;
}

function SearchSelect<T extends { id: string; name: string }>({
  items, value, onChange, placeholder, renderOption, getSearchText,
}: {
  items: T[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  renderOption?: (item: T) => ReactNode;
  getSearchText?: (item: T) => string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.id === value);
  const filtered = items.filter((item) => (getSearchText?.(item) ?? item.name)
    .toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));

  return (
    <div className="relative">
      <input
        type="text"
        className={INPUT_CLASS}
        autoComplete="off"
        placeholder={placeholder}
        value={open ? search : selected?.name ?? ""}
        onFocus={() => { setSearch(""); setOpen(true); }}
        onChange={(event) => { setSearch(event.target.value); setOpen(true); if (value) onChange(""); }}
        onBlur={() => setOpen(false)}
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#e8e0d4] bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#81766b]">Nenhum resultado encontrado.</p>
          ) : filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(event) => { event.preventDefault(); onChange(item.id); setSearch(""); setOpen(false); }}
              className="block w-full px-4 py-3 text-left text-sm text-[#342d27] transition hover:bg-[#f4ede2]"
            >
              {renderOption?.(item) ?? item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function customerLabel(customer: Customer): string {
  const identifiers = [customer.email, customer.cpf, customer.rg, customer.phone]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .slice(0, 2);
  return [customer.name, ...identifiers].join(" — ");
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getUnitPrice(product: Product | undefined, quantity: number): number | null {
  if (!product) return null;
  const tiers = [...product.prices].sort((a, b) => a.minimumQuantity - b.minimumQuantity);
  if (tiers.length === 0) return product.price ?? null;
  // A primeira faixa também vale para quantidades inferiores ao seu mínimo.
  const applicable = tiers.filter((tier) => quantity >= tier.minimumQuantity);
  return (applicable.at(-1) ?? tiers[0]).unitPrice;
}

export default function NewSalePage() {
  const router = useRouter();
  const [form, setForm] = useState<SaleForm>({
    customerId: "",
    hasDeliveryDeadline: false,
    deliveryDeadline: "",
    downPaymentPercentage: "50",
    paidPercentage: "0",
    paymentMethod: "PIX",
    observation: "",
    items: [createSaleItem(0)],
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = <K extends keyof SaleForm>(field: K, value: SaleForm[K]) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const updateItem = (key: number, patch: Partial<Omit<SaleItemForm, "key">>) =>
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item) => item.key === key ? { ...item, ...patch } : item),
    }));

  useEffect(() => {
    const controller = new AbortController();
    async function loadOptions() {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const config = { signal: controller.signal, headers: token ? { Authorization: `Bearer ${token}` } : undefined };
        const [customersResponse, productsResponse] = await Promise.all([
          api.get("/users", { ...config, params: { page: 0, size: 100 } }),
          api.get("/products", { ...config, params: { page: 0, size: 100, sortBy: "name", sortDirection: "ASC" } }),
        ]);
        if (controller.signal.aborted) return;
        const usersData = customersResponse.data?.content ?? customersResponse.data;
        const productsData = productsResponse.data?.content ?? productsResponse.data;
        setCustomers((Array.isArray(usersData) ? usersData : []).filter((user: { role?: string; roles?: string[] }) =>
          user.role === "CANDIDATE" || user.roles?.includes("CANDIDATE")
        ).map((user: {
          userId?: string; id?: string; name: string; email?: string; cpf?: string; rg?: string; phone?: string; telephone?: string; role?: string; roles?: string[];
        }) => ({
          id: user.userId ?? user.id ?? "",
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          rg: user.rg,
          phone: user.phone ?? user.telephone,
        })).filter((user: Customer) => user.id));
        setProducts((Array.isArray(productsData) ? productsData : []).map((product: {
          id: string; name: string; commercialCode?: string; code?: string; price?: number | string;
          salePrice?: number | string; sellingPrice?: number | string; prices?: { minimumQuantity: number; unitPrice: number | string }[];
        }) => ({
          id: product.id,
          name: product.name,
          commercialCode: product.commercialCode ?? product.code,
          price: toNumber(product.salePrice ?? product.sellingPrice ?? product.price),
          prices: (product.prices ?? []).map((tier) => ({
            minimumQuantity: tier.minimumQuantity, unitPrice: toNumber(tier.unitPrice) ?? 0,
          })).filter((tier) => tier.minimumQuantity > 0 && tier.unitPrice > 0),
        })));
      } catch (exception) {
        if (controller.signal.aborted || axios.isCancel(exception)) return;
        setError("Não foi possível carregar clientes ou produtos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadOptions();
    return () => controller.abort();
  }, []);

  const total = form.items.reduce((sum, item) => {
    const price = getUnitPrice(products.find((product) => product.id === item.productId), item.quantity) ?? 0;
    return sum + price * item.quantity;
  }, 0);
  const paidPercentage = Number(form.paidPercentage);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (form.items.length === 0 || form.items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setError("Selecione pelo menos um produto e informe uma quantidade válida."); return;
    }
    if (form.items.some((item) => {
      const price = getUnitPrice(products.find((product) => product.id === item.productId), item.quantity);
      return price == null || price <= 0;
    })) {
      setError("Um ou mais produtos estão sem preço de venda válido."); return;
    }
    if (!form.customerId) { setError("Selecione um cliente."); return; }
    if (form.hasDeliveryDeadline && !form.deliveryDeadline) { setError("Informe o prazo de entrega."); return; }
    if (!Number.isFinite(total) || total <= 0) { setError("O valor total deve ser maior que zero."); return; }
    if (!Number.isFinite(paidPercentage) || paidPercentage < 0 || paidPercentage > 100) {
      setError("O percentual já pago deve estar entre 0 e 100."); return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      await api.post("/sales", {
        customerId: form.customerId,
        deliveryDeadline: form.hasDeliveryDeadline ? form.deliveryDeadline : null,
        totalAmount: Number(total.toFixed(2)),
        downPaymentPercentage: Number(form.downPaymentPercentage),
        paidPercentage,
        paymentMethod: form.paymentMethod,
        observation: form.observation.trim() || null,
        items: form.items.map((item) => ({
          productId: item.productId,
          inventoryId: null,
          quantity: item.quantity,
          color: item.color.trim() || null,
          size: item.size.trim() || null,
          material: item.material.trim() || null,
          brand: item.brand.trim() || null,
          model: item.model.trim() || null,
        })),
      }, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      router.push("/vendas");
    } catch (exception) {
      if (axios.isAxiosError(exception)) {
        const message = exception.response?.data?.message;
        setError(typeof message === "string" ? message : "Não foi possível cadastrar a venda.");
      } else {
        setError("Ocorreu um erro inesperado ao cadastrar a venda.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6 pb-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link href="/vendas" className="inline-flex items-center gap-2 text-sm font-medium text-[#927448] transition hover:text-[#725934]"><ArrowLeft size={16} />Voltar para vendas</Link>
            <h1 className="mt-3 font-serif text-3xl text-[#342d27] sm:text-4xl">Nova venda</h1>
          </div>
          <button type="submit" disabled={saving || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{saving ? "Salvando..." : "Registrar"}
          </button>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>}

        <section className="rounded-2xl border border-[#d9c4a4] bg-[#f8f2e8] p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            <button type="button" onClick={() => setForm((previous) => ({
              ...previous,
              items: [...previous.items, createSaleItem(Math.max(-1, ...previous.items.map((item) => item.key)) + 1)],
            }))} className="inline-flex items-center gap-2 rounded-xl border border-[#d9c4a4] bg-white px-4 py-2 text-sm font-semibold text-[#927448] transition hover:bg-[#f4ede2]"><Plus size={16} />Adicionar produto</button>
          </div>

          <div className="mt-6 space-y-3">
            {form.items.map((item, index) => {
              const product = products.find((entry) => entry.id === item.productId);
              const unitPrice = getUnitPrice(product, item.quantity) ?? 0;
              return (
                <div key={item.key} className="rounded-xl border border-[#e8ddcb] bg-white p-4">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px_135px_44px] sm:items-end">
                  <Field label={`Produto ${index + 1}`} required>
                    <SearchSelect
                      items={products}
                      value={item.productId}
                      onChange={(productId) => updateItem(item.key, { productId })}
                      placeholder={loading ? "Carregando produtos..." : "Nome ou código comercial..."}
                      getSearchText={(entry) => `${entry.name} ${entry.commercialCode ?? ""}`}
                      renderOption={(entry) => <span>{entry.name}{entry.commercialCode && <span className="ml-2 text-xs text-[#81766b]">{entry.commercialCode}</span>}</span>}
                    />
                  </Field>
                  <Field label="Qtd">
                    <div className="flex h-[46px] items-center justify-between rounded-xl border border-[#e8e0d4] bg-white">
                      <button type="button" aria-label="Diminuir quantidade" disabled={item.quantity <= 1} onClick={() => updateItem(item.key, { quantity: Math.max(1, item.quantity - 1) })} className="px-2 text-[#927448] disabled:opacity-30"><Minus size={16} /></button>
                      <input type="number" min="1" step="1" aria-label="Quantidade" value={item.quantity} onChange={(event) => updateItem(item.key, { quantity: Number(event.target.value) })} className="w-12 bg-transparent text-center text-sm font-semibold text-[#342d27] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      <button type="button" aria-label="Aumentar quantidade" onClick={() => updateItem(item.key, { quantity: item.quantity + 1 })} className="px-2 text-[#927448]"><Plus size={16} /></button>
                    </div>
                  </Field>
                  <div>
                    <p className={LABEL_CLASS}>Valor</p>
                    <p className="flex h-[46px] items-center text-sm font-semibold text-[#342d27]">{formatCurrency(unitPrice * item.quantity)}</p>
                    {product && <p className="text-xs text-[#81766b]">{formatCurrency(unitPrice)} / un.</p>}
                  </div>
                  <button type="button" title="Remover produto" disabled={form.items.length === 1} onClick={() => setForm((previous) => ({ ...previous, items: previous.items.filter((entry) => entry.key !== item.key) }))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:opacity-30"><Trash2 size={18} /></button>
                  </div>
                  {item.productId && (
                    <details className="mt-4 border-t border-[#ece6dc] pt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-[#927448] marker:text-[#927448]">
                        Add características
                      </summary>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {([
                          ["color", "Cor"],
                          ["size", "Tamanho"],
                          ["material", "Material"],
                          ["brand", "Marca"],
                          ["model", "Modelo"],
                        ] as const).map(([field, label]) => (
                          <Field key={field} label={label}>
                            <input
                              type="text"
                              value={item[field]}
                              onChange={(event) => updateItem(item.key, { [field]: event.target.value })}
                              className={INPUT_CLASS}
                              placeholder={`${label} (opcional)`}
                            />
                          </Field>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-5">
            <Field label="Observação">
              <textarea
                value={form.observation}
                onChange={(event) => updateForm("observation", event.target.value)}
                rows={3}
                placeholder="Adicione observações sobre a venda, qualquer coisa..."
                className={INPUT_CLASS}
              />
            </Field>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-[#e2cfb3] bg-[#efe2cd] px-5 py-4">
            <span className="text-sm font-semibold text-[#51473d]">Total</span>
            <span className="text-xl font-bold text-[#342d27]">{formatCurrency(total)}</span>
          </div>
        </section>

        <div className="space-y-5">
          <Field label="Cliente" required>
            <SearchSelect
              items={customers}
              value={form.customerId}
              onChange={(id) => updateForm("customerId", id)}
              placeholder={loading ? "Carregando clientes..." : "Digite o nome do cliente..."}
              getSearchText={(customer) => customer.name}
              renderOption={(customer) => customerLabel(customer)}
            />
          </Field>

          <div>
            <p className={LABEL_CLASS}>Tem prazo de entrega?</p>
            <div className="flex flex-wrap gap-3">
              {([false, true] as const).map((value) => (
                <label key={String(value)} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${form.hasDeliveryDeadline === value ? "border-[#a98a58] bg-[#f4ede2] text-[#342d27]" : "border-[#e8e0d4] bg-white text-[#51473d]"}`}>
                  <input type="radio" name="hasDeliveryDeadline" checked={form.hasDeliveryDeadline === value} onChange={() => setForm((previous) => ({ ...previous, hasDeliveryDeadline: value, deliveryDeadline: value ? previous.deliveryDeadline : "" }))} className="accent-[#a98a58]" />
                  {value ? "Sim" : "Não"}
                </label>
              ))}
            </div>
            {form.hasDeliveryDeadline && <div className="mt-4 max-w-sm"><Field label="Data de entrega" required><input type="date" required value={form.deliveryDeadline} onChange={(event) => updateForm("deliveryDeadline", event.target.value)} className={INPUT_CLASS} /></Field></div>}
          </div>
        </div>

        <section className={SECTION_CLASS}>
          <h2 className="text-lg font-semibold text-[#342d27]">Pagamento</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <Field label="Entrada (%)" required>
              <select value={form.downPaymentPercentage} onChange={(event) => updateForm("downPaymentPercentage", event.target.value as "0" | "50" | "100")} className={INPUT_CLASS}>
                <option value="0">0%</option>
                <option value="50">50%</option>
                <option value="100">100%</option>
              </select>
            </Field>
            <Field label="Já pago (%)" required>
              <select value={form.paidPercentage} onChange={(event) => updateForm("paidPercentage", event.target.value)} className={INPUT_CLASS}>
                <option value="0">0%</option>
                <option value="50">50%</option>
                <option value="100">100%</option>
              </select>
            </Field>
            <Field label="Forma de pagamento" required>
              <select value={form.paymentMethod} onChange={(event) => updateForm("paymentMethod", event.target.value as PaymentMethod)} className={INPUT_CLASS}>
                {PAYMENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
          </div>
         <div className="mt-6 grid gap-3 rounded-xl bg-[#f4ede2] px-5 py-4 text-sm sm:grid-cols-4">
  <div>
    <p className="text-[#81766b]">Total</p>
    <p className="mt-1 font-bold text-[#342d27]">{formatCurrency(total)}</p>
  </div>

  <div>
    <p className="text-[#81766b]">Entrada</p>
    <p className="mt-1 font-bold text-[#342d27]">
      {formatCurrency(total * Number(form.downPaymentPercentage) / 100)}
    </p>
  </div>

  <div>
    <p className="text-[#81766b]">Já pago</p>
    <p className="mt-1 font-bold text-[#342d27]">
      {formatCurrency(total * paidPercentage / 100)}
    </p>
  </div>

  <div>
    <p className="text-[#81766b]">Faltam</p>
    <p className="mt-1 font-bold text-[#342d27]">
      {formatCurrency(total * (100 - paidPercentage) / 100)}
    </p>
  </div>
</div>
        </section>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link href="/vendas" className="inline-flex items-center justify-center rounded-xl border border-[#e8e0d4] bg-white px-6 py-3 text-sm font-semibold text-[#51473d] transition hover:bg-[#f8f5f0]">Cancelar</Link>
          <button type="submit" disabled={saving || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{saving ? "Salvando..." : "Registrar"}</button>
        </div>
      </form>
    </DashboardLayout>
  );
}
