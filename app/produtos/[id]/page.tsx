"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Package, Pencil, Plus , Eye } from "lucide-react";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";
import { getColor } from "../../../src/utils/colors";
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
  colors: string[];
  sizes: string[];
  brands: string[];
  models: string[];
  materials: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

type InventoryItem = {
  id: string;
  name: string;
  productId: string | null;
  sku: string | null;
  category?: string | null;
  description?: string | null;
  unit?: string | null;
  quantity: number;
  minimumQuantity: number | null;
  createdAt?: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
  brand: string | null;
  model: string | null;
};

type InventoryPage = {
  content: InventoryItem[];
  totalPages: number;
};

function inventoryVariation(item: InventoryItem): string {
  return [item.color, item.size, item.material, item.brand, item.model]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" · ") || "—";
}

type SalePaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";
type ProductSale = {
  id: string;
  customerId: string;
  totalAmount: number;
  paymentStatus: SalePaymentStatus;
  createdAt: string;
  quantity: number;
  deliveryDeadline?: string | null;
  deliveredAt?: string | null;
  remainingAmount?: number;
  downPaymentPercentage?: number;
  paidPercentage?: number;
  remainingPercentage?: number;
  paymentMethod?: string;
  observation?: string | null;
  deadlineStatus?: string;
  items?: Array<{ productId: string; quantity: number; color?: string | null; brand?: string | null; model?: string | null; size?: string | null; material?: string | null }>;
};
type SalePage = {
  sales: Array<{
    id: string;
    customerId: string;
    totalAmount: number;
    paymentStatus: SalePaymentStatus;
    createdAt: string;
    deliveryDeadline?: string | null;
    deliveredAt?: string | null;
    remainingAmount?: number;
    downPaymentPercentage?: number;
    paidPercentage?: number;
    remainingPercentage?: number;
    paymentMethod?: string;
    observation?: string | null;
    deadlineStatus?: string;
    items: Array<{ productId: string; quantity: number; color?: string | null; brand?: string | null; model?: string | null; size?: string | null; material?: string | null }>;
  }>;
  pagination: { totalPages: number };
};
const salePaymentLabels: Record<SalePaymentStatus, string> = {
  UNPAID: "Não paga", PARTIALLY_PAID: "Parcialmente paga", PAID: "Paga",
};
const salePaymentClasses: Record<SalePaymentStatus, string> = {
  UNPAID: "bg-red-50 text-red-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
};

type ExpenseStatus = "PENDING" | "PAID" | "CANCELLED";
type Expense = {
  id: string;
  name: string;
  value: number;
  status: ExpenseStatus;
  category?: string;
  description?: string | null;
  allocationType?: string;
  quantity?: number | null;
  createdAt?: string;
  expenseDate: string;
  products: { productId: string; allocatedValue: number }[];
};
type ExpensePage = {
  content: Expense[];
  totalPages: number;
};
type ProductExpense = {
  id: string;
  name: string;
  status: ExpenseStatus;
  expenseDate: string;
  allocatedValue: number;
  category?: string;
  description?: string | null;
  allocationType?: string;
  quantity?: number | null;
  createdAt?: string;
};
const expenseStatusLabels: Record<ExpenseStatus, string> = {
  PENDING: "Pendente", PAID: "Pago", CANCELLED: "Cancelado",
};
const expenseStatusClasses: Record<ExpenseStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};
const expenseDate = (date: string) => {
  const [year, month, day] = date.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "—";
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
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryName, setInventoryName] = useState("");
  const [inventoryDateFrom, setInventoryDateFrom] = useState("");
  const [inventoryDateTo, setInventoryDateTo] = useState("");
  const [inventorySku, setInventorySku] = useState("");
  const [inventoryVariationFilter, setInventoryVariationFilter] = useState("");
  const [inventoryMinQuantity, setInventoryMinQuantity] = useState("");
  const [inventoryMaxQuantity, setInventoryMaxQuantity] = useState("");
  const [inventoryAdvanced, setInventoryAdvanced] = useState<Record<string, string>>({});
  const setInventoryAdvancedField = (field: string, value: string) =>
    setInventoryAdvanced((previous) => ({ ...previous, [field]: value }));
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [saleCustomerNames, setSaleCustomerNames] = useState<Record<string, string>>({});
  const [saleCustomer, setSaleCustomer] = useState("");
  const [saleCustomerSearch, setSaleCustomerSearch] = useState("");
  const [saleDateFrom, setSaleDateFrom] = useState("");
  const [saleDateTo, setSaleDateTo] = useState("");
  const [saleValueFrom, setSaleValueFrom] = useState("");
  const [saleValueTo, setSaleValueTo] = useState("");
  const [saleStatus, setSaleStatus] = useState("");
  const [saleCustomerOpen, setSaleCustomerOpen] = useState(false);
  const [saleAdvanced, setSaleAdvanced] = useState<Record<string, string>>({});
  const setSaleAdvancedField = (field: string, value: string) => setSaleAdvanced((previous) => ({ ...previous, [field]: value }));
  const saleAdvancedTextFields = [
    ["search", "Busca geral", "Cliente ou observação"],
    ["color", "Cor", "Cor do item"], ["brand", "Marca", "Marca do item"],
    ["model", "Modelo", "Modelo do item"], ["size", "Tamanho", "Tamanho do item"],
    ["material", "Material", "Material do item"], ["observation", "Observação", "Texto da observação"],
  ];
  const saleAdvancedNumberFields = [
    ["minRemainingAmount", "Restante mínimo"], ["maxRemainingAmount", "Restante máximo"],
    ["downPaymentFrom", "Entrada (%) de"], ["downPaymentTo", "Entrada (%) até"],
    ["paidFrom", "Pago (%) de"], ["paidTo", "Pago (%) até"],
    ["remainingFrom", "Restante (%) de"], ["remainingTo", "Restante (%) até"],
  ];
  const [expenses, setExpenses] = useState<ProductExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [expenseName, setExpenseName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [valueFrom, setValueFrom] = useState("");
  const [valueTo, setValueTo] = useState("");
  const [expenseAdvanced, setExpenseAdvanced] = useState<Record<string, string>>({});
  const setExpenseAdvancedField = (field: string, value: string) =>
    setExpenseAdvanced((previous) => ({ ...previous, [field]: value }));


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

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    async function loadExpenses() {
      setExpensesLoading(true);
      setExpensesError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") {
          throw new Error("Sessão não encontrada. Faça login novamente.");
        }
        const headers = { Authorization: `Bearer ${token}` };
        const collected: ProductExpense[] = [];
        let page = 0;
        let totalPages = 1;
        do {
          const { data } = await api.get<ExpensePage>("/expenses", {
            headers,
            params: { page, size: 100 },
            signal: controller.signal,
          });
          for (const expense of data.content ?? []) {
            const allocation = expense.products?.find((item) => item.productId === id);
            if (allocation) {
              collected.push({
                id: expense.id,
                name: expense.name,
                status: expense.status,
                expenseDate: expense.expenseDate,
                allocatedValue: Number(allocation.allocatedValue),
                category: expense.category,
                description: expense.description,
                allocationType: expense.allocationType,
                quantity: expense.quantity,
                createdAt: expense.createdAt,
              });
            }
          }
          totalPages = data.totalPages ?? 1;
          page += 1;
        } while (page < totalPages && !controller.signal.aborted);
        if (!controller.signal.aborted) {
          setExpenses(collected.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)));
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setExpensesError(axios.isAxiosError(cause)
            ? `Não foi possível carregar as despesas${cause.response ? ` (HTTP ${cause.response.status})` : ""}.`
            : cause instanceof Error ? cause.message : "Erro ao carregar despesas.");
        }
      } finally {
        if (!controller.signal.aborted) setExpensesLoading(false);
      }
    }
    void loadExpenses();
    return () => controller.abort();
  }, [id, reloadKey]);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function loadInventory() {
      setInventoryLoading(true);
      setInventoryError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") {
          throw new Error("Sessão não encontrada. Faça login novamente.");
        }

        const collected: InventoryItem[] = [];
        let page = 0;
        let totalPages = 1;
        do {
          const { data } = await api.get<InventoryPage>("/inventory", {
            headers: { Authorization: `Bearer ${token}` },
            params: { page, pageSize: 100, sortBy: "name", sortDirection: "ASC" },
            signal: controller.signal,
          });
          collected.push(...(data.content ?? []).filter((item) => item.productId === id));
          totalPages = data.totalPages ?? 1;
          page += 1;
        } while (page < totalPages && !controller.signal.aborted);

        if (!controller.signal.aborted) setInventoryItems(collected);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setInventoryError(axios.isAxiosError(cause)
            ? `Não foi possível carregar o estoque${cause.response ? ` (HTTP ${cause.response.status})` : ""}.`
            : cause instanceof Error ? cause.message : "Erro ao carregar estoque.");
        }
      } finally {
        if (!controller.signal.aborted) setInventoryLoading(false);
      }
    }

    void loadInventory();
    return () => controller.abort();
  }, [id, reloadKey]);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    async function loadSales() {
      setSalesLoading(true);
      setSalesError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") throw new Error("Sessão não encontrada.");
        const headers = { Authorization: `Bearer ${token}` };
        const collected: ProductSale[] = [];
        let page = 0;
        let totalPages = 1;
        do {
          const { data } = await api.get<SalePage>("/sales", {
            headers,
            params: { page, size: 100, sortBy: "createdAt", sortDirection: "DESC" },
            signal: controller.signal,
          });
          for (const sale of data.sales ?? []) {
            const items = sale.items?.filter((item) => item.productId === id) ?? [];
            if (items.length) collected.push({
              id: sale.id,
              customerId: sale.customerId,
              totalAmount: sale.totalAmount,
              paymentStatus: sale.paymentStatus,
              createdAt: sale.createdAt,
              quantity: items.reduce((sum, item) => sum + item.quantity, 0),
              items,
              deliveryDeadline: sale.deliveryDeadline,
              deliveredAt: sale.deliveredAt,
              remainingAmount: sale.remainingAmount,
              downPaymentPercentage: sale.downPaymentPercentage,
              paidPercentage: sale.paidPercentage,
              remainingPercentage: sale.remainingPercentage,
              paymentMethod: sale.paymentMethod,
              observation: sale.observation,
              deadlineStatus: sale.deadlineStatus,
            });
          }
          totalPages = data.pagination?.totalPages ?? 1;
          page += 1;
        } while (page < totalPages && !controller.signal.aborted);
        if (controller.signal.aborted) return;
        setSales(collected.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        const customerIds = [...new Set(collected.map((sale) => sale.customerId))];
        const responses = await Promise.allSettled(customerIds.map(async (userId) => {
          const { data } = await api.get<{ name: string }>("/users/id", {
            headers, params: { userId }, signal: controller.signal,
          });
          return { userId, name: data.name };
        }));
        if (!controller.signal.aborted) setSaleCustomerNames(Object.fromEntries(
          responses.filter((result): result is PromiseFulfilledResult<{ userId: string; name: string }> => result.status === "fulfilled")
            .map((result) => [result.value.userId, result.value.name]),
        ));
      } catch (cause) {
        if (!controller.signal.aborted) setSalesError(axios.isAxiosError(cause)
          ? `Não foi possível carregar as vendas${cause.response ? ` (HTTP ${cause.response.status})` : ""}.`
          : cause instanceof Error ? cause.message : "Erro ao carregar vendas.");
      } finally {
        if (!controller.signal.aborted) setSalesLoading(false);
      }
    }
    void loadSales();
    return () => controller.abort();
  }, [id, reloadKey]);

  const filteredSales = sales.filter((sale) => {
    if (saleCustomer && sale.customerId !== saleCustomer) return false;
    const date = sale.createdAt.slice(0, 10);
    if (saleDateFrom && date < saleDateFrom) return false;
    if (saleDateTo && date > saleDateTo) return false;
    if (saleValueFrom !== "" && sale.totalAmount < Number(saleValueFrom)) return false;
    if (saleValueTo !== "" && sale.totalAmount > Number(saleValueTo)) return false;
    if (saleStatus && sale.paymentStatus !== saleStatus) return false;
    const advanced = saleAdvanced;
    const contains = (value: string | null | undefined, query: string) => (value ?? "").toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"));
    const search = advanced.search?.trim();
    if (search && ![saleCustomerNames[sale.customerId], sale.observation].some((value) => contains(value, search))) return false;
    if (advanced.observation?.trim() && !contains(sale.observation, advanced.observation)) return false;
    for (const field of ["color", "brand", "model", "size", "material"] as const) {
      if (advanced[field]?.trim() && !sale.items?.some((item) => contains(item[field], advanced[field]))) return false;
    }
    const ranges: Array<[string, string, number | undefined]> = [
      ["minRemainingAmount", "min", sale.remainingAmount], ["maxRemainingAmount", "max", sale.remainingAmount],
      ["downPaymentFrom", "min", sale.downPaymentPercentage], ["downPaymentTo", "max", sale.downPaymentPercentage],
      ["paidFrom", "min", sale.paidPercentage], ["paidTo", "max", sale.paidPercentage],
      ["remainingFrom", "min", sale.remainingPercentage], ["remainingTo", "max", sale.remainingPercentage],
    ];
    if (ranges.some(([key, side, value]) => advanced[key]?.trim() && (value == null || (side === "min" ? value < Number(advanced[key]) : value > Number(advanced[key]))))) return false;
    if (advanced.paymentMethod && sale.paymentMethod !== advanced.paymentMethod) return false;
    if (advanced.deliveryDeadlineFrom && (!sale.deliveryDeadline || sale.deliveryDeadline.slice(0, 10) < advanced.deliveryDeadlineFrom)) return false;
    if (advanced.deliveryDeadlineTo && (!sale.deliveryDeadline || sale.deliveryDeadline.slice(0, 10) > advanced.deliveryDeadlineTo)) return false;
    if (advanced.createdAtFrom && date < advanced.createdAtFrom) return false;
    if (advanced.createdAtTo && date > advanced.createdAtTo) return false;
    if (advanced.delivered === "yes" && !sale.deliveredAt) return false;
    if (advanced.delivered === "no" && sale.deliveredAt) return false;
    if (advanced.deadlineStatus && sale.deadlineStatus !== advanced.deadlineStatus) return false;
    if (advanced.dueWithinDays) {
      if (!sale.deliveryDeadline) return false;
      const days = Math.ceil((new Date(sale.deliveryDeadline.slice(0, 10) + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
      if (days < 0 || days > Number(advanced.dueWithinDays)) return false;
    }

    return true;
  });
  const totalFilteredSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalSoldUnits = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

  const filteredInventory = inventoryItems.filter((item) => {
    if (inventoryName.trim() && !(product?.name ?? item.name).toLocaleLowerCase("pt-BR").includes(inventoryName.trim().toLocaleLowerCase("pt-BR"))) return false;
    const registeredAt = item.createdAt?.slice(0, 10) ?? "";
    if (inventoryDateFrom && (!registeredAt || registeredAt < inventoryDateFrom)) return false;
    if (inventoryDateTo && (!registeredAt || registeredAt > inventoryDateTo)) return false;
    if (inventorySku.trim() && !(item.sku ?? "").toLocaleLowerCase("pt-BR").includes(inventorySku.trim().toLocaleLowerCase("pt-BR"))) return false;
    if (inventoryVariationFilter.trim() && !inventoryVariation(item).toLocaleLowerCase("pt-BR").includes(inventoryVariationFilter.trim().toLocaleLowerCase("pt-BR"))) return false;
    if (inventoryMinQuantity !== "" && item.quantity < Number(inventoryMinQuantity)) return false;
    if (inventoryMaxQuantity !== "" && item.quantity > Number(inventoryMaxQuantity)) return false;
    const advanced = inventoryAdvanced;
    const contains = (value: string | null | undefined, query: string) =>
      (value ?? "").toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"));
    if (advanced.category && item.category !== advanced.category) return false;
    if (advanced.description?.trim() && !contains(item.description, advanced.description)) return false;
    if (advanced.quantity !== undefined && advanced.quantity !== "" && item.quantity !== Number(advanced.quantity)) return false;
    if (advanced.unit && item.unit !== advanced.unit) return false;
    for (const field of ["color", "size", "material", "brand", "model"] as const) {
      if (advanced[field]?.trim() && !contains(item[field], advanced[field])) return false;
    }
    if (advanced.createdAt && registeredAt !== advanced.createdAt) return false;
    return true;
  });

  const filteredExpenses = expenses.filter((expense) => {
    if (expenseName.trim() && !expense.name.toLocaleLowerCase("pt-BR").includes(expenseName.trim().toLocaleLowerCase("pt-BR"))) return false;
    const date = expense.expenseDate.slice(0, 10);
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    if (valueFrom !== "" && expense.allocatedValue < Number(valueFrom)) return false;
    if (valueTo !== "" && expense.allocatedValue > Number(valueTo)) return false;
    const advanced = expenseAdvanced;
    const contains = (value: string | null | undefined, query: string) =>
      (value ?? "").toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"));
    if (advanced.description?.trim() && !contains(expense.description, advanced.description)) return false;
    if (advanced.category && expense.category !== advanced.category) return false;
    if (advanced.status && expense.status !== advanced.status) return false;
    if (advanced.allocationType && expense.allocationType !== advanced.allocationType) return false;
    if (advanced.exactValue !== "" && advanced.exactValue !== undefined && expense.allocatedValue !== Number(advanced.exactValue)) return false;
    if (advanced.quantity !== "" && advanced.quantity !== undefined && expense.quantity !== Number(advanced.quantity)) return false;
    if (advanced.minQuantity !== "" && advanced.minQuantity !== undefined && (expense.quantity == null || expense.quantity < Number(advanced.minQuantity))) return false;
    if (advanced.maxQuantity !== "" && advanced.maxQuantity !== undefined && (expense.quantity == null || expense.quantity > Number(advanced.maxQuantity))) return false;
    if (advanced.exactDate && date !== advanced.exactDate) return false;
    const created = expense.createdAt?.slice(0, 10) ?? "";
    if (advanced.createdFrom && (!created || created < advanced.createdFrom)) return false;
    if (advanced.createdTo && (!created || created > advanced.createdTo)) return false;
    return true;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((total, expense) => total + expense.allocatedValue, 0);

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

        
                {product.description?.trim() && (
                  <dl>
                    <Detail label="Descrição" value={product.description} />
                  </dl>
                )}
            

              {(
              (product.minimumQuantity != null && product.minimumQuantity !== 0) ||
              (product.shelfLifeDays != null && product.shelfLifeDays !== 0) ||
              (product.productionLeadTimeMinDays != null && product.productionLeadTimeMinDays !== 0) ||
              (product.productionLeadTimeMaxDays != null && product.productionLeadTimeMaxDays !== 0)
            ) && (
              <Section title="Informações adicionais">
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {product.minimumQuantity != null && product.minimumQuantity !== 0 && (
                    <Detail label="Quantidade mínima" value={number.format(product.minimumQuantity)} />
                  )}

                  {product.shelfLifeDays != null && product.shelfLifeDays !== 0 && (
                    <Detail label="Validade (dias)" value={display(product.shelfLifeDays)} />
                  )}

                  {product.productionLeadTimeMinDays != null && product.productionLeadTimeMinDays !== 0 && (
                    <Detail label="Prazo mínimo de produção (dias)" value={display(product.productionLeadTimeMinDays)} />
                  )}

                  {product.productionLeadTimeMaxDays != null && product.productionLeadTimeMaxDays !== 0 && (
                    <Detail label="Prazo máximo de produção (dias)" value={display(product.productionLeadTimeMaxDays)} />
                  )}
                </dl>
            </Section>
          )}

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

              {(product.fees?.length ?? 0) > 0 && (
        <Section title={`Taxas adicionais (${product.fees!.length})`}>
          <div className="overflow-x-auto rounded-xl border border-[#eee8df]">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#faf9f7] text-xs text-stone-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Tipo de cobrança</th>
                  <th className="px-4 py-3">Obrigatória</th>
                  <th className="px-4 py-3">Ativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece5]">
                {product.fees!.map((fee) => (
                  <tr key={fee.id}>
                    <td className="px-4 py-4 font-medium">{display(fee.name)}</td>
                    <td className="px-4 py-4 font-semibold">{currency.format(fee.amount)}</td>
                    <td className="px-4 py-4">{chargeTypes[fee.chargeType] ?? fee.chargeType}</td>
                    <td className="px-4 py-4">{yesNo(fee.required)}</td>
                    <td className="px-4 py-4">{yesNo(fee.active)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

        
        {([
  ["Cores", product.colors],
  ["Tamanhos", product.sizes],
  ["Marcas", product.brands],
  ["Modelos", product.models],
  ["Materiais", product.materials],
] as [string, string[] | undefined][])
  .some(([, values]) => values?.some((value) => value.trim())) && (
  <section className="rounded-2xl border border-[#e8d9c4] bg-[#f8f3eb] p-5 sm:p-6">
    <h3 className="mb-5 text-sm font-semibold text-[#342d27]">
      Características
    </h3>

    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {([
        ["Cores", product.colors],
        ["Tamanhos", product.sizes],
        ["Marcas", product.brands],
        ["Modelos", product.models],
        ["Materiais", product.materials],
      ] as [string, string[] | undefined][])
        .filter(([, values]) => values?.some((value) => value.trim()))
        .map(([label, values]) => (
          <div
            key={label}
            className="rounded-xl border border-[#eee8df] bg-white px-4 py-4"
          >
            <dt className="mb-3 text-xs font-semibold text-stone-600">
              {label}
            </dt>

            <dd className="flex flex-wrap gap-2">
              {values
                ?.filter((value) => value.trim())
                .map((value, index) => (
                  <span
                  key={`${value}-${index}`}
                  className="rounded-lg border px-3 py-1.5 text-sm"
                  style={{
                  backgroundColor:
                    label === "Cores"
                      ? getColor(value) ?? "#f8f3eb"
                      : "#f8f3eb",
                  color:
                    label === "Cores" && getColor(value)
                      ? ["branco", "branca"].includes(value.trim().toLowerCase())
                        ? "#000000"
                        : "#FFFFFF"
                      : "#342d27",
                  borderColor: "#e8d9c4",
                }}
                >
                  {value}
                </span>
                ))}
            </dd>
          </div>
        ))}
    </dl>
  </section>
)}

 {!salesLoading && !salesError && sales.length > 0 && (
  <section className="rounded-2xl border border-[#e8d9c4] bg-[#f8f3eb] p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-[#342d27]">Histórico de vendas ({filteredSales.length})</h3>
      <Link href="/vendas/nova" className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#927448]">
        <Plus className="h-4 w-4" /> Nova venda
      </Link>
    </div>
    <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative block text-xs font-semibold text-stone-600 sm:col-span-2 lg:col-span-3">
        Cliente
        <input type="search" autoComplete="off" value={saleCustomerSearch}
          onFocus={() => setSaleCustomerOpen(true)}
          onBlur={() => window.setTimeout(() => setSaleCustomerOpen(false), 150)}
          onChange={(event) => { setSaleCustomerSearch(event.target.value); setSaleCustomer(""); setSaleCustomerOpen(true); }}
          placeholder="Digite para selecionar um cliente cadastrado"
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98a58]" />
        {saleCustomerOpen && (
          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[#e8e0d4] bg-white shadow-lg">
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSaleCustomer(""); setSaleCustomerSearch(""); setSaleCustomerOpen(false); }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-[#f8f3eb]">Todos os clientes</button>
            {Object.entries(saleCustomerNames)
              .filter(([, name]) => name.toLocaleLowerCase("pt-BR").includes(saleCustomerSearch.trim().toLocaleLowerCase("pt-BR")))
              .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
              .map(([customerId, name]) => (
                <button key={customerId} type="button" onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { setSaleCustomer(customerId); setSaleCustomerSearch(name); setSaleCustomerOpen(false); }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-[#f8f3eb]">{name}</button>
              ))}
          </div>
        )}
      </div>
      <label className="block text-xs font-semibold text-stone-600">Data da compra — de
        <input type="date" value={saleDateFrom} onChange={(event) => setSaleDateFrom(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98a58]" />
      </label>
      <label className="block text-xs font-semibold text-stone-600">Data da compra — até
        <input type="date" value={saleDateTo} onChange={(event) => setSaleDateTo(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98a58]" />
      </label>
      <label className="block text-xs font-semibold text-stone-600">Valor da compra — de (R$)
        <input type="number" min="0" step="0.01" value={saleValueFrom} onChange={(event) => setSaleValueFrom(event.target.value)} placeholder="0,00" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98a58]" />
      </label>
      <label className="block text-xs font-semibold text-stone-600">Valor da compra — até (R$)
        <input type="number" min="0" step="0.01" value={saleValueTo} onChange={(event) => setSaleValueTo(event.target.value)} placeholder="0,00" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98a58]" />
      </label>
      <label className="block text-xs font-semibold text-stone-600 lg:col-start-4 lg:row-start-1">Status de pagamento
        <select value={saleStatus} onChange={(event) => setSaleStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98a58]">
          <option value="">Todos</option><option value="UNPAID">Não paga</option><option value="PARTIALLY_PAID">Parcialmente paga</option><option value="PAID">Paga</option>
        </select>
      </label>
    </div>
    <details className="group mb-5">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#927448] hover:bg-[#f0e5d4] [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true">☰</span> Filtros avançados
        {Object.values(saleAdvanced).some((value) => value.trim()) && <span className="rounded-full bg-[#e8d7bb] px-2 py-0.5 text-xs">Ativos</span>}
        <span className="transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 grid gap-4 rounded-xl border border-[#e8d7bb] bg-white/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {saleAdvancedTextFields.map(([field, label, placeholder]) => (
          <label key={field} className="block text-xs font-semibold text-stone-600">{label}
            <input type="search" value={saleAdvanced[field] ?? ""} onChange={(event) => setSaleAdvancedField(field, event.target.value)} placeholder={placeholder}
              className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98a58]" />
          </label>
        ))}
        <label className="block text-xs font-semibold text-stone-600">Forma de pagamento
          <select value={saleAdvanced.paymentMethod ?? ""} onChange={(event) => setSaleAdvancedField("paymentMethod", event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm">
            <option value="">Todas</option>
            {[...new Set(sales.map((sale) => sale.paymentMethod).filter((method): method is string => Boolean(method)))].map((method) => (
            <option key={method} value={method}>
              {({
                DEBIT_CARD: "Cartão de débito",
                CREDIT_CARD: "Cartão de crédito",
                PIX: "Pix",
                CASH: "Dinheiro",
                BANK_TRANSFER: "Transferência bancária",
                BOLETO: "Boleto",
              } as Record<string, string>)[method] ?? method}
            </option>
          ))}
          </select>
        </label>
        {saleAdvancedNumberFields.map(([field, label]) => (
          <label key={field} className="block text-xs font-semibold text-stone-600">{label}
            <input type="number" min="0" step={field.includes("Amount") ? "0.01" : "1"} max={field.includes("Amount") ? undefined : 100}
              value={saleAdvanced[field] ?? ""} onChange={(event) => setSaleAdvancedField(field, event.target.value)} placeholder="0"
              className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
          </label>
        ))}
        {([ ["deliveryDeadlineFrom", "Entrega de"], ["deliveryDeadlineTo", "Entrega até"], ["createdAtFrom", "Cadastro de"], ["createdAtTo", "Cadastro até"] ] as const).map(([field, label]) => (
          <label key={field} className="block text-xs font-semibold text-stone-600">{label}
            <input type="date" value={saleAdvanced[field] ?? ""} onChange={(event) => setSaleAdvancedField(field, event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
          </label>
        ))}
        <label className="block text-xs font-semibold text-stone-600">Vence em até (dias)
          <input type="number" min="0" value={saleAdvanced.dueWithinDays ?? ""} onChange={(event) => setSaleAdvancedField("dueWithinDays", event.target.value)} placeholder="Ex.: 15" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
        </label>
        <label className="block text-xs font-semibold text-stone-600">Prazo
          <select value={saleAdvanced.deadlineStatus ?? ""} onChange={(event) => setSaleAdvancedField("deadlineStatus", event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm">
            <option value="">Todos</option><option value="OVERDUE">Atrasadas</option><option value="DUE_TODAY">Vencem hoje</option><option value="NO_DEADLINE">Sem prazo</option><option value="ON_TIME">No prazo</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-stone-600">Entrega
          <select value={saleAdvanced.delivered ?? ""} onChange={(event) => setSaleAdvancedField("delivered", event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm">
            <option value="">Todas</option><option value="yes">Entregues</option><option value="no">Não entregues</option>
          </select>
        </label>
      </div>
    </details>
    <div className="overflow-x-auto rounded-xl border border-[#eee8df] bg-white">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="bg-[#faf9f7] text-xs text-stone-500"><tr>
          <th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Qtd</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Data</th><th className="px-4 py-3 text-right">Visualizar / Editar</th>
        </tr></thead>
        <tbody className="divide-y divide-[#f0ece5]">
          {filteredSales.map((sale) => <tr key={sale.id} className="odd:bg-white even:bg-[#e9e3da] transition-colors hover:!bg-[#ded3c4]">
            <td className="px-4 py-4 font-medium">{saleCustomerNames[sale.customerId] ?? "Cliente indisponível"}</td>
            <td className="px-4 py-4">{number.format(sale.quantity)}</td>
            <td className="px-4 py-4 font-semibold">{currency.format(sale.totalAmount)}</td>
            <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${salePaymentClasses[sale.paymentStatus]}`}>{salePaymentLabels[sale.paymentStatus]}</span></td>
            <td className="px-4 py-4">{expenseDate(sale.createdAt)}</td>
            <td className="px-4 py-4"><div className="flex items-center justify-end gap-2">
              <Link href={`/vendas/${encodeURIComponent(sale.id)}`} title="Visualizar venda" aria-label="Visualizar venda" className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"><Eye size={17} /></Link>
              <Link href={`/vendas/${encodeURIComponent(sale.id)}/atualizar`} title="Atualizar venda" aria-label="Atualizar venda" className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"><Pencil size={17} /></Link>
            </div></td>
          </tr>)}
          {filteredSales.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-500">Nenhuma venda encontrada.</td></tr>}
        </tbody>
      </table>
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6d7c2] bg-[#efe4d4] px-5 py-4">
      <span className="text-sm font-semibold text-[#51473d]">{number.format(totalSoldUnits)} unidade(s) · Total das vendas que incluem este produto</span>
      <span className="text-xl font-bold text-[#342d27]">{currency.format(totalFilteredSales)}</span>
    </div>
  </section>
 )}

{!expensesLoading && !expensesError && expenses.length > 0 && (

<div className="rounded-2xl border border-[#e8d9c4] bg-[#f8f3eb] p-5 sm:p-6">
  <section>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-[#342d27]">
        Histórico de despesas ({filteredExpenses.length})
      </h3>

      <Link
        href="/despesas/nova"
        className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#927448]"
      >
        <Plus className="h-4 w-4" />
        Nova despesa
      </Link>
    </div>

    <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block text-xs font-semibold text-stone-600 sm:col-span-2 lg:col-span-4">
        Nome
        <input
          type="text"
          value={expenseName}
          onChange={(event) => setExpenseName(event.target.value)}
          placeholder="Buscar pelo nome da despesa"
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>

      <label className="block text-xs font-semibold text-stone-600">
        Data da despesa — de
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>

      <label className="block text-xs font-semibold text-stone-600">
        Data da despesa — até
        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>

      <label className="block text-xs font-semibold text-stone-600">
        Valor alocado mínimo (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={valueFrom}
          onChange={(event) => setValueFrom(event.target.value)}
          placeholder="0,00"
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>

      <label className="block text-xs font-semibold text-stone-600">
        Valor alocado máximo (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={valueTo}
          onChange={(event) => setValueTo(event.target.value)}
          placeholder="0,00"
          className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]"
        />
      </label>
    </div>

    <details className="group mb-5">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#927448] hover:bg-[#f0e5d4] [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true">☰</span> Filtros avançados
        {Object.values(expenseAdvanced).some((value) => value.trim()) && <span className="rounded-full bg-[#e8d7bb] px-2 py-0.5 text-xs">Ativos</span>}
        <span className="transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 grid gap-4 rounded-xl border border-[#e8d7bb] bg-white/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs font-semibold text-stone-600">Categoria
          <select value={expenseAdvanced.category ?? ""} onChange={(event) => setExpenseAdvancedField("category", event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm">
            <option value="">Todas as categorias</option>
            {[...new Set(expenses.map((expense) => expense.category).filter((category): category is string => Boolean(category)))].sort((a, b) => a.localeCompare(b, "pt-BR")).map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-stone-600">Descrição
          <input type="search" value={expenseAdvanced.description ?? ""} onChange={(event) => setExpenseAdvancedField("description", event.target.value)} placeholder="Buscar pela descrição" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
        </label>
        <label className="block text-xs font-semibold text-stone-600">Status
          <select value={expenseAdvanced.status ?? ""} onChange={(event) => setExpenseAdvancedField("status", event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm">
            <option value="">Todos os status</option><option value="PENDING">Pendente</option><option value="PAID">Pago</option><option value="CANCELLED">Cancelado</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-stone-600">Tipo de alocação
          <select value={expenseAdvanced.allocationType ?? ""} onChange={(event) => setExpenseAdvancedField("allocationType", event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm">
            <option value="">Todas as alocações</option><option value="GENERAL">Geral</option><option value="SPECIFIC_PRODUCT">Produto específico</option><option value="CATEGORY_PRODUCTS">Diversos produtos por categoria</option>
          </select>
        </label>
        {([ ["exactValue", "Valor alocado exato (R$)", "0.01"], ["quantity", "Quantidade exata", "1"], ["minQuantity", "Quantidade mínima", "1"], ["maxQuantity", "Quantidade máxima", "1"] ] as const).map(([field, label, step]) => (
          <label key={field} className="block text-xs font-semibold text-stone-600">{label}
            <input type="number" min="0" step={step} value={expenseAdvanced[field] ?? ""} onChange={(event) => setExpenseAdvancedField(field, event.target.value)} placeholder="0" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
          </label>
        ))}
        {([ ["exactDate", "Data exata da despesa"], ["createdFrom", "Cadastro a partir de"], ["createdTo", "Cadastro até"] ] as const).map(([field, label]) => (
          <label key={field} className="block text-xs font-semibold text-stone-600">{label}
            <input type="date" value={expenseAdvanced[field] ?? ""} onChange={(event) => setExpenseAdvancedField(field, event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
          </label>
        ))}
      </div>
    </details>

    {expensesLoading ? (
      <p className="rounded-xl border border-[#eee8df] p-5 text-sm text-stone-500">
        Carregando despesas...
      </p>
    ) : expensesError ? (
      <div className="rounded-xl border border-red-100 p-5 text-sm text-red-700">
        {expensesError}
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="ml-3 font-semibold underline"
        >
          Tentar novamente
        </button>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-[#eee8df]">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-[#faf9f7] text-xs text-stone-500">
            <tr>
              <th className="px-4 py-3">Despesa</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data da despesa</th>
              <th className="px-4 py-3 text-right">
                Visualizar / Editar
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f0ece5]">
            {filteredExpenses.map((expense) => (
              <tr
                key={expense.id}
                className="odd:bg-white even:bg-[#e9e3da] hover:!bg-[#ded3c4] transition-colors"
              >
                <td className="px-4 py-4 font-medium">
                  <Link
                    href={`/despesas/${encodeURIComponent(expense.id)}`}
                    className="text-[#342d27] hover:text-[#a98a58] hover:underline"
                  >
                    {expense.name}
                  </Link>
                </td>

                <td className="px-4 py-4 font-semibold text-[#342d27]">
                  {currency.format(expense.allocatedValue)}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      expenseStatusClasses[expense.status] ??
                      "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {expenseStatusLabels[expense.status] ?? expense.status}
                  </span>
                </td>

                <td className="px-4 py-4 text-[#51473d]">
                  {expenseDate(expense.expenseDate)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/despesas/${encodeURIComponent(expense.id)}`}
                      title="Visualizar despesa"
                      aria-label="Visualizar despesa"
                      className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"
                    >
                      <Eye size={17} />
                    </Link>

                    <Link
                      href={`/despesas/${encodeURIComponent(expense.id)}/editar`}
                      title="Editar despesa"
                      aria-label="Editar despesa"
                      className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"
                    >
                      <Pencil size={17} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-stone-500"
                >
                  Nenhuma despesa encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    {!expensesLoading && !expensesError && (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6d7c2] bg-[#efe4d4] px-5 py-4">
        <span className="text-sm font-semibold text-[#51473d]">
          Total das despesas
        </span>

        <span className="text-xl font-bold text-[#342d27]">
          {currency.format(totalFilteredExpenses)}
        </span>
      </div>
    )}
  </section>
</div>

)}

     {!inventoryLoading && !inventoryError && inventoryItems.length > 0 && (

      <section className="rounded-2xl border border-[#e8d9c4] bg-[#f8f3eb] p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#342d27]">Estoque ({inventoryItems.length})</h3>
            <Link href="/estoque/novo" className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#927448]">
              <Plus className="h-4 w-4" /> Novo item
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
            <label className="block text-xs font-semibold text-stone-600">
              Nome
              <input type="search" value={inventoryName} onChange={(event) => setInventoryName(event.target.value)} placeholder="Buscar pelo nome" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]" />
            </label>
            <label className="block text-xs font-semibold text-stone-600">
              Data de cadastro — de
              <input type="date" value={inventoryDateFrom} onChange={(event) => setInventoryDateFrom(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]" />
            </label>
            <label className="block text-xs font-semibold text-stone-600">
              Data de cadastro — até
              <input type="date" value={inventoryDateTo} onChange={(event) => setInventoryDateTo(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]" />
            </label>
          </div>

          <details className="group mt-4">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#927448] transition hover:bg-[#f0e5d4] [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true">☰</span> Filtros avançados
              {(inventorySku || inventoryVariationFilter || inventoryMinQuantity || inventoryMaxQuantity || Object.values(inventoryAdvanced).some(Boolean)) && <span className="rounded-full bg-[#e8d7bb] px-2 py-0.5 text-xs">Ativos</span>}
              <span className="transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="mt-3 grid gap-4 rounded-xl border border-[#e8d7bb] bg-white/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-xs font-semibold text-stone-600">SKU
                <input type="search" value={inventorySku} onChange={(event) => setInventorySku(event.target.value)} placeholder="Buscar SKU" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]" />
              </label>
              <label className="block text-xs font-semibold text-stone-600">Variação
                <input type="search" value={inventoryVariationFilter} onChange={(event) => setInventoryVariationFilter(event.target.value)} placeholder="Cor, tamanho, material..." className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]" />
              </label>
              <label className="block text-xs font-semibold text-stone-600">Qtd mínima disponível
                <input type="number" min="0" step="1" value={inventoryMinQuantity} onChange={(event) => setInventoryMinQuantity(event.target.value)} placeholder="0" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]" />
              </label>
              <label className="block text-xs font-semibold text-stone-600">Qtd máxima disponível
                <input type="number" min="0" step="1" value={inventoryMaxQuantity} onChange={(event) => setInventoryMaxQuantity(event.target.value)} placeholder="0" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#342d27] outline-none focus:border-[#a98a58]" />
              </label>
              <label className="block text-xs font-semibold text-stone-600">Categoria
                <select value={inventoryAdvanced.category ?? ""} onChange={(event) => setInventoryAdvancedField("category", event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm">
                  <option value="">Todas as categorias</option>
                  {[...new Set(inventoryItems.map((item) => item.category).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "pt-BR")).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-stone-600">Descrição
                <input type="search" value={inventoryAdvanced.description ?? ""} onChange={(event) => setInventoryAdvancedField("description", event.target.value)} placeholder="Buscar na descrição" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
              </label>
              <label className="block text-xs font-semibold text-stone-600">Quantidade exata
                <input type="number" min="0" step="1" value={inventoryAdvanced.quantity ?? ""} onChange={(event) => setInventoryAdvancedField("quantity", event.target.value)} placeholder="Ex.: 50" className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
              </label>
              <label className="block text-xs font-semibold text-stone-600">Unidade de medida
                <select value={inventoryAdvanced.unit ?? ""} onChange={(event) => setInventoryAdvancedField("unit", event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm">
                  <option value="">Todas as unidades</option>
                  {([ ["UN", "Unidade (un)"], ["PAR", "Par"], ["KIT", "Kit"], ["CX", "Caixa"], ["PCT", "Pacote"], ["DZ", "Dúzia"], ["M", "Metro (m)"], ["CM", "Centímetro (cm)"], ["M2", "Metro quadrado (m²)"], ["KG", "Quilograma (kg)"], ["G", "Grama (g)"], ["L", "Litro (L)"], ["ML", "Mililitro (mL)"], ["ROLO", "Rolo"], ["FOLHA", "Folha"] ] as const).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              {([ ["color", "Cor", "Ex.: Branco"], ["size", "Tamanho", "Ex.: M"], ["material", "Material", "Ex.: Algodão"], ["brand", "Marca", "Buscar marca"], ["model", "Modelo", "Buscar modelo"] ] as const).map(([field, label, placeholder]) => (
                <label key={field} className="block text-xs font-semibold text-stone-600">{label}
                  <input type="search" value={inventoryAdvanced[field] ?? ""} onChange={(event) => setInventoryAdvancedField(field, event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
                </label>
              ))}
              <label className="block text-xs font-semibold text-stone-600">Data exata de cadastro
                <input type="date" value={inventoryAdvanced.createdAt ?? ""} onChange={(event) => setInventoryAdvancedField("createdAt", event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm" />
              </label>
            </div>
          </details>

          {inventoryLoading ? (
            <p className="mt-5 rounded-xl border border-[#eee8df] bg-white p-5 text-sm text-stone-500">Carregando estoque...</p>
          ) : inventoryError ? (
            <div className="mt-5 rounded-xl border border-red-100 bg-white p-5 text-sm text-red-700">
              {inventoryError}
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="ml-3 font-semibold underline">Tentar novamente</button>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border border-[#eee8df] bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#faf9f7] text-xs text-stone-500">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Variação</th>
                    <th className="px-4 py-3">Qtd disponível</th>
                    <th className="px-4 py-3">Qtd mínima</th>
                    <th className="px-4 py-3 text-right">Visualizar / Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece5]">
                  {filteredInventory.map((item) => {
                    const variation = inventoryVariation(item);
                    return (
                      <tr key={item.id} className="odd:bg-white even:bg-[#e9e3da] transition-colors hover:!bg-[#ded3c4]">
                        <td className="px-4 py-4 font-medium text-[#342d27]">
                          <Link
                            href={`/estoque/$${encodeURIComponent(item.id)}`}
                            className="hover:text-[#a98a58] hover:underline"
                          >
                            {product.name}
                          </Link>
                        </td>
                              <td className="px-4 py-4 text-[#51473d]">{display(item.sku)}</td>
                        <td className="max-w-[260px] px-4 py-4 text-[#51473d]" title={variation}>
                          <span className="block max-w-[260px] truncate">{variation}</span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#342d27]">{number.format(item.quantity)}</td>
                        <td className="px-4 py-4 text-[#51473d]">{item.minimumQuantity == null ? "—" : number.format(item.minimumQuantity)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/estoque/${encodeURIComponent(item.id)}`} title="Visualizar item" aria-label={`Visualizar ${product.name}`} className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"><Eye size={17} /></Link>
                            <Link href={`/estoque/${encodeURIComponent(item.id)}/editar`} title="Editar item" aria-label={`Editar ${product.name}`} className="rounded-lg border border-[#eee8df] p-2 text-[#927448] hover:bg-[#f7f0e6]"><Pencil size={17} /></Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInventory.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-500">Nenhum item de estoque encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>   
        )}
        </div> : null}

        
    </div>
  </DashboardLayout>;
}

export default function ProductDetailsPage() {
  return <Suspense fallback={null}><ProductDetailsContent /></Suspense>;
}
