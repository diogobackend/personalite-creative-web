"use client";

import { useEffect, useState, type FormEvent, type ReactNode, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Loader2, Minus, Plus, Save, Trash2 } from "lucide-react";
import { api } from "../../../../src/lib/api";
import DashboardLayout from "../../../../src/components/layout/DashboardLayout";

type PaymentMethod = "PIX" | "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "BANK_TRANSFER" | "BANK_SLIP";
type Customer = { id: string; name: string; email?: string | null; cpf?: string | null; rg?: string | null; phone?: string | null };
type Product = { id: string; name: string; commercialCode?: string | null; price: number | null; prices: { minimumQuantity: number; unitPrice: number }[] };

type ProductCharacteristics = {
  colors: string[];
  sizes: string[];
  materials: string[];
  brands: string[];
  models: string[];
};

const characteristicFields = [
  { field: "color", source: "colors", label: "Cor" },
  { field: "size", source: "sizes", label: "Tamanho" },
  { field: "material", source: "materials", label: "Material" },
  { field: "brand", source: "brands", label: "Marca" },
  { field: "model", source: "models", label: "Modelo" },
] as const;

type SaleItemResponse = { id?: string; productId: string; inventoryId?: string | null; quantity: number; unitPrice: number | string; additionalAmount?: number | string | null; color?: string | null; size?: string | null; material?: string | null; brand?: string | null; model?: string | null };
type SaleResponse = { id: string; customerId: string; deliveryDeadline?: string | null; deliveredAt?: string | null; totalAmount: number | string; downPaymentPercentage: number | string; paidPercentage: number | string; paymentMethod: PaymentMethod; observation?: string | null; items?: SaleItemResponse[], createdAt: string; };
type SaleItemForm = { key: number; productId: string; inventoryId: string | null; quantity: number; unitPrice: string; adjustmentType: "discount" | "addition" | ""; adjustmentAmount: string; color: string; size: string; material: string; brand: string; model: string };
type SaleForm = { customerId: string; hasDeliveryDeadline: boolean; deliveryDeadline: string; delivered: boolean; downPaymentPercentage: string; paidPercentage: string; paymentMethod: PaymentMethod; observation: string; items: SaleItemForm[] };

const INPUT = "w-full rounded-xl border border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#342d27] outline-none transition placeholder:text-[#aaa197] focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";
const LABEL = "mb-2 block text-sm font-semibold text-[#51473d]";
const SECTION = "rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6";
const BUTTON = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-60";
const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "PIX", label: "Pix" }, { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT_CARD", label: "Cartão de crédito" }, { value: "DEBIT_CARD", label: "Cartão de débito" },
  { value: "BANK_TRANSFER", label: "Transferência bancária" }, { value: "BANK_SLIP", label: "Boleto" },
];
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const numeric = (value: unknown): number => Number(String(value ?? "0").replace(",", "."));
const validNumber = (value: unknown) => value !== null && value !== undefined && value !== "" && Number.isFinite(numeric(value));
const visibleEmail = (email?: string | null) => email && !/^[0-9a-f]{8}-[0-9a-f-]{27,}@/i.test(email) && !/^(sememail|noemail|temp|temporary|fake|placeholder|generated|gerado)[^@]*@/i.test(email) ? email : null;
const dateOnly = (value?: string | null) => value?.slice(0, 10) ?? "";
const emptyItem = (key: number): SaleItemForm => ({ key, productId: "", inventoryId: null, quantity: 1, unitPrice: "", adjustmentType: "", adjustmentAmount: "", color: "", size: "", material: "", brand: "", model: "" });
const additional = (item: SaleItemForm) => (item.adjustmentType === "discount" ? -1 : 1) * numeric(item.adjustmentAmount);
const itemTotal = (item: SaleItemForm) =>
  numeric(item.unitPrice) * item.quantity + additional(item);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className={LABEL}>{label}</label>{children}</div>;
}

function Choice({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <div><p className={LABEL}>{label}</p><div className="flex flex-wrap gap-3">{([false, true] as const).map((option) => (
    <label key={String(option)} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold ${value === option ? "border-[#a98a58] bg-[#f4ede2] text-[#342d27]" : "border-[#e8e0d4] bg-white text-[#51473d]"}`}>
      <input type="radio" checked={value === option} onChange={() => onChange(option)} className="accent-[#a98a58]" />{option ? "Sim" : "Não"}
    </label>
  ))}</div></div>;
}

function SearchSelect<T extends { id: string; name: string }>({ items, value, onChange, placeholder, renderLabel }: { items: T[]; value: string; onChange: (id: string) => void; placeholder: string; renderLabel?: (item: T) => string }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.id === value);
  const filtered = items.filter((item) => (renderLabel?.(item) ?? item.name).toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  return <div className="relative">
    <input className={INPUT} value={open ? search : selected ? renderLabel?.(selected) ?? selected.name : ""} placeholder={placeholder} autoComplete="off"
      onFocus={() => { setSearch(""); setOpen(true); }} onBlur={() => setOpen(false)}
      onChange={(event) => { setSearch(event.target.value); setOpen(true); if (value) onChange(""); }} />
    {open && <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#e8e0d4] bg-white shadow-lg">
      {filtered.length ? filtered.map((item) => <button key={item.id} type="button" className="block w-full px-4 py-3 text-left text-sm hover:bg-[#f4ede2]" onMouseDown={(event) => { event.preventDefault(); onChange(item.id); setOpen(false); setSearch(""); }}>{renderLabel?.(item) ?? item.name}</button>) : <p className="p-4 text-sm text-[#81766b]">Nenhum resultado.</p>}
    </div>}
  </div>;
}

function mapSaleItem(item: SaleItemResponse, key: number): SaleItemForm {
  const adjustment = numeric(item.additionalAmount);
  return { key, productId: item.productId, inventoryId: item.inventoryId ?? null, quantity: item.quantity, unitPrice: String(item.unitPrice), adjustmentType: adjustment < 0 ? "discount" : adjustment > 0 ? "addition" : "", adjustmentAmount: adjustment ? String(Math.abs(adjustment)) : "", color: item.color ?? "", size: item.size ?? "", material: item.material ?? "", brand: item.brand ?? "", model: item.model ?? "" };
}

function EditSaleContent() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [original, setOriginal] = useState<SaleResponse | null>(null);
  const [form, setForm] = useState<SaleForm | null>(null);
  const [editRegistration, setEditRegistration] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [itemsAvailable, setItemsAvailable] = useState(false);
  const [itemsChanged, setItemsChanged] = useState(false);

  const [productCharacteristics, setProductCharacteristics] =
  useState<Record<string, ProductCharacteristics>>({});

const selectedProductIds = [...new Set(
  (form?.items ?? []).map((item) => item.productId).filter(Boolean)
)].sort().join(",");

useEffect(() => {
  if (!selectedProductIds) return;

  const controller = new AbortController();

  async function loadCharacteristics() {
    const token = localStorage.getItem("access_token");

    await Promise.all(
      selectedProductIds.split(",").map(async (productId) => {
        try {
          const { data } = await api.get(`/products/${productId}`, {
            signal: controller.signal,
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
          });

          if (controller.signal.aborted) return;

          const product = data.product ?? data;

          setProductCharacteristics((current) => ({
            ...current,
            [productId]: {
              colors: product.colors ?? [],
              sizes: product.sizes ?? [],
              materials: product.materials ?? [],
              brands: product.brands ?? [],
              models: product.models ?? [],
            },
          }));
        } catch {
          // Mantém os dados da venda quando a consulta falhar.
        }
      })
    );
  }

  void loadCharacteristics();

  return () => controller.abort();
}, [selectedProductIds]);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("access_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    async function load() {
      setLoading(true);
      try {
        const [saleResult, usersResult, productsResult] = await Promise.all([
          api.get<SaleResponse>(`/sales/${id}`, { signal: controller.signal, headers }),
          api.get("/users", { signal: controller.signal, headers, params: { page: 0, size: 100 } }),
          api.get("/products", { signal: controller.signal, headers, params: { page: 0, pageSize: 100, sortBy: "name", sortDirection: "ASC" } }),
        ]);
        if (controller.signal.aborted) return;
        const sale = saleResult.data;
        const users = usersResult.data?.content ?? usersResult.data;
        const productsData = productsResult.data?.content ?? productsResult.data;
        setOriginal(sale);
        setItemsAvailable(Array.isArray(sale.items) && sale.items.every((item) => validNumber(item.unitPrice) && numeric(item.unitPrice) > 0));
        setForm({
          customerId: sale.customerId,
          hasDeliveryDeadline: Boolean(sale.deliveryDeadline),
          deliveryDeadline: dateOnly(sale.deliveryDeadline),
          delivered: Boolean(sale.deliveredAt),
          downPaymentPercentage: String(sale.downPaymentPercentage),
          paidPercentage: String(sale.paidPercentage),
          paymentMethod: sale.paymentMethod,
          observation: sale.observation ?? "",
          items: (sale.items ?? []).map(mapSaleItem),
        });
        setCustomers((Array.isArray(users) ? users : []).filter((user: { role?: string; roles?: string[] }) => user.role === "CANDIDATE" || user.roles?.includes("CANDIDATE")).map((user: { userId?: string; id?: string; name: string; email?: string; cpf?: string; rg?: string; phone?: string; telephone?: string }) => ({ id: user.userId ?? user.id ?? "", name: user.name, email: user.email, cpf: user.cpf, rg: user.rg, phone: user.phone ?? user.telephone })).filter((user: Customer) => user.id));
        setProducts((Array.isArray(productsData) ? productsData : []).map((product: { id: string; name: string; commercialCode?: string; code?: string; price?: number | string; salePrice?: number | string; sellingPrice?: number | string; prices?: { minimumQuantity: number; unitPrice: number | string }[] }) => ({ id: product.id, name: product.name, commercialCode: product.commercialCode ?? product.code, price: product.salePrice != null || product.sellingPrice != null || product.price != null ? numeric(product.salePrice ?? product.sellingPrice ?? product.price) : null, prices: (product.prices ?? []).map((tier) => ({ minimumQuantity: tier.minimumQuantity, unitPrice: numeric(tier.unitPrice) })) })));
      } catch (exception) {
        if (!controller.signal.aborted && !axios.isCancel(exception)) setError("Não foi possível carregar a venda.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    if (id) void load();
    return () => controller.abort();
  }, [id]);

  const update = <K extends keyof SaleForm>(field: K, value: SaleForm[K]) => setForm((previous) => previous ? { ...previous, [field]: value } : previous);
  const updateItem = (key: number, patch: Partial<SaleItemForm>) => { setItemsChanged(true); setForm((previous) => previous ? { ...previous, items: previous.items.map((item) => item.key === key ? { ...item, ...patch } : item) } : previous); };
  // Enquanto o carrinho não for alterado, o total oficial é o valor salvo na venda.
  // Depois de uma alteração, recalculamos a partir dos preços unitários originais.
  const cartPricesValid = Boolean(
    form?.items.length && form.items.every((item) =>
      validNumber(item.unitPrice) && numeric(item.unitPrice) > 0 &&
      Number.isInteger(item.quantity) && item.quantity > 0
    )
  );
  const total = itemsChanged && cartPricesValid
    ? form!.items.reduce((sum, item) => sum + itemTotal(item), 0)
    : numeric(original?.totalAmount);
  const totalKnown = itemsChanged
    ? cartPricesValid
    : validNumber(original?.totalAmount);
  const customerName = customers.find((customer) => customer.id === form?.customerId)?.name ?? "Cliente não identificado";
  const paid = numeric(form?.paidPercentage);
  const downPayment = numeric(form?.downPaymentPercentage);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !original) return;
    setError(null);
    if (![paid, downPayment].every((value) => Number.isFinite(value) && value >= 0 && value <= 100)) { setError("Os percentuais devem estar entre 0 e 100."); return; }
    if (editRegistration && form.hasDeliveryDeadline && !form.deliveryDeadline) { setError("Informe o prazo de entrega."); return; }
    const changes: Record<string, unknown> = {};
    if (paid !== numeric(original.paidPercentage)) changes.paidPercentage = paid;
    if (editRegistration && downPayment !== numeric(original.downPaymentPercentage)) changes.downPaymentPercentage = downPayment;
    if (editRegistration && form.paymentMethod !== original.paymentMethod) changes.paymentMethod = form.paymentMethod;
    if (form.delivered !== Boolean(original.deliveredAt)) changes.delivered = form.delivered;
    const deadline = form.hasDeliveryDeadline ? form.deliveryDeadline : null;
    if (editRegistration && deadline !== dateOnly(original.deliveryDeadline || null) && !(deadline === null && !original.deliveryDeadline)) changes.deliveryDeadline = deadline;

    if (editRegistration) {
      if (!form.customerId) { setError("Selecione um cliente."); return; }
      if (form.customerId !== original.customerId) changes.customerId = form.customerId;
      if ((form.observation.trim() || null) !== (original.observation ?? null)) changes.observation = form.observation.trim() || null;
      if (itemsChanged) {
        if (!cartPricesValid) {
          setError("Não é possível atualizar os produtos sem os preços unitários originais. Confira os dados retornados pela API.");
          return;
        }
        if (!form.items.length || form.items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(numeric(item.unitPrice)) || numeric(item.unitPrice) <= 0 || !Number.isFinite(numeric(item.adjustmentAmount)) || numeric(item.adjustmentAmount) < 0 || itemTotal(item) <= 0)) {
          setError("Informe produtos, quantidades e valores válidos. Cada item deve ter total positivo."); return;
        }
        const newItems = form.items.map((item) => ({ productId: item.productId, inventoryId: item.inventoryId, quantity: item.quantity, unitPrice: numeric(item.unitPrice), additionalAmount: additional(item), color: item.color.trim() || null, size: item.size.trim() || null, material: item.material.trim() || null, brand: item.brand.trim() || null, model: item.model.trim() || null }));
        const oldItems = (original.items ?? []).map((item) => ({ productId: item.productId, inventoryId: item.inventoryId ?? null, quantity: item.quantity, unitPrice: numeric(item.unitPrice), additionalAmount: numeric(item.additionalAmount), color: item.color ?? null, size: item.size ?? null, material: item.material ?? null, brand: item.brand ?? null, model: item.model ?? null }));
        if (JSON.stringify(newItems) !== JSON.stringify(oldItems)) changes.items = newItems;
      }
    }
    if (!Object.keys(changes).length) { router.push("/vendas"); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      await api.patch(`/sales/${id}`, changes, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      router.push("/vendas");
    } catch (exception) {
      const message = axios.isAxiosError(exception) ? exception.response?.data?.message : null;
      setError(typeof message === "string" ? message : "Não foi possível atualizar a venda.");
    } finally { setSaving(false); }
  }

  if (loading || !form || !original) return <DashboardLayout><div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center gap-3 text-[#81766b]">{loading ? <><Loader2 size={20} className="animate-spin" /> Carregando venda...</> : <p role="alert">{error ?? "Venda não encontrada."}</p>}</div></DashboardLayout>;

  return <DashboardLayout><form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6 pb-10">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><Link href="/vendas" className="inline-flex items-center gap-2 text-sm font-medium text-[#927448]"><ArrowLeft size={16} /> Voltar para vendas</Link><h1 className="mt-3 font-serif text-3xl text-[#342d27] sm:text-4xl">Atualizar venda</h1></div>
      <button type="submit" disabled={saving} className={BUTTON}>{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{saving ? "Salvando..." : "Salvar alterações"}</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}

    <section className={SECTION}>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Valor Já pago (%)"><select className={INPUT} value={form.paidPercentage} onChange={(event) => update("paidPercentage", event.target.value)}>{[0, 50, 100].map((value) => <option key={value} value={value}>{value}%</option>)}</select></Field>
        {form.hasDeliveryDeadline && (
        <Choice
            label="Já foi entregue?"
            value={form.delivered}
            onChange={(value) => update("delivered", value)}
        />
        )}
      </div>
      <div className="mt-6 rounded-xl bg-[#f4ede2] px-5 py-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-4">{[["Total", total], ["Entrada", total * downPayment / 100], ["Já pago", total * paid / 100], ["Faltam", total * (100 - paid) / 100]].map(([label, value]) => <div key={String(label)}><p className="text-[#81766b]">{label}</p><p className="mt-1 font-bold text-[#342d27]">{totalKnown ? money(Number(value)) : "Valor indisponível"}</p></div>)}</div>
        <div className="mt-4 grid gap-4 border-t border-[#e4d7c4] pt-4 sm:grid-cols-2">
          <div><p className="mb-2 font-semibold text-[#51473d]">Produtos</p>{(original.items ?? []).length ? original.items!.map((item, index) => <p key={item.id ?? index} className="py-0.5 text-[#342d27]">{products.find((product) => product.id === item.productId)?.name ?? `Produto ${item.productId.slice(0, 8)}`} ({item.quantity})</p>) : <p className="text-[#81766b]">Produtos não disponíveis na consulta.</p>}</div>
          <div>
            <p className="font-semibold text-[#51473d]">Cliente: <span className="font-normal text-[#342d27]">{customerName}</span></p>
            <p className="mt-2 font-semibold text-[#51473d]">
                Vendido em:{" "}
                <span className="font-normal text-[#342d27]">
                    {new Date(original.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    })}
                </span>
                </p>
            </div>
          
        </div>
      </div>
      {form.delivered && original.deliveredAt && <p className="mt-4 text-sm text-[#81766b]">Entregue em {new Date(original.deliveredAt).toLocaleString("pt-BR")}</p>}
    </section>

    <section className={SECTION}>
      <Choice label="Alterar dados cadastrais da venda?" value={editRegistration} onChange={setEditRegistration} />
      {editRegistration && <div className="mt-6 space-y-6 border-t border-[#ece6dc] pt-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Entrada (%)"><select className={INPUT} value={form.downPaymentPercentage} onChange={(event) => update("downPaymentPercentage", event.target.value)}>{[0, 50, 100].map((value) => <option key={value} value={value}>{value}%</option>)}</select></Field>
          <Field label="Forma de pagamento"><select className={INPUT} value={form.paymentMethod} onChange={(event) => update("paymentMethod", event.target.value as PaymentMethod)}>{PAYMENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
          <Choice label="Tem prazo de entrega?" value={form.hasDeliveryDeadline} onChange={(value) => setForm((previous) => previous ? { ...previous, hasDeliveryDeadline: value, deliveryDeadline: value ? previous.deliveryDeadline : "", delivered: value ? previous.delivered : false } : previous)} />
          {form.hasDeliveryDeadline && <Field label="Prazo de entrega"><input type="date" required className={INPUT} value={form.deliveryDeadline} onChange={(event) => update("deliveryDeadline", event.target.value)} /></Field>}
        </div>
        <Field label="Cliente"><SearchSelect items={customers} value={form.customerId} onChange={(customerId) => update("customerId", customerId)} placeholder="Digite o nome do cliente..." renderLabel={(customer) => [customer.name, visibleEmail(customer.email), customer.cpf, customer.rg, customer.phone].filter(Boolean).join(" — ")} /></Field>
        <div className="rounded-xl border border-[#e8ddcb] bg-[#f8f2e8] p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h3 className="font-semibold text-[#342d27]">Produtos vendidos</h3>
    <button
      type="button"
      onClick={() => {
        setItemsChanged(true);
        setForm((previous) =>
          previous
            ? {
                ...previous,
                items: [
                  ...previous.items,
                  emptyItem(Math.max(-1, ...previous.items.map((item) => item.key)) + 1),
                ],
              }
            : previous
        );
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-[#d9c4a4] bg-white px-4 py-2 text-sm font-semibold text-[#927448]"
    >
      <Plus size={16} /> Adicionar produto
    </button>
  </div>

  <div className="mt-5 space-y-4">
    {form.items.map((item, index) => (
      <div
        key={item.key}
        className="rounded-xl border border-[#e8ddcb] bg-white p-4"
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px_135px_44px] sm:items-end">
          <Field label={`Produto ${index + 1}`}>
            <SearchSelect
              items={products}
              value={item.productId}
              onChange={async (productId) => {
                const product = products.find((entry) => entry.id === productId);
                const tier = product?.prices
                  .filter((entry) => item.quantity >= entry.minimumQuantity)
                  .sort((a, b) => b.minimumQuantity - a.minimumQuantity)[0];
                const listedPrice = tier?.unitPrice ?? product?.price;

                updateItem(item.key, {
                    productId,
                    inventoryId: null,
                    unitPrice: listedPrice != null && listedPrice > 0 ? String(listedPrice) : "",
                    color: "",
                    size: "",
                    material: "",
                    brand: "",
                    model: "",
                });

                if (productId && !(listedPrice != null && listedPrice > 0)) {
                  try {
                    const token = localStorage.getItem("access_token");
                    const response = await api.get(`/products/${productId}`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    });
                    const detail = response.data?.product ?? response.data;
                    const detailPrice = detail.salePrice ?? detail.sellingPrice ?? detail.price;
                    const detailTiers = detail.prices ?? [];
                    const matchingTier = Array.isArray(detailTiers)
                      ? detailTiers
                          .filter((tier: { minimumQuantity: number }) => item.quantity >= tier.minimumQuantity)
                          .sort((a: { minimumQuantity: number }, b: { minimumQuantity: number }) => b.minimumQuantity - a.minimumQuantity)[0]
                      : undefined;
                    const resolved = matchingTier?.unitPrice ?? detailPrice;
                    if (validNumber(resolved) && numeric(resolved) > 0) {
                      setForm((previous) => previous ? {
                        ...previous,
                        items: previous.items.map((entry) =>
                          entry.key === item.key && entry.productId === productId
                            ? { ...entry, unitPrice: String(numeric(resolved)) }
                            : entry
                        ),
                      } : previous);
                    }
                  } catch {
                    setError("Não foi possível consultar o preço do produto selecionado.");
                  }
                }
              }}
              placeholder="Nome ou código comercial..."
              renderLabel={(product) =>
                `${product.name}${product.commercialCode ? ` — ${product.commercialCode}` : ""}`
              }
            />
          </Field>

          <Field label="Qtd">
            <div className="flex h-[46px] items-center justify-between rounded-xl border border-[#e8e0d4]">
              <button
                type="button"
                disabled={item.quantity <= 1}
                onClick={() =>
                  updateItem(item.key, {
                    quantity: Math.max(1, item.quantity - 1),
                  })
                }
                className="px-2 text-[#927448] disabled:opacity-30"
              >
                <Minus size={16} />
              </button>

              <input
                type="number"
                min="1"
                step="1"
                value={item.quantity}
                onChange={(event) =>
                  updateItem(item.key, {
                    quantity: Number(event.target.value),
                  })
                }
                className="w-12 text-center text-sm outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  updateItem(item.key, {
                    quantity: item.quantity + 1,
                  })
                }
                className="px-2 text-[#927448]"
              >
                <Plus size={16} />
              </button>
            </div>
          </Field>

          <Field label="Valor">
            <p className="flex h-[46px] items-center font-semibold text-[#342d27]">
              {validNumber(item.unitPrice) && numeric(item.unitPrice) > 0 ? money(itemTotal(item)) : "Preço indisponível"}
            </p>
          </Field>

          <button
            type="button"
            aria-label="Remover produto"
            disabled={form.items.length <= 1}
            onClick={() => {
              setItemsChanged(true);
              update(
                "items",
                form.items.filter((entry) => entry.key !== item.key)
              );
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 disabled:opacity-30"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="mt-4">
          <p className={LABEL}>Deseja aplicar desconto ou acréscimo?</p>

          <div className="flex flex-wrap gap-2">
            {(["", "discount", "addition"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                    updateItem(item.key, {
                    adjustmentType: type,
                    adjustmentAmount: type ? item.adjustmentAmount : "",
                    })
                }
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                item.adjustmentType === type
                    ? type === "discount"
                    ? "bg-red-500 text-white"
                    : type === "addition"
                        ? "bg-blue-600 text-white"
                        : "bg-transparent text-[#51473d]"
                    : "bg-transparent text-[#81766b]"
                }`}
                >
                {type === ""
                    ? "Não"
                    : type === "discount"
                    ? "Desconto"
                    : "Acréscimo"}
                </button>
            ))}
          </div>

          {item.adjustmentType !== "" && (
            <div className="mt-3 max-w-md">
              <Field label="Valor do ajuste (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.adjustmentAmount}
                  onChange={(event) =>
                    updateItem(item.key, {
                      adjustmentAmount: event.target.value,
                    })
                  }
                  className={INPUT}
                />
              </Field>
            </div>
          )}
        </div>

        
        <details className="mt-4 border-t border-[#ece6dc] pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#927448]">
            Características do produto
        </summary>

        {(() => {
            const characteristics = productCharacteristics[item.productId];

            if (!characteristics) {
            return (
                <p className="mt-4 text-sm text-[#81766b]">
                Carregando características...
                </p>
            );
            }

            const availableFields = characteristicFields.filter(
            ({ source }) => characteristics[source].length > 0
            );

            if (availableFields.length === 0) {
            return (
                <p className="mt-4 text-sm text-[#81766b]">
                Nenhuma característica cadastrada nesse produto.
                </p>
            );
            }

            return (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {availableFields.map(({ field, source, label }) => (
                <Field key={field} label={label}>
                    <select
                    className={INPUT}
                    value={item[field]}
                    onChange={(event) =>
                        updateItem(item.key, {
                        [field]: event.target.value,
                        })
                    }
                    >
                    <option value="">Selecione (opcional)</option>

                    {characteristics[source].map((value) => (
                        <option key={value} value={value}>
                        {value}
                        </option>
                    ))}
                    </select>
                </Field>
                ))}
            </div>
            );
        })()}
        </details>

      </div>
    ))}
  </div>

  <div className="mt-4 flex justify-between rounded-xl bg-[#efe2cd] px-5 py-4 font-semibold text-[#342d27]">
    <span>Total da venda</span>
    <span>{money(total)}</span>
  </div>
</div>
        <Field label="Observação"><textarea rows={3} className={INPUT} value={form.observation} onChange={(event) => update("observation", event.target.value)} placeholder="Observações sobre a venda..." /></Field>
      </div>}
    </section>
    <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><Link href="/vendas" className="inline-flex items-center justify-center rounded-xl border border-[#e8e0d4] bg-white px-6 py-3 text-sm font-semibold text-[#51473d]">Cancelar</Link><button type="submit" disabled={saving} className={BUTTON}>{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{saving ? "Salvando..." : "Salvar alterações"}</button></div>
  </form></DashboardLayout>;
}

export default function EditSalePage() {
  return (
    <Suspense fallback={<div>Carregando venda...</div>}>
      <EditSaleContent />
    </Suspense>
  );
}