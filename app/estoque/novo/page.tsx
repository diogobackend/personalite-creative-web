
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
import {
  ArrowLeft,
  Boxes,
  Check,
  ChevronDown,
  Loader2,
  Package,
  Save,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import DashboardLayout from "../../../src/components/layout/DashboardLayout";
import { api } from "../../../src/lib/api";

type ProductChoice = "YES" | "NO";

type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
};

type InventoryForm = {
  name: string;
  category: string;
  description: string;
  quantity: string;
  minimumQuantity: string;
  unit: string;
  color: string;
  size: string;
  material: string;
  brand: string;
  model: string;
  sku: string;
};

const INITIAL_FORM: InventoryForm = {
  name: "",
  category: "",
  description: "",
  quantity: "0",
  minimumQuantity: "",
  unit: "",
  color: "",
  size: "",
  material: "",
  brand: "",
  model: "",
  sku: "",
};

const INPUT_CLASS =
  "w-full rounded-xl border border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#342d27] outline-none transition placeholder:text-[#aaa197] focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";

const LABEL_CLASS =
  "mb-2 block text-sm font-semibold text-[#51473d]";

const SECTION_CLASS =
  "rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6";

const CATEGORY_OPTIONS = [
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

const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG"];

const UNIT_OPTIONS = [
  { value: "UN", label: "Unidade (un)" },
  { value: "PAR", label: "Par" },
  { value: "KIT", label: "Kit" },
  { value: "CX", label: "Caixa" },
  { value: "PCT", label: "Pacote" },
  { value: "DZ", label: "Dúzia" },
  { value: "M", label: "Metro (m)" },
  { value: "CM", label: "Centímetro (cm)" },
  { value: "M2", label: "Metro quadrado (m²)" },
  { value: "KG", label: "Quilograma (kg)" },
  { value: "G", label: "Grama (g)" },
  { value: "L", label: "Litro (L)" },
  { value: "ML", label: "Mililitro (mL)" },
  { value: "ROLO", label: "Rolo" },
  { value: "FOLHA", label: "Folha" },
];

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

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-[#f4ede2] p-2.5 text-[#a98a58]">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#342d27]">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-[#81766b]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function isNonNegativeInteger(value: string): boolean {
  return (
    /^\d+$/.test(value.trim()) &&
    Number.isSafeInteger(Number(value))
  );
}

function optionalText(value: string): string | null {
  return value.trim() || null;
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
      return "Você não tem permissão para cadastrar itens no estoque.";
    }

    if (error.response.status === 409) {
      return "Já existe um item no estoque com este SKU.";
    }

    const message = error.response.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    return `Não foi possível cadastrar o item (HTTP ${error.response.status}).`;
  }

  return error instanceof Error
    ? error.message
    : "Ocorreu um erro inesperado.";
}

export default function NovoEstoquePage() {
  const router = useRouter();

  const [productChoice, setProductChoice] =
    useState<ProductChoice>("NO");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] =
    useState(false);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(
    null,
  );

  const [form, setForm] = useState<InventoryForm>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateForm<K extends keyof InventoryForm>(
    field: K,
    value: InventoryForm[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleProductChoice(choice: ProductChoice) {
    if (choice === productChoice) return;

    setProductChoice(choice);
    setSelectedProduct(null);
    setProductSearch("");
    setProductDropdownOpen(false);
    setProductsError(null);
    setError(null);

    setForm((previous) => ({
      ...previous,
      name: "",
      category: "",
      sku: "",
      description: "",
    }));
  }

  function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setProductDropdownOpen(false);

    setForm((previous) => ({
      ...previous,
      name: product.name,
      category: product.category,
      sku: product.code,
      description: product.description ?? "",
    }));
  }

  useEffect(() => {
    if (productChoice !== "YES") return;

    const controller = new AbortController();

    async function loadProducts() {
      setLoadingProducts(true);
      setProductsError(null);

      try {
        const token = localStorage.getItem("access_token");

        const response = await api.get("/products", {
          params: {
            page: 0,
            size: 100,
          },
          signal: controller.signal,
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
        });

        if (controller.signal.aborted) return;

        const content = response.data?.content ?? [];

        setProducts(
          content.map((product: Product) => ({
            id: product.id,
            code: product.code,
            name: product.name,
            category: product.category,
            description: product.description ?? null,
          })),
        );
      } catch (exception) {
        if (
          controller.signal.aborted ||
          axios.isCancel(exception)
        ) {
          return;
        }

        setProductsError(
          "Não foi possível carregar os produtos cadastrados.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => controller.abort();
  }, [productChoice]);

  const filteredProducts = products.filter((product) =>
    product.name
      .toLocaleLowerCase("pt-BR")
      .includes(productSearch.toLocaleLowerCase("pt-BR")),
  );

  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find(
      (category) => category.value === form.category,
    )?.label ?? form.category;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (productChoice === "YES" && !selectedProduct) {
      setError("Selecione um produto cadastrado.");
      return;
    }

    if (!form.name.trim()) {
      setError("Informe o nome do item.");
      return;
    }

    if (!form.category.trim()) {
      setError("Informe a categoria do item.");
      return;
    }

    if (!isNonNegativeInteger(form.quantity)) {
      setError(
        "A quantidade inicial deve ser um número inteiro não negativo.",
      );
      return;
    }

    if (
      form.minimumQuantity.trim() &&
      !isNonNegativeInteger(form.minimumQuantity)
    ) {
      setError(
        "A quantidade mínima deve ser um número inteiro não negativo.",
      );
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token || token === "undefined" || token === "null") {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: optionalText(form.description),
      productId:
        productChoice === "YES" ? selectedProduct!.id : null,
      quantity: Number(form.quantity),
      minimumQuantity: form.minimumQuantity.trim()
        ? Number(form.minimumQuantity)
        : null,
      unit: optionalText(form.unit),
      color: optionalText(form.color),
      size: optionalText(form.size),
      material: optionalText(form.material),
      brand: optionalText(form.brand),
      model: optionalText(form.model),
      sku: optionalText(form.sku),
    };

    setSaving(true);

    try {
      await api.post("/inventory", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.push("/estoque");
      router.refresh();
    } catch (exception) {
      setError(getErrorMessage(exception));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-5xl pb-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/estoque"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#927448] transition hover:text-[#725934]"
            >
              <ArrowLeft size={16} />
              Voltar para estoque
            </Link>

            <h1 className="mt-3 font-serif text-3xl text-[#342d27] sm:text-4xl">
              Cadastrar item no estoque
            </h1>

            <p className="mt-2 text-sm text-[#81766b]">
              Registre materiais, insumos e suas quantidades iniciais.
            </p>
          </div>

          <button
            type="submit"
            form="inventory-form"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}

            {saving ? "Salvando..." : "Cadastrar item"}
          </button>
        </div>

        <form
          id="inventory-form"
          onSubmit={handleSubmit}
          className="space-y-6"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <section className={SECTION_CLASS}>
            <h2 className="text-lg font-semibold text-[#342d27]">
              É um produto já cadastrado?
            </h2>

            <div className="mt-5 flex flex-wrap gap-4">
              {(
                [
                  { value: "YES", label: "Sim" },
                  { value: "NO", label: "Não" },
                ] as const
              ).map((option) => {
                const selected =
                  productChoice === option.value;

                return (
                  <label
                    key={option.value}
                    className={`flex min-w-32 cursor-pointer items-center justify-between gap-4 rounded-xl border px-5 py-3 transition ${
                      selected
                        ? "border-[#a98a58] bg-[#f4ede2]"
                        : "border-[#e8e0d4] bg-white hover:bg-[#f8f5f0]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="existingProduct"
                        checked={selected}
                        onChange={() =>
                          handleProductChoice(option.value)
                        }
                        className="accent-[#a98a58]"
                      />

                      <span className="text-sm font-semibold text-[#342d27]">
                        {option.label}
                      </span>
                    </span>

                    {selected && (
                      <Check
                        size={16}
                        className="text-[#a98a58]"
                      />
                    )}
                  </label>
                );
              })}
            </div>

            {productChoice === "YES" && (
              <div className="mt-6 border-t border-[#eee8df] pt-6">
                <Field label="Selecione o produto" required>
                  <div className="relative">
                    <div className="relative">
                      <Search
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a98a58]"
                      />

                      <input
                        type="text"
                        value={productSearch}
                        onChange={(event) => {
                          setProductSearch(event.target.value);
                          setSelectedProduct(null);
                          setForm((previous) => ({
                            ...previous,
                            name: "",
                            category: "",
                            sku: "",
                            description: "",
                          }));
                          setProductDropdownOpen(true);
                        }}
                        onFocus={() =>
                          setProductDropdownOpen(true)
                        }
                        onBlur={() =>
                          setProductDropdownOpen(false)
                        }
                        placeholder="Digite parte do nome do produto..."
                        autoComplete="off"
                        className={`${INPUT_CLASS} pl-11 pr-11`}
                      />

                      <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#81766b]"
                      />
                    </div>

                    {productDropdownOpen && (
                      <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[#e8e0d4] bg-white shadow-lg">
                        {loadingProducts ? (
                          <div className="flex items-center gap-2 px-4 py-4 text-sm text-[#81766b]">
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                            Carregando produtos...
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-[#81766b]">
                            Nenhum produto encontrado.
                          </p>
                        ) : (
                          filteredProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleSelectProduct(product);
                              }}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#f4ede2]"
                            >
                              <span className="text-sm font-medium text-[#342d27]">
                                {product.name}
                              </span>

                              <span className="text-xs text-[#81766b]">
                                {product.code}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </Field>

                {productsError && (
                  <p className="mt-3 text-sm text-red-600">
                    {productsError}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className={SECTION_CLASS}>
            <SectionHeading
              icon={<Package size={20} />}
              title="Informações do item"
              description="Dados principais para identificação no estoque."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {productChoice === "NO" && (
                <div className="sm:col-span-2">
                  <Field label="Nome do item" required>
                    <input
                      type="text"
                      required
                      maxLength={255}
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      placeholder="Ex.: Camiseta branca"
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>
              )}

              <Field label="Categoria" required>
                {productChoice === "YES" ? (
                  <input
                    type="text"
                    value={selectedCategoryLabel}
                    readOnly
                    placeholder="Selecione um produto"
                    className={`${INPUT_CLASS} cursor-not-allowed bg-[#f8f5f0] text-[#81766b]`}
                  />
                ) : (
                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateForm(
                        "category",
                        event.target.value,
                      )
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="">
                      Selecione uma categoria
                    </option>

                    {CATEGORY_OPTIONS.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="SKU">
                <input
                  type="text"
                  maxLength={255}
                  value={form.sku}
                  onChange={(event) => updateForm("sku", event.target.value)}
                  placeholder="Ex.: CAM-BRA-M"
                  className={INPUT_CLASS}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Descrição">
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Informações adicionais sobre o item..."
                    className={`${INPUT_CLASS} resize-y`}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className={SECTION_CLASS}>
            <SectionHeading
              icon={<Boxes size={20} />}
              title="Controle de estoque"
              description="Defina o saldo inicial e a quantidade mínima desejada."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <Field label="Quantidade" required>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.quantity}
                  onChange={(event) =>
                    updateForm(
                      "quantity",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: 50"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Qtd mínima p/ alertar estar acabando">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.minimumQuantity}
                  onChange={(event) =>
                    updateForm(
                      "minimumQuantity",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: 10"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Unidade de medida">
                <select
                  value={form.unit}
                  onChange={(event) => updateForm("unit", event.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Selecione uma unidade</option>
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <p className="mt-5 rounded-xl border border-[#eee5d8] bg-[#fdfbf8] px-4 py-3 text-sm text-[#81766b]">
              Quando a quantidade inicial for maior que zero,
              o sistema registrará automaticamente uma
              movimentação de entrada no estoque.
            </p>
          </section>

          <section className={SECTION_CLASS}>
            <SectionHeading
              icon={<SlidersHorizontal size={20} />}
              title="Características do item"
              description="Informações opcionais para diferenciar materiais e variações."
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Cor">
                <input
                  type="text"
                  maxLength={255}
                  value={form.color}
                  onChange={(event) =>
                    updateForm("color", event.target.value)
                  }
                  placeholder="Ex.: Branco"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Tamanho">
                <select
                  value={form.size}
                  onChange={(event) => updateForm("size", event.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Selecione um tamanho</option>
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </Field>

              <Field label="Material">
                <input
                  type="text"
                  maxLength={255}
                  value={form.material}
                  onChange={(event) =>
                    updateForm(
                      "material",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Algodão"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Marca">
                <input
                  type="text"
                  maxLength={255}
                  value={form.brand}
                  onChange={(event) =>
                    updateForm("brand", event.target.value)
                  }
                  placeholder="Ex.: Marca do fornecedor"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Modelo">
                <input
                  type="text"
                  maxLength={255}
                  value={form.model}
                  onChange={(event) =>
                    updateForm("model", event.target.value)
                  }
                  placeholder="Ex.: Oversized"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link
              href="/estoque"
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

              {saving ? "Salvando..." : "Cadastrar item"}
            </button>
          </div>
        </form>
      </main>
    </DashboardLayout>
  );
}
