"use client";

import { useEffect, useState, type FormEvent, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { api } from "../../../../src/lib/api";
import DashboardLayout from "../../../../src/components/layout/DashboardLayout";

type Inventory = {
  id: string;
  name: string;
  category: string;
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
  | "model";

type FormValues = Record<EditableField, string>;

const CATEGORY_OPTIONS = [
  ["GOURMET", "Gourmet"],
  ["AGUAS", "Águas"],
  ["GARRAFAS", "Garrafas"],
  ["GLOSS", "Gloss"],
  ["BOLSAS", "Bolsas"],
  ["NECESSAIRES", "Necessaires"],
  ["LENCOS", "Lenços"],
  ["PAPELARIA", "Papelaria"],
  ["CAIXAS", "Caixas"],
  ["KITS", "Kits"],
] as const;

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

const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG"] as const;

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
  const [form, setForm] = useState<FormValues | null>(null);
  const [initialForm, setInitialForm] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

        if (controller.signal.aborted) return;

        const values = toFormValues(data);

        setInventory(data);
        setForm(values);
        setInitialForm(values);
      } catch (cause) {
        if (controller.signal.aborted || axios.isCancel(cause)) return;

        setError(getErrorMessage(cause));
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

  function updateField(field: EditableField, value: string) {
    setForm((previous) =>
      previous ? { ...previous, [field]: value } : previous
    );

    setError(null);
    setSuccess(null);
  }

  const changedFields =
    form && initialForm
      ? (Object.keys(form) as EditableField[]).filter(
          (field) => form[field] !== initialForm[field]
        )
      : [];

  const hasChanges = changedFields.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form || !initialForm || !inventory || !hasChanges) {
      return;
    }

    if (!form.name.trim()) {
      setError("O nome não pode ficar vazio.");
      return;
    }

    if (!form.category) {
      setError("A categoria é obrigatória.");
      return;
    }

    if (form.quantity === "" || Number(form.quantity) < 0) {
      setError("Informe uma quantidade válida.");
      return;
    }

    if (
      form.minimumQuantity !== "" &&
      Number(form.minimumQuantity) < 0
    ) {
      setError("A quantidade mínima não pode ser negativa.");
      return;
    }

    const payload: Record<string, string | number> = {};

    for (const field of changedFields) {
      const value = form[field];

      // O backend interpreta null como "manter o valor anterior".
      // Portanto, campos vazios não são enviados.
      if (value === "") continue;

      if (field === "quantity" || field === "minimumQuantity") {
        payload[field] = Number(value);
      } else {
        payload[field] = value.trim();
      }
    }

    if (Object.keys(payload).length === 0) {
      setError(
        "Nenhuma alteração válida para enviar. Campos vazios mantêm o valor anterior."
      );
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();

      await api.patch(`/inventory/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.push(`/estoque/${id}`);
      router.refresh();
    } catch (cause) {
      setError(getErrorMessage(cause));
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
          <span> SKU: {inventory.sku ?? "Não informado"} </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#ece6dc] bg-white p-16 text-sm text-[#81766b]">
            <Loader2 size={20} className="animate-spin" />
            Carregando dados atualizados...
          </div>
        ) : !inventory || !form ? (
          <div className="rounded-2xl border border-[#ece6dc] bg-white p-8">
            <p className="text-sm text-red-700">
              {error ?? "Não foi possível carregar o item."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={LABEL_CLASS}>
                  Nome
                  <input
                    className={INPUT_CLASS}
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    required
                  />
                </label>

                <label className={LABEL_CLASS}>
                  Categoria
                  <select
                    className={INPUT_CLASS}
                    value={form.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    required
                  >
                    {CATEGORY_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
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
                  Controle de estoque
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

            <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#342d27]">
                  Características do item
                </h2>
                <p className="mt-1 text-sm text-[#81766b]">
                  Detalhes físicos e informações complementares.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className={LABEL_CLASS}>
                  Cor
                  <input
                    className={INPUT_CLASS}
                    value={form.color}
                    onChange={(event) =>
                      updateField("color", event.target.value)
                    }
                    placeholder="Ex.: Branco"
                  />
                </label>

                <label className={LABEL_CLASS}>
                  Tamanho
                  <select
                    className={INPUT_CLASS}
                    value={form.size}
                    onChange={(event) =>
                      updateField("size", event.target.value)
                    }
                  >
                    <option value="">Não informado</option>
                    {SIZE_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={LABEL_CLASS}>
                  Material
                  <input
                    className={INPUT_CLASS}
                    value={form.material}
                    onChange={(event) =>
                      updateField("material", event.target.value)
                    }
                    placeholder="Ex.: Algodão"
                  />
                </label>

                <label className={LABEL_CLASS}>
                  Marca
                  <input
                    className={INPUT_CLASS}
                    value={form.brand}
                    onChange={(event) =>
                      updateField("brand", event.target.value)
                    }
                    placeholder="Marca do item"
                  />
                </label>

                <label className={LABEL_CLASS}>
                  Modelo
                  <input
                    className={INPUT_CLASS}
                    value={form.model}
                    onChange={(event) =>
                      updateField("model", event.target.value)
                    }
                    placeholder="Modelo do item"
                  />
                </label>
              </div>
            </section>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <p className="text-sm text-green-700">{success}</p>
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
    <Suspense fallback={<div>Carregando item...</div>}>
      <EditarEstoqueContent />
    </Suspense>
  );
}