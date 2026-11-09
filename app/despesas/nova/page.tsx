
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { api } from "../../../src/lib/api";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";
import Loading from "@/src/components/layout/Loading";

type ExpenseCategory = string;

type RegisteredCategory = {
  id: string;
  name: string;
  type: string;
};

const STOCK_CATEGORY_NAME = "item de estoque";

type ExpenseAllocationType =
  | "GENERAL"
  | "SPECIFIC_PRODUCT"
  | "CATEGORY_PRODUCTS";

type ExpenseStatus = "PENDING" | "PARTIALLY_PAID" | "PAID";

type Product = {
  id: string;
  name: string;
  category?: string;
};

type InventoryItem = {
  id: string;
  name: string;
  sku?: string | null;
};

type ProductAllocation = {
  productId: string;
  allocatedValue: string;
};

type ExpenseForm = {
  name: string;
  description: string;
  value: string;
  paidAmount: string;
  category: ExpenseCategory;
  categoryId: string;
  allocationType: ExpenseAllocationType;
  status: ExpenseStatus;
  quantity: string;
  inventoryId: string;
  expenseDate: string;
  isToday: boolean;
  products: ProductAllocation[];
};

const PRODUCT_CATEGORY_OPTIONS = [
  { value: "GOURMET", label: "Gourmet" },
  { value: "AGUAS", label: "Águas" },
  { value: "GARRAFAS", label: "Garrafas" },
  { value: "GLOSS", label: "Gloss" },
  { value: "BOLSAS", label: "Bolsas" },
  { value: "NECESSAIRES", label: "Necessaires" },
  { value: "LENCOS", label: "Lenços" },
  { value: "PAPELARIA", label: "Papelaria" },
  { value: "CAIXAS", label: "Caixas" },
  { value: "KITS", label: "Kits" },
];

const STATUS_OPTIONS: {
  value: ExpenseStatus;
  label: string;
}[] = [
  { value: "PAID", label: "100% Paga" },
  { value: "PARTIALLY_PAID", label: "Parcialmente paga" },
  { value: "PENDING", label: "Pendente (0% paga)" },
];

const ALLOCATION_OPTIONS: {
  value: ExpenseAllocationType;
  label: string;
  description: string;
}[] = [
  {
    value: "GENERAL",
    label: "Despesa geral",
    description: "Sem vinculação com nenhum produto. Ex: Transporte",
  },
  {
    value: "SPECIFIC_PRODUCT",
    label: "Produto específico",
    description: "Vinculada a um único produto.",
  },
  {
    value: "CATEGORY_PRODUCTS",
    label: "Diversos produtos por categoria",
    description: "Distribuída entre produtos da mesma categoria.",
  },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#342d27] outline-none transition placeholder:text-[#aaa197] focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";

const LABEL_CLASS =
  "mb-2 block text-sm font-semibold text-[#51473d]";

const SECTION_CLASS =
  "rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6";

function getToday(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseMoney(value: string): number {
  return Number(value.replace(",", "."));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

function InventorySearchSelect({
  items,
  value,
  onChange,
}: {
  items: InventoryItem[];
  value: string;
  onChange: (inventoryId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.id === value);
  const query = search.toLocaleLowerCase("pt-BR");
  const filtered = items.filter((item) =>
    item.name.toLocaleLowerCase("pt-BR").includes(query) ||
    (item.sku ?? "").toLocaleLowerCase("pt-BR").includes(query),
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? search : selected?.name ?? ""}
        placeholder="Digite o nome ou SKU do item..."
        onFocus={() => { setSearch(""); setOpen(true); }}
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onBlur={() => setOpen(false)}
        className={INPUT_CLASS}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#e8e0d4] bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#81766b]">Nenhum item encontrado.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(item.id);
                  setSearch("");
                  setOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm text-[#342d27] transition hover:bg-[#f4ede2]"
              >
                {item.name}{item.sku ? ` — ${item.sku}` : ""}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ProductSearchSelect({
  products,
  value,
  onChange,
}: {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selectedProduct = products.find((product) => product.id === value);
  const filteredProducts = products.filter((product) =>
    product.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? search : selectedProduct?.name ?? ""}
        placeholder="Digite para buscar um produto..."
        onFocus={() => {
          setSearch("");
          setOpen(true);
        }}
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onBlur={() => setOpen(false)}
        className={INPUT_CLASS}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#e8e0d4] bg-white shadow-lg">
          {filteredProducts.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#81766b]">
              Nenhum produto encontrado.
            </p>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(product.id);
                  setSearch("");
                  setOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm text-[#342d27] transition hover:bg-[#f4ede2]"
              >
                {product.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function NewExpensePage() {
  const router = useRouter();

  const [form, setForm] = useState<ExpenseForm>({
    name: "",
    description: "",
    value: "",
    paidAmount: "",
    category: "",
    categoryId: "",
    allocationType: "GENERAL",
    status: "PAID",
    quantity: "",
    inventoryId: "",
    expenseDate: "",
    isToday: true,
    products: [],
  });

  const [expenseCategories, setExpenseCategories] = useState<RegisteredCategory[]>([]);
  const [selectedProductCategory, setSelectedProductCategory] = useState("");
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateForm = <K extends keyof ExpenseForm>(
    field: K,
    value: ExpenseForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadExpenseCategories() {
      try {
        const token = localStorage.getItem("access_token");
        const response = await api.get("/categories", {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (controller.signal.aborted) return;
        const data = response.data?.content ?? response.data;
        setExpenseCategories(
          (Array.isArray(data) ? data : []).filter(
            (category: RegisteredCategory) => category.type === "EXPENSE",
          ),
        );
      } catch (exception) {
        if (controller.signal.aborted || axios.isCancel(exception)) return;
        toast.error("Não foi possível carregar as categorias de despesas.");
      }
    }

    void loadExpenseCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (form.allocationType === "GENERAL") return;

    const controller = new AbortController();

    async function loadProducts() {
      setLoadingProducts(true);

      try {
        const token = localStorage.getItem("access_token");

        const response = await api.get("/products", {
          params: {
            page: 0,
            pageSize: 100,
            sortBy: "name",
            sortDirection: "ASC",
          },
          signal: controller.signal,
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
        });

        if (controller.signal.aborted) return;

        const products = response.data?.content ?? [];

        setAvailableProducts(
          products.map((product: Product) => ({
            id: product.id,
            name: product.name,
            category: product.category,
          })),
        );
      } catch (exception) {
        if (controller.signal.aborted || axios.isCancel(exception)) return;

        toast.error("Não foi possível carregar os produtos.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => controller.abort();
  }, [form.allocationType]);

  useEffect(() => {
    if (form.category !== STOCK_CATEGORY_NAME) return;

    const controller = new AbortController();
    async function loadInventory() {
      setLoadingInventory(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await api.get("/inventory", {
          params: {
            page: 0,
            pageSize: 100,
            sortBy: "name",
            sortDirection: "ASC",
          },
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (controller.signal.aborted) return;
        const items = response.data?.content ?? response.data;
        setInventoryItems(Array.isArray(items) ? items : []);
      } catch (exception) {
        if (controller.signal.aborted || axios.isCancel(exception)) return;
        toast.error("Não foi possível carregar os itens do estoque.");
      } finally {
        if (!controller.signal.aborted) setLoadingInventory(false);
      }
    }
    void loadInventory();
    return () => controller.abort();
  }, [form.category]);

  const addProduct = () => {
    setForm((previous) => ({
      ...previous,
      products: [
        ...previous.products,
        {
          productId: "",
          allocatedValue: "",
        },
      ],
    }));
  };

  const removeProduct = (index: number) => {
    setForm((previous) => ({
      ...previous,
      products: previous.products.filter((_, i) => i !== index),
    }));
  };

  const updateProduct = (
    index: number,
    field: keyof ProductAllocation,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      products: previous.products.map((product, i) =>
        i === index
          ? {
              ...product,
              [field]: value,
            }
          : product,
      ),
    }));
  };

  const handleAllocationChange = (
    allocationType: ExpenseAllocationType,
  ) => {
    setSelectedProductCategory("");
    setForm((previous) => ({
      ...previous,
      allocationType,
      products:
        allocationType === "GENERAL"
          ? []
          : allocationType === "SPECIFIC_PRODUCT"
            ? [
                {
                  productId: "",
                  allocatedValue: previous.value,
                },
              ]
            : [
                {
                  productId: "",
                  allocatedValue: "",
                },
                {
                  productId: "",
                  allocatedValue: "",
                },
              ],
    }));
  };

  const allocatedTotal = form.products.reduce(
    (total, product) =>
      total + (parseMoney(product.allocatedValue) || 0),
    0,
  );

  const expenseValue = form.allocationType === "CATEGORY_PRODUCTS"
    ? Math.round(allocatedTotal * 100) / 100
    : parseMoney(form.value) || 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.categoryId || !expenseCategories.some((category) => category.id === form.categoryId)) {
      toast.error("Selecione uma categoria de despesa válida.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Despesa");
      return;
    }

    if (!Number.isFinite(expenseValue) || expenseValue <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }

    const paidAmount =
      form.status === "PAID"
        ? expenseValue
        : form.status === "PENDING"
          ? 0
          : parseMoney(form.paidAmount);

    if (
      !Number.isFinite(paidAmount) ||
      (form.status === "PARTIALLY_PAID" &&
        (paidAmount <= 0 || paidAmount >= expenseValue))
    ) {
      toast.error("O valor pago inicialmente deve ser maior que zero e menor que o valor total da despesa.");
      return;
    }

    const expenseDate = form.isToday
      ? getToday()
      : form.expenseDate;

    if (!expenseDate) {
      toast.error("Informe a data da despesa.");
      return;
    }

    if (form.category === STOCK_CATEGORY_NAME && !form.inventoryId) {
      toast.error("Selecione um item do estoque.");
      return;
    }

    if (
      form.category === STOCK_CATEGORY_NAME &&
      (!Number.isInteger(Number(form.quantity)) ||
        Number(form.quantity) <= 0)
    ) {
      toast.error("Informe uma quantidade válida para o estoque.");
      return;
    }

    if (
      form.allocationType === "SPECIFIC_PRODUCT" &&
      form.products.length !== 1
    ) {
      toast.error("Selecione exatamente um produto.");
      return;
    }

    if (
      form.allocationType === "CATEGORY_PRODUCTS" &&
      form.products.length < 2
    ) {
      toast.error("Selecione pelo menos dois produtos.");
      return;
    }

    if (form.allocationType !== "GENERAL") {
      if (
        form.products.some(
          (product) =>
            !product.productId ||
            !Number.isFinite(parseMoney(product.allocatedValue)) ||
            parseMoney(product.allocatedValue) <= 0,
        )
      ) {
        toast.error("Preencha os produtos e seus valores de alocação.");
        return;
      }

      const ids = form.products.map(
        (product) => product.productId,
      );

      if (new Set(ids).size !== ids.length) {
        toast.error(
          "Não é permitido selecionar o mesmo produto duas vezes.",
        );
        return;
      }

      if (Math.abs(allocatedTotal - expenseValue) > 0.001) {
        toast.error(
          "A soma dos valores alocados deve ser igual ao valor da despesa.",
        );
        return;
      }

      if (form.allocationType === "CATEGORY_PRODUCTS") {
        if (!selectedProductCategory) {
          toast.error("Selecione a categoria dos produtos.");
          return;
        }
        const selectedProducts = form.products.map((allocation) =>
          availableProducts.find(
            (product) => product.id === allocation.productId,
          ),
        );

        if (selectedProducts.some((product) => !product || product.category !== selectedProductCategory)) {
          toast.error("Selecione somente produtos da categoria escolhida.");
          return;
        }

        const categories = selectedProducts.map(
          (product) => product?.category,
        );

        if (
          categories.every((category) => category !== undefined) &&
          new Set(categories).size > 1
        ) {
          toast.error(
            "Os produtos selecionados devem pertencer à mesma categoria.",
          );
          return;
        }
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      value: expenseValue,
      paidAmount,
      category: form.category,
      categoryId: form.categoryId,
      inventoryId: form.category === STOCK_CATEGORY_NAME ? form.inventoryId : null,
      allocationType: form.allocationType,
      status: form.status,
      quantity:
        form.category === STOCK_CATEGORY_NAME
          ? Number(form.quantity)
          : null,
      expenseDate,
      products:
        form.allocationType === "GENERAL"
          ? []
          : form.products.map((product) => ({
              productId: product.productId,
              allocatedValue: parseMoney(product.allocatedValue),
            })),
    };

    setSaving(true);

    try {
      const token = localStorage.getItem("access_token");

      await api.post("/expenses", payload, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      });

      toast.success("Despesa cadastrada com sucesso!");
      router.push("/despesas");
    } catch (exception) {
      if (axios.isAxiosError(exception)) {
        const message = exception.response?.data?.message;

        toast.error(
          typeof message === "string"
            ? message
            : "Não foi possível cadastrar a despesa.",
        );
      } else {
        toast.error(
          "Ocorreu um erro inesperado ao cadastrar a despesa.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-5xl space-y-6 pb-10"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/despesas"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#927448] transition hover:text-[#725934]"
            >
              <ArrowLeft size={16} />
              Voltar para despesas
            </Link>

            <h1 className="mt-3 font-serif text-3xl text-[#342d27] sm:text-4xl">
              Cadastrar despesa
            </h1>

            <p className="mt-2 text-sm text-[#81766b]">
              Despesa ou entrada de estoque
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}

            {saving ? "Salvando..." : "Registrar"}
          </button>
        </div>

        <section className={SECTION_CLASS}>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Despesa" required>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  placeholder="Ex.: Compra de tecidos"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            <Field label="Categoria" required>
              <select
                value={form.categoryId}
                onChange={(event) => {
                  const categoryId = event.target.value;
                  const category = expenseCategories.find((item) => item.id === categoryId)?.name ?? "";

                  setForm((previous) => ({
                    ...previous,
                    categoryId,
                    category,
                    inventoryId: category === STOCK_CATEGORY_NAME ? previous.inventoryId : "",
                    quantity: category === STOCK_CATEGORY_NAME ? previous.quantity : "",
                  }));
                }}
                className={INPUT_CLASS}
              >
                <option value="">Selecione uma categoria</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status" required>
              <select
                value={form.status}
                onChange={(event) =>
                  updateForm(
                    "status",
                    event.target.value as ExpenseStatus,
                  )
                }
                className={INPUT_CLASS}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            {form.category === STOCK_CATEGORY_NAME && (
              <div className="sm:col-span-2">
                <Field label="Item do estoque" required>
                  <InventorySearchSelect
                    items={inventoryItems}
                    value={form.inventoryId}
                    onChange={(inventoryId) => updateForm("inventoryId", inventoryId)}
                  />
                  {loadingInventory && (
                    <Loading />
                  )}
                </Field>
              </div>
            )}

            {form.category === STOCK_CATEGORY_NAME && (
              <Field label="Quantidade em estoque" required>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={form.quantity}
                  onChange={(event) =>
                    updateForm("quantity", event.target.value)
                  }
                  placeholder="Ex.: 50"
                  className={INPUT_CLASS}
                />
              </Field>
            )}

            <div className="sm:col-span-2">
              <Field label="Descrição">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Informações adicionais sobre a despesa..."
                  className={`${INPUT_CLASS} resize-y`}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <div className="flex items-center gap-2">
            <CalendarDays
              size={20}
              className="text-[#a98a58]"
            />

            <h2 className="text-lg font-semibold text-[#342d27]">
              Data
            </h2>
          </div>

          <div className="mt-6 rounded-xl border border-[#eee5d8] bg-[#fdfbf8] p-5">
            <p className="text-sm font-semibold text-[#342d27]">
              A despesa foi de hoje?
            </p>

            <div className="mt-4 flex flex-wrap gap-4">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-5 py-3 transition ${
                  form.isToday
                    ? "border-[#a98a58] bg-[#f4ede2]"
                    : "border-[#e8e0d4] bg-white hover:bg-[#f8f5f0]"
                }`}
              >
                <input
                  type="radio"
                  name="isToday"
                  checked={form.isToday}
                  onChange={() =>
                    updateForm("isToday", true)
                  }
                  className="accent-[#a98a58]"
                />

                <span className="text-sm font-semibold text-[#342d27]">
                  Sim
                </span>

                {form.isToday && (
                  <Check
                    size={16}
                    className="text-[#a98a58]"
                  />
                )}
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-5 py-3 transition ${
                  !form.isToday
                    ? "border-[#a98a58] bg-[#f4ede2]"
                    : "border-[#e8e0d4] bg-white hover:bg-[#f8f5f0]"
                }`}
              >
                <input
                  type="radio"
                  name="isToday"
                  checked={!form.isToday}
                  onChange={() =>
                    updateForm("isToday", false)
                  }
                  className="accent-[#a98a58]"
                />

                <span className="text-sm font-semibold text-[#342d27]">
                  Não
                </span>

                {!form.isToday && (
                  <Check
                    size={16}
                    className="text-[#a98a58]"
                  />
                )}
              </label>
            </div>

           {!form.isToday && (
                <div className="mt-5 max-w-md">
                    <Field label="Quando a despesa ocorreu?" required>
                    <input
                        type="date"
                        required
                        value={form.expenseDate}
                        onChange={(event) =>
                        updateForm("expenseDate", event.target.value)
                        }
                        className={INPUT_CLASS}
                    />
                    </Field>
                </div>
                )}
          </div>
        </section>

        <section className={SECTION_CLASS}>
  <h2 className="text-lg font-semibold text-[#342d27]">
    Alocação
  </h2>

  <div className="mt-6">
    <Field label="Tipo" required>
      <select
        value={form.allocationType}
        onChange={(event) =>
          handleAllocationChange(
            event.target.value as ExpenseAllocationType,
          )
        }
        className={INPUT_CLASS}
      >
        {ALLOCATION_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </Field>

    <p className="mt-2 text-xs text-[#81766b]">
      {
        ALLOCATION_OPTIONS.find(
          (option) =>
            option.value === form.allocationType,
        )?.description
      }
    </p>
  </div>

  {form.allocationType === "GENERAL" && (
    <div className="mt-5">
      <Field label="Valor total (R$)" required>
        <input
          type="number"
          min="0.01"
          step="0.01"
          required
          value={form.value}
          onChange={(event) => {
            const value = event.target.value;

            setForm((previous) => ({
              ...previous,
              value,
            }));
          }}
          placeholder="0,00"
          className={INPUT_CLASS}
        />
      </Field>
    </div>
  )}

  {form.allocationType !== "GENERAL" && (
    <div className="mt-6 space-y-4">
      {form.allocationType === "CATEGORY_PRODUCTS" && (
        <Field label="Categoria dos produtos" required>
          <select
            value={selectedProductCategory}
            onChange={(event) => {
              setSelectedProductCategory(event.target.value);

              setForm((previous) => ({
                ...previous,
                products: previous.products.map((product) => ({
                  ...product,
                  productId: "",
                })),
              }));
            }}
            className={INPUT_CLASS}
          >
            <option value="">
              Selecione uma categoria
            </option>

            {PRODUCT_CATEGORY_OPTIONS.map((category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {form.allocationType === "CATEGORY_PRODUCTS" && (
          <button
            type="button"
            onClick={addProduct}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e8e0d4] px-4 py-2 text-sm font-semibold text-[#927448] transition hover:bg-[#f8f5f0]"
          >
            <Plus size={16} />
            Adicionar produto
          </button>
        )}
      </div>

      {loadingProducts && (
        <Loading />
      )}

      {form.products.map((product, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-xl border border-[#eee8df] bg-[#fdfcfb] p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end"
        >
          <Field label="Produto">
            <ProductSearchSelect
              products={
                form.allocationType === "CATEGORY_PRODUCTS"
                  ? availableProducts.filter(
                      (availableProduct) =>
                        selectedProductCategory !== "" &&
                        availableProduct.category ===
                          selectedProductCategory &&
                        (
                          availableProduct.id === product.productId ||
                          !form.products.some(
                            (selected) =>
                              selected.productId ===
                              availableProduct.id,
                          )
                        ),
                    )
                  : availableProducts
              }
              value={product.productId}
              onChange={(productId) =>
                updateProduct(
                  index,
                  "productId",
                  productId,
                )
              }
            />
          </Field>

          {form.allocationType === "CATEGORY_PRODUCTS" && (
            <Field label="Valor alocado (R$)">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={product.allocatedValue}
                onChange={(event) =>
                  updateProduct(
                    index,
                    "allocatedValue",
                    event.target.value,
                  )
                }
                className={INPUT_CLASS}
              />
            </Field>
          )}

          {form.allocationType === "CATEGORY_PRODUCTS" && (
            <button
              type="button"
              onClick={() =>
                removeProduct(index)
              }
              title="Remover produto"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ))}

      {form.allocationType === "SPECIFIC_PRODUCT" && (
        <div className="mt-5">
          <Field label="Valor total (R$)" required>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.value}
              onChange={(event) => {
                const value = event.target.value;

                setForm((previous) => ({
                  ...previous,
                  value,
                  products: previous.products.map(
                    (product) => ({
                      ...product,
                      allocatedValue: value,
                    }),
                  ),
                }));
              }}
              placeholder="0,00"
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      )}

      {form.allocationType === "CATEGORY_PRODUCTS" && (
        <div className="flex flex-wrap justify-between gap-3 rounded-xl bg-[#f4ede2] px-5 py-4 text-sm">
          <span className="font-medium text-[#51473d]">
            Valor total da despesa
          </span>

          <span className="font-bold text-[#342d27]">
            {formatCurrency(expenseValue)}
          </span>
        </div>
      )}
    </div>
  )}

  {form.status === "PARTIALLY_PAID" && (
    <div className="mt-5">
      <Field label="Valor pago inicialmente (R$)" required>
        <input
          type="number"
          min="0.01"
          step="0.01"
          required
          value={form.paidAmount}
          onChange={(event) => updateForm("paidAmount", event.target.value)}
          placeholder="0,00"
          className={INPUT_CLASS}
        />
      </Field>
    </div>
  )}
</section>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link
            href="/despesas"
            className="inline-flex items-center justify-center rounded-xl border border-[#e8e0d4] bg-white px-6 py-3 text-sm font-semibold text-[#51473d] transition hover:bg-[#f8f5f0]"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Save size={18} />
            )}

            {saving
              ? "Salvando..."
              : "Registrar"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}