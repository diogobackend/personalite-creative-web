"use client";

import { useEffect, useState, type FormEvent, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, Boxes, Check, Loader2, Package, Save, SlidersHorizontal } from "lucide-react";

import { api } from "../../../../src/lib/api";
import DashboardLayout from "../../../../src/components/layout/DashboardLayout";
import Loading from "@/src/components/layout/Loading";

type Inventory = {
  id: string;
  name: string;
  category: string;
  categoryId: string | null;
  description: string | null;
  productId: string | null;
  quantity: number;
  minimumQuantity: number | null;
  unit: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  createdAt: string;
  updatedAt: string;
};

type EditableField =
  | "name"
  | "category"
  | "description"
  | "quantity"
  | "minimumQuantity"
  | "unit"
  | "color"
  | "size"
  | "material"
  | "brand"
  | "model"
  | "sku";

type FormValues = Record<EditableField, string>;

type Product = { id: string; name: string; code: string; category: string; description?: string | null };

type Category = {
  id: string;
  name: string;
  type: "PRODUCT" | "INVENTORY" | "EXPENSE";
};

const UNIT_OPTIONS = [
  ["UN", "Unidade"],
  ["PAR", "Par"],
  ["KIT", "Kit"],
  ["CX", "Caixa"],
  ["PCT", "Pacote"],
  ["DZ", "Dúzia"],
  ["M", "Metro"],
  ["CM", "Centímetro"],
  ["M2", "Metro quadrado"],
  ["KG", "Quilograma"],
  ["G", "Grama"],
  ["L", "Litro"],
  ["ML", "Mililitro"],
  ["ROLO", "Rolo"],
  ["FOLHA", "Folha"],
] as const;

type ProductCharacteristics = {
  colors: string[] | null;
  sizes: string[] | null;
  materials: string[] | null;
  brands: string[] | null;
  models: string[] | null;
};

const CHARACTERISTIC_FIELDS = [
  { field: "color", key: "colors", label: "Cor", placeholder: "Ex.: Branco" },
  { field: "size", key: "sizes", label: "Tamanho", placeholder: "Ex.: 38, M, 22" },
  { field: "material", key: "materials", label: "Material", placeholder: "Ex.: Algodão" },
  { field: "brand", key: "brands", label: "Marca", placeholder: "Marca do item" },
  { field: "model", key: "models", label: "Modelo", placeholder: "Modelo do item" },
] as const;

const INPUT_CLASS =
  "w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-2.5 text-sm text-[#342d27] outline-none transition focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";

const LABEL_CLASS =
  "flex flex-col gap-2 text-xs font-semibold text-stone-600";

function toFormValues(inventory: Inventory): FormValues {
  return {
    name: inventory.name,
    category: inventory.category,
    description: inventory.description ?? "",
    quantity: String(inventory.quantity),
    minimumQuantity:
      inventory.minimumQuantity === null
        ? ""
        : String(inventory.minimumQuantity),
    unit: inventory.unit ?? "",
    color: inventory.color ?? "",
    size: inventory.size ?? "",
    material: inventory.material ?? "",
    brand: inventory.brand ?? "",
    model: inventory.model ?? "",
    sku: inventory.sku ?? "",
  };
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Não foi possível conectar ao servidor.";
    }

    if (error.response.status === 401) {
      return "Sua sessão expirou. Faça login novamente.";
    }

    if (error.response.status === 403) {
      return "Você não possui permissão para editar o estoque.";
    }

    if (error.response.status === 404) {
      return "Item do estoque não encontrado.";
    }

    const message = error.response.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    return "Não foi possível salvar as alterações.";
  }

  return error instanceof Error
    ? error.message
    : "Ocorreu um erro inesperado.";
}

function getToken(): string {
  const token = localStorage.getItem("access_token");

  if (!token || token === "undefined" || token === "null") {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  return token;
}

function EditarEstoqueContent() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [form, setForm] = useState<FormValues | null>(null);
  const [initialForm, setInitialForm] = useState<FormValues | null>(null);
  const [productCharacteristics, setProductCharacteristics] = useState<ProductCharacteristics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInventory() {
      setLoading(true);
      setError(null);

      try {
        const token = getToken();

        const { data } = await api.get<Inventory>(
          `/inventory/${id}`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { data: inventoryCategories } = await api.get<Category[]>(
          "/categories",
          {
            params: { type: "INVENTORY" },
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        let characteristics: ProductCharacteristics | null = null;
        if (data.productId) {
          const productResponse = await api.get<ProductCharacteristics>(
            `/products/${encodeURIComponent(data.productId)}`,
            {
              signal: controller.signal,
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          characteristics = productResponse.data;
        }

        if (controller.signal.aborted) return;

        setProductCharacteristics(characteristics);
        const values = toFormValues(data);

        setInventory(data);
        setCategories((Array.isArray(inventoryCategories) ? inventoryCategories : (inventoryCategories as unknown as { content?: Category[] }).content ?? []).filter((category) => category.type === "INVENTORY"));
        setProductId(data.productId);
        setCategoryId(data.categoryId ?? "");
        setForm(values);
        setInitialForm(values);
      } catch (cause) {
        if (controller.signal.aborted || axios.isCancel(cause)) return;

        const message = getErrorMessage(cause);
        setError(message);
        toast.error(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      void loadInventory();
    }

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      try {
        const { data } = await api.get("/products", {
          params: { page: 0, size: 100 }, signal: controller.signal,
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!controller.signal.aborted) setProducts(Array.isArray(data?.content) ? data.content : []);
      } catch (cause) {
        if (!controller.signal.aborted && !axios.isCancel(cause)) toast.error(getErrorMessage(cause));
      }
    }
    void loadProducts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (productId) {
      const product = products.find((item) => item.id === productId);
      if (product) setProductSearch(product.name);
    } else {
      setProductSearch("");
    }
  }, [productId, products]);

  function updateField(field: EditableField, value: string) {
    setForm((previous) =>
      previous ? { ...previous, [field]: value } : previous
    );

    setError(null);
  }

  const changedFields =
    form && initialForm
      ? (Object.keys(form) as EditableField[]).filter(
          (field) => form[field] !== initialForm[field]
        )
      : [];

  const categoryIdChanged = categoryId !== (inventory?.categoryId ?? "");
  const productIdChanged = productId !== (inventory?.productId ?? null);
  const hasChanges = changedFields.length > 0 || categoryIdChanged || productIdChanged;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form || !initialForm || !inventory || !hasChanges) {
      return;
    }

    if (!form.name.trim()) {
      toast.error("O nome não pode ficar vazio.");
      return;
    }

    if (!form.category) {
      toast.error("A categoria é obrigatória.");
      return;
    }

    if (form.quantity === "" || Number(form.quantity) < 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }

    if (
      form.minimumQuantity !== "" &&
      Number(form.minimumQuantity) < 0
    ) {
      toast.error("A quantidade mínima não pode ser negativa.");
      return;
    }

    const payload: Record<string, string | number | null> = {};

    for (const field of changedFields) {
      const value = form[field];

      // Para características, vazio significa remover o valor existente.
      if (value === "" && CHARACTERISTIC_FIELDS.some(({ field: characteristic }) => characteristic === field)) {
        payload[field] = "";
        continue;
      }
      if (value === "") {
        if (["description", "sku", "unit", "minimumQuantity"].includes(field)) payload[field] = null;
        continue;
      }

      if (field === "quantity" || field === "minimumQuantity") {
        payload[field] = Number(value);
      } else {
        payload[field] = value.trim();
      }
    }

    if (categoryIdChanged && categoryId) {
      payload.categoryId = categoryId;
      const selectedCategory = categories.find((category) => category.id === categoryId);
      if (selectedCategory) payload.category = selectedCategory.name;
    }

    if (productIdChanged) payload.productId = productId;

    if (Object.keys(payload).length === 0) {
      toast.error(
        "Nenhuma alteração válida para enviar. Campos vazios não alteram os demais dados."
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = getToken();

      await api.patch(`/inventory/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Item do estoque atualizado com sucesso!");
      router.push(`/estoque/${id}`);
      router.refresh();
    } catch (cause) {
      toast.error(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-6 pb-10">
        <div>
          <Link
            href={`/estoque/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#927448] hover:text-[#725934]"
          >
            <ArrowLeft size={17} />
            Voltar para o item
          </Link>

          <h1 className="mt-4 font-serif text-3xl text-[#342d27] sm:text-4xl">
            Editar item
          </h1>
          <span className="text-sm text-[#81766b]">SKU: {inventory?.sku ?? "Não informado"}</span>
        </div>

        {loading ? (
          <Loading />
        ) : !inventory || !form ? (
          <div className="rounded-2xl border border-[#ece6dc] bg-white p-8">
            <p className="text-sm text-red-700">
              {error ?? "Não foi possível carregar o item."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-semibold text-[#342d27]">É um produto já cadastrado?</h2>
              <div className="mt-5 flex gap-4">
                {(["YES", "NO"] as const).map((choice) => {
                  const selected = choice === (productId ? "YES" : "NO");
                  return <button key={choice} type="button" onClick={() => {
                    if (choice === "NO") { setProductId(null); setProductCharacteristics(null); }
                    else if (!productId) setProductDropdownOpen(true);
                  }} className={`flex min-w-32 items-center justify-between gap-4 rounded-xl border px-5 py-3 text-sm font-semibold ${selected ? "border-[#a98a58] bg-[#f4ede2]" : "border-[#e8e0d4] bg-white"}`}>
                    {choice === "YES" ? "Sim" : "Não"}{selected && <Check size={16} />}
                  </button>;
                })}
              </div>
              {(productId || productDropdownOpen) && <div className="relative mt-6">
                <label className={LABEL_CLASS}>Selecione o produto
                  <input className={INPUT_CLASS} value={productSearch} placeholder="Digite parte do nome do produto..." onFocus={() => setProductDropdownOpen(true)} onChange={(event) => { setProductSearch(event.target.value); setProductDropdownOpen(true); }} />
                </label>
                {productDropdownOpen && <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#e8e0d4] bg-white shadow-lg">
                  {products.filter((product) => product.name.toLocaleLowerCase("pt-BR").includes(productSearch.toLocaleLowerCase("pt-BR"))).map((product) =>
                    <button key={product.id} type="button" onClick={async () => {
                      setProductId(product.id); setProductSearch(product.name); setProductDropdownOpen(false);
                      setForm((previous) => previous ? { ...previous, name: product.name, category: product.category, sku: product.code, description: product.description ?? "", color: "", size: "", material: "", brand: "", model: "" } : previous);
                      const category = categories.find((item) => item.name === product.category);
                      if (category) setCategoryId(category.id);
                      try {
                        const { data } = await api.get<ProductCharacteristics>(`/products/${encodeURIComponent(product.id)}`, { headers: { Authorization: `Bearer ${getToken()}` } });
                        setProductCharacteristics(data);
                      } catch (cause) { toast.error(getErrorMessage(cause)); }
                    }} className="flex w-full justify-between px-4 py-3 text-left text-sm hover:bg-[#f4ede2]">
                      <span>{product.name}</span><span className="text-[#81766b]">{product.code}</span>
                    </button>
                  )}
                </div>}
              </div>}
            </section>

            <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3"><Package className="text-[#a98a58]" size={20}/><h2 className="text-lg font-semibold text-[#342d27]">Informações do item</h2></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={LABEL_CLASS}>
                  Nome
                  <input
                    className={`${INPUT_CLASS} disabled:cursor-not-allowed`}
                    value={form.name}
                    disabled={Boolean(productId)}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    required
                  />
                </label>

                <label className={LABEL_CLASS}>
                  Categoria
                  <select
                    className={`${INPUT_CLASS} disabled:cursor-not-allowed`}
                    disabled={Boolean(productId)}
                    value={categoryId}
                    onChange={(event) => {
                      const selected = categories.find(
                        (category) => category.id === event.target.value
                      );
                      setCategoryId(event.target.value);
                      if (selected) updateField("category", selected.name);
                    }}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={LABEL_CLASS}>
                  SKU
                  <input className={INPUT_CLASS} maxLength={255} value={form.sku} onChange={(event) => updateField("sku", event.target.value)} placeholder="Ex.: CAM-BRA-M" />
                </label>
                <label className={`${LABEL_CLASS} sm:col-span-2`}>
                  Descrição
                  <textarea
                    rows={4}
                    className={INPUT_CLASS}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Descrição do item"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#342d27]">
                  <Boxes size={19} className="inline mr-2 text-[#a98a58]" />Controle de estoque
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <label className={LABEL_CLASS}>
                  Qtd
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={INPUT_CLASS}
                    value={form.quantity}
                    onChange={(event) =>
                      updateField("quantity", event.target.value)
                    }
                    required
                  />
                </label>

                <label className={LABEL_CLASS}>
                  Qtd mínima p/ alertar estar acabando
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={INPUT_CLASS}
                    value={form.minimumQuantity}
                    onChange={(event) =>
                      updateField("minimumQuantity", event.target.value)
                    }
                    placeholder="Não informada"
                  />
                </label>

                <label className={LABEL_CLASS}>
                  Unidade de medida
                  <select
                    className={INPUT_CLASS}
                    value={form.unit}
                    onChange={(event) =>
                      updateField("unit", event.target.value)
                    }
                  >
                    <option value="">Não informada</option>
                    {UNIT_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            {CHARACTERISTIC_FIELDS.some(({ key }) =>
  !productId ||
  productCharacteristics?.[key]?.some((value) => value?.trim())
) && (
  <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-[#342d27]">
        <SlidersHorizontal size={19} className="inline mr-2 text-[#a98a58]" />Características do item
      </h2>
    </div>

    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {CHARACTERISTIC_FIELDS.map(({ field, key, label, placeholder }) => {
        const linked = Boolean(productId);

        const options = Array.from(
          new Set(
            (productCharacteristics?.[key] ?? [])
              .filter((value) => value?.trim())
          )
        );

        if (linked && options.length === 0 && !form[field]) return null;

        return (
          <label key={field} className={LABEL_CLASS}>
            {label}

            {linked ? (
              <select
                className={INPUT_CLASS}
                value={form[field]}
                onChange={(event) =>
                  updateField(field, event.target.value)
                }
              >
                <option value="">Inexistente</option>

                {form[field] && !options.includes(form[field]) && <option value={form[field]}>{form[field]} (atual)</option>}
                {options.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={INPUT_CLASS}
                value={form[field]}
                onChange={(event) =>
                  updateField(field, event.target.value)
                }
                placeholder={placeholder}
              />
            )}
          </label>
        );
      })}
    </div>
  </section>
)}

            <div className="flex flex-wrap items-center justify-between gap-4">
              

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/estoque/${id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-[#e8e0d4] bg-white px-5 py-2.5 text-sm font-medium text-[#51473d] transition hover:bg-[#f7f3ed]"
                >
                  Cancelar
                </Link>

                <button
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </DashboardLayout>
  );
}

export default function EditarEstoquePage() {
  return (
    <Suspense fallback={<Loading />}>
      <EditarEstoqueContent />
    </Suspense>
  );
}