"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import DashboardLayout from "../../../../src/components/layout/DashboardLayout";
import { api } from "../../../../src/lib/api";
import { getColor } from "../../../../src/utils/colors";

type Price = {
  id?: string;
  key: string;
  minimumQuantity: string;
  unitPrice: string;
};

type Fee = {
  id?: string;
  key: string;
  name: string;
  amount: string;
  chargeType: string;
  required: boolean;
  active: boolean;
};

type CharacteristicKey =
  | "colors"
  | "sizes"
  | "brands"
  | "models"
  | "materials";

type Characteristics = Record<CharacteristicKey, string[]>;

type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  minimumQuantity: number | null;
  pricingType: string;
  shelfLifeDays: number | null;
  productionLeadTimeMinDays: number | null;
  productionLeadTimeMaxDays: number | null;
  active: boolean;
  colors: string[];
  sizes: string[];
  brands: string[];
  models: string[];
  materials: string[];
  prices: {
    id: string;
    minimumQuantity: number;
    unitPrice: number;
  }[];
  fees: {
    id: string;
    name: string;
    amount: number;
    chargeType: string;
    required: boolean;
    active: boolean;
  }[];
};

const categories = ["SAVORY", "SWEET", "BEVERAGE", "OTHER"];
const chargeTypes = ["FIXED", "PER_UNIT", "PERCENTAGE"];

const characteristicGroups: {
  key: CharacteristicKey;
  label: string;
  placeholder: string;
}[] = [
  { key: "colors", label: "Cores", placeholder: "Ex.: Azul" },
  { key: "sizes", label: "Tamanhos", placeholder: "Ex.: M" },
  { key: "brands", label: "Marcas", placeholder: "Ex.: Marca" },
  { key: "models", label: "Modelos", placeholder: "Ex.: Modelo" },
  { key: "materials", label: "Materiais", placeholder: "Ex.: Algodão" },
];

const emptyCharacteristics = (): Characteristics => ({
  colors: [],
  sizes: [],
  brands: [],
  models: [],
  materials: [],
});

const inputClass =
  "w-full rounded-xl border border-[#e8e1d7] bg-white px-3 py-2.5 text-sm text-[#342d27] outline-none focus:border-[#a98a58]";

const labelClass =
  "mb-1.5 block text-sm font-medium text-[#342d27]";

const sectionClass =
  "space-y-4 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm";

const addButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-[#a98a58] px-3 py-2 text-sm font-semibold text-[#927448]";

const deleteButtonClass =
  "rounded-xl border border-red-200 p-2.5 text-red-600 hover:bg-red-50";

const newKey = () => crypto.randomUUID();
const num = (value: string) => Number(value);

const optionalNumber = (value: string) =>
  value.trim() === "" ? null : Number(value);

const errorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      `Erro HTTP ${error.response?.status ?? "de conexão"}.`
    );
  }

  return error instanceof Error
    ? error.message
    : "Erro inesperado.";
};

function EditProductContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [original, setOriginal] = useState<Product | null>(null);

  const [characteristicInputs, setCharacteristicInputs] =
  useState<Record<CharacteristicKey, string>>({
    colors: "",
    sizes: "",
    brands: "",
    models: "",
    materials: "",
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    minimumQuantity: "",
    pricingType: "",
    shelfLifeDays: "",
    productionLeadTimeMinDays: "",
    productionLeadTimeMaxDays: "",
    active: true,
  });

  const [prices, setPrices] = useState<Price[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);

  const [characteristics, setCharacteristics] =
    useState<Characteristics>(emptyCharacteristics);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error(
            "Sessão não encontrada. Faça login novamente."
          );
        }

        const { data } = await api.get<Product>(
          `/products/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        setOriginal(data);

        setForm({
          name: data.name,
          category: data.category,
          description: data.description ?? "",
          minimumQuantity:
            data.minimumQuantity?.toString() ?? "",
          pricingType: data.pricingType,
          shelfLifeDays:
            data.shelfLifeDays?.toString() ?? "",
          productionLeadTimeMinDays:
            data.productionLeadTimeMinDays?.toString() ?? "",
          productionLeadTimeMaxDays:
            data.productionLeadTimeMaxDays?.toString() ?? "",
          active: data.active,
        });

        setPrices(
          data.prices.map((price) => ({
            id: price.id,
            key: price.id,
            minimumQuantity: String(price.minimumQuantity),
            unitPrice: String(price.unitPrice),
          }))
        );

        setFees(
          data.fees.map((fee) => ({
            ...fee,
            key: fee.id,
            amount: String(fee.amount),
          }))
        );

        setCharacteristics({
          colors: data.colors ?? [],
          sizes: data.sizes ?? [],
          brands: data.brands ?? [],
          models: data.models ?? [],
          materials: data.materials ?? [],
        });
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(errorMessage(cause));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      void load();
    } else {
      setError("ID do produto não informado.");
      setLoading(false);
    }

    return () => controller.abort();
  }, [id]);

  function updateForm<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePrice(key: string, patch: Partial<Price>) {
    setPrices((current) =>
      current.map((row) =>
        row.key === key ? { ...row, ...patch } : row
      )
    );
  }

  function updateFee(key: string, patch: Partial<Fee>) {
    setFees((current) =>
      current.map((row) =>
        row.key === key ? { ...row, ...patch } : row
      )
    );
  }

  function updateCharacteristic(
    key: CharacteristicKey,
    values: string[]
  ) {
    setCharacteristics((current) => ({
      ...current,
      [key]: values,
    }));
  }

  function addCharacteristic(key: CharacteristicKey) {
  const value = characteristicInputs[key].trim();

  if (!value) return;

  setCharacteristics((current) => ({
    ...current,
    [key]: [...current[key], value],
  }));

  setCharacteristicInputs((current) => ({
    ...current,
    [key]: "",
  }));
}


  function removeCharacteristic(
    key: CharacteristicKey,
    index: number
  ) {
    updateCharacteristic(
      key,
      characteristics[key].filter((_, i) => i !== index)
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!original || saving) return;

    setError(null);

    try {
      if (!form.name.trim()) {
        throw new Error("Informe o nome do produto.");
      }

      for (const field of [
        "minimumQuantity",
        "shelfLifeDays",
        "productionLeadTimeMinDays",
        "productionLeadTimeMaxDays",
      ] as const) {
        const value = form[field];

        const minimum =
          field === "productionLeadTimeMinDays" ||
          field === "productionLeadTimeMaxDays"
            ? 0
            : 1;

        if (
          value !== "" &&
          (!Number.isInteger(num(value)) ||
            num(value) < minimum)
        ) {
          throw new Error(`Valor inválido para ${field}.`);
        }
      }

      if (
        form.productionLeadTimeMinDays !== "" &&
        form.productionLeadTimeMaxDays !== "" &&
        num(form.productionLeadTimeMaxDays) <
          num(form.productionLeadTimeMinDays)
      ) {
        throw new Error(
          "O prazo máximo não pode ser inferior ao mínimo."
        );
      }

      if (
        form.pricingType === "FIXED" &&
        prices.length !== 1
      ) {
        throw new Error(
          "Preço fixo exige exatamente uma faixa."
        );
      }

      if (
        form.pricingType === "TIERED" &&
        prices.length === 0
      ) {
        throw new Error(
          "Preço por faixas exige pelo menos uma faixa."
        );
      }

      if (
        form.pricingType === "QUOTE" &&
        prices.length !== 0
      ) {
        throw new Error(
          "Produtos sob orçamento não devem possuir faixas."
        );
      }

      if (
        form.pricingType !== "QUOTE" &&
        form.minimumQuantity === ""
      ) {
        throw new Error(
          "Informe a quantidade mínima do produto."
        );
      }

      const quantities = new Set<number>();

      for (const price of prices) {
        if (
          price.minimumQuantity.trim() === "" ||
          !Number.isInteger(num(price.minimumQuantity)) ||
          num(price.minimumQuantity) <= 0
        ) {
          throw new Error("Quantidade da faixa inválida.");
        }

        if (
          price.unitPrice.trim() === "" ||
          !Number.isFinite(num(price.unitPrice)) ||
          num(price.unitPrice) <= 0
        ) {
          throw new Error(
            "Preço unitário deve ser maior que zero."
          );
        }

        if (quantities.has(num(price.minimumQuantity))) {
          throw new Error(
            "Existem faixas com quantidades mínimas duplicadas."
          );
        }

        quantities.add(num(price.minimumQuantity));
      }

      if (
        prices.length &&
        Math.min(
          ...prices.map((price) =>
            num(price.minimumQuantity)
          )
        ) !== optionalNumber(form.minimumQuantity)
      ) {
        throw new Error(
          "A menor faixa deve corresponder à quantidade mínima do produto."
        );
      }

      for (const fee of fees) {
        if (!fee.name.trim()) {
          throw new Error("Informe o nome da taxa.");
        }

        if (
          fee.amount.trim() === "" ||
          !Number.isFinite(num(fee.amount)) ||
          num(fee.amount) < 0
        ) {
          throw new Error("Valor da taxa inválido.");
        }
      }

      const body: Record<string, unknown> = {};

      const scalarFields = [
        "name",
        "category",
        "description",
        "pricingType",
        "active",
      ] as const;

      for (const field of scalarFields) {
        const value =
          field === "description"
            ? form.description.trim() || null
            : form[field];

        if (value !== original[field]) {
          body[field] = value;
        }
      }

      const numberFields = [
        "minimumQuantity",
        "shelfLifeDays",
        "productionLeadTimeMinDays",
        "productionLeadTimeMaxDays",
      ] as const;

      for (const field of numberFields) {
        const value = optionalNumber(form[field]);

        if (value !== original[field]) {
          body[field] = value;
        }
      }

      const originalPrices = new Map(
        original.prices.map((price) => [price.id, price])
      );

      const originalFees = new Map(
        original.fees.map((fee) => [fee.id, fee])
      );

      const updatedPrices = prices
        .filter((price) => price.id)
        .flatMap((price) => {
          const before = originalPrices.get(price.id!);

          if (!before) return [];

          const patch: Record<string, unknown> = {
            id: price.id,
          };

          if (
            num(price.minimumQuantity) !==
            before.minimumQuantity
          ) {
            patch.minimumQuantity = num(
              price.minimumQuantity
            );
          }

          if (
            num(price.unitPrice) !==
            Number(before.unitPrice)
          ) {
            patch.unitPrice = num(price.unitPrice);
          }

          return Object.keys(patch).length > 1
            ? [patch]
            : [];
        });

      const addedPrices = prices
        .filter((price) => !price.id)
        .map((price) => ({
          minimumQuantity: num(price.minimumQuantity),
          unitPrice: num(price.unitPrice),
        }));

      const removedPrices = original.prices
        .filter(
          (price) =>
            !prices.some((row) => row.id === price.id)
        )
        .map((price) => price.id);

      const updatedFees = fees
        .filter((fee) => fee.id)
        .flatMap((fee) => {
          const before = originalFees.get(fee.id!);

          if (!before) return [];

          const patch: Record<string, unknown> = {
            id: fee.id,
          };

          if (fee.name !== before.name) {
            patch.name = fee.name;
          }

          if (
            num(fee.amount) !== Number(before.amount)
          ) {
            patch.amount = num(fee.amount);
          }

          if (fee.chargeType !== before.chargeType) {
            patch.chargeType = fee.chargeType;
          }

          if (fee.required !== before.required) {
            patch.required = fee.required;
          }

          if (fee.active !== before.active) {
            patch.active = fee.active;
          }

          return Object.keys(patch).length > 1
            ? [patch]
            : [];
        });

      const addedFees = fees
        .filter((fee) => !fee.id)
        .map((fee) => ({
          name: fee.name,
          amount: num(fee.amount),
          chargeType: fee.chargeType,
          required: fee.required,
          active: fee.active,
        }));

      const removedFees = original.fees
        .filter(
          (fee) =>
            !fees.some((row) => row.id === fee.id)
        )
        .map((fee) => fee.id);

      if (updatedPrices.length) {
        body.prices = updatedPrices;
      }

      if (addedPrices.length) {
        body.addPrices = addedPrices;
      }

      if (removedPrices.length) {
        body.removePriceIds = removedPrices;
      }

      if (updatedFees.length) {
        body.fees = updatedFees;
      }

      if (addedFees.length) {
        body.addFees = addedFees;
      }

      if (removedFees.length) {
        body.removeFeeIds = removedFees;
      }

      for (const { key } of characteristicGroups) {
        const values = characteristics[key]
          .map((value) => value.trim())
          .filter(Boolean);

        const previous = original[key] ?? [];

        if (
          JSON.stringify(values) !==
          JSON.stringify(previous)
        ) {
          body[key] = values;
        }
      }

      if (!Object.keys(body).length) {
        router.push(
          `/produtos/${encodeURIComponent(id)}`
        );
        return;
      }

      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error(
          "Sessão não encontrada. Faça login novamente."
        );
      }

      setSaving(true);

      await api.patch(
        `/products/${encodeURIComponent(id)}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push(
        `/produtos/${encodeURIComponent(id)}`
      );
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
        
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#342d27]">
            Editar produto
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            {original && `Código ${original.code} · ${original.name}`}
          </p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Link
              href={`/produtos/${encodeURIComponent(id)}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#a67c43] transition-colors hover:text-[#6b5138]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao produto
            </Link>

            <button
              type="submit"
              form="edit-product-form"
              disabled={saving || loading || !original}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>


        {loading ? (
          <p className="text-sm text-stone-500">
            Carregando produto...
          </p>
        ) : !original ? (
          <p className="text-sm text-red-700">
            {error ?? "Produto não encontrado."}
          </p>
        ) : (
          <form
            onSubmit={save}
            className="space-y-6"
          >
            {/* INFORMAÇÕES GERAIS */}

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold text-[#342d27]">
                Informações gerais
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className={labelClass}>Nome</span>
                  <input
                    required
                    maxLength={150}
                    className={inputClass}
                    value={form.name}
                    onChange={(e) =>
                      updateForm("name", e.target.value)
                    }
                  />
                </label>

                <label>
                  <span className={labelClass}>
                    Categoria
                  </span>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) =>
                      updateForm("category", e.target.value)
                    }
                  >
                    {Array.from(
                      new Set([form.category, ...categories])
                    )
                      .filter(Boolean)
                      .map((category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className={labelClass}>
                    Descrição
                  </span>
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={form.description}
                    onChange={(e) =>
                      updateForm(
                        "description",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span className={labelClass}>
                    Tipo de precificação
                  </span>
                  <select
                    className={inputClass}
                    value={form.pricingType}
                    onChange={(e) =>
                      updateForm(
                        "pricingType",
                        e.target.value
                      )
                    }
                  >
                    <option value="TIERED">
                      Por quantidade
                    </option>
                    <option value="FIXED">
                      Preço fixo
                    </option>
                    <option value="QUOTE">
                      Sob orçamento
                    </option>
                  </select>
                </label>

                <label>
                  <span className={labelClass}>
                    Qtd mínima
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className={inputClass}
                    value={form.minimumQuantity}
                    onChange={(e) =>
                      updateForm(
                        "minimumQuantity",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span className={labelClass}>
                    Prazo mínimo de produção (dias)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={inputClass}
                    value={
                      form.productionLeadTimeMinDays
                    }
                    onChange={(e) =>
                      updateForm(
                        "productionLeadTimeMinDays",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span className={labelClass}>
                    Prazo máximo de produção (dias)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={inputClass}
                    value={
                      form.productionLeadTimeMaxDays
                    }
                    onChange={(e) =>
                      updateForm(
                        "productionLeadTimeMaxDays",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span className={labelClass}>
                    Validade (dias)
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className={inputClass}
                    value={form.shelfLifeDays}
                    onChange={(e) =>
                      updateForm(
                        "shelfLifeDays",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="flex items-center gap-2 pt-6 text-sm text-[#342d27]">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      updateForm(
                        "active",
                        e.target.checked
                      )
                    }
                  />
                  Produto ativo
                </label>
              </div>
            </section>

            {/* FAIXAS DE PREÇO */}

            <section className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#342d27]">
                  Faixas de preço
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setPrices((current) => [
                      ...current,
                      {
                        key: newKey(),
                        minimumQuantity: "",
                        unitPrice: "",
                      },
                    ])
                  }
                  className={addButtonClass}
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
                    <span className={labelClass}>
                      Qtd mínima
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      required
                      className={inputClass}
                      value={price.minimumQuantity}
                      onChange={(e) =>
                        updatePrice(price.key, {
                          minimumQuantity:
                            e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    <span className={labelClass}>
                      Preço unitário (R$)
                    </span>
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
                      setPrices((current) =>
                        current.filter(
                          (item) =>
                            item.key !== price.key
                        )
                      )
                    }
                    className={deleteButtonClass}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </section>

            {/* CARACTERÍSTICAS DO PRODUTO */}

            
                <section className={sectionClass}>
                  <h2 className="font-serif text-xl text-[#342d27]">
                    Características
                  </h2>

                  <div className="grid gap-5 md:grid-cols-2">
                    {characteristicGroups.map(({ key, label, placeholder }) => (
                      <div key={key} className="min-w-0">
                        <label className={labelClass}>{label}</label>

                        <div className="flex gap-2">
                          <input
                            className={inputClass}
                            placeholder={placeholder}
                            value={characteristicInputs[key]}
                            onChange={(e) =>
                              setCharacteristicInputs((current) => ({
                                ...current,
                                [key]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCharacteristic(key);
                              }
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => addCharacteristic(key)}
                            aria-label={`Adicionar ${label.toLowerCase()}`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#e2d7c9] px-3 text-sm text-[#946f3d] hover:bg-[#faf7f2]"
                          >
                            <Plus size={16} />
                            Add
                          </button>
                        </div>

                        {characteristics[key].length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {characteristics[key].map((value, index) => {
                              const color =
                                key === "colors" ? getColor(value) : null;

                              const isWhite =
                                ["branco", "branca"].includes(
                                  value.trim().toLowerCase()
                                );

                              return (
                                <span
                                  key={`${key}-${index}`}
                                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
                                  style={{
                                    backgroundColor: color ?? "#faf8f5",
                                    color: color
                                      ? isWhite
                                        ? "#000000"
                                        : "#FFFFFF"
                                      : "#342d27",
                                    borderColor: "#e6ded2",
                                  }}
                                >
                                  {value}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeCharacteristic(key, index)
                                    }
                                    aria-label={`Remover ${value}`}
                                    className="text-[#a66b55] hover:text-red-700"
                                  >
                                    <Trash2
                                      size={14}
                                      className={
                                        color
                                          ? isWhite
                                            ? "text-black hover:text-red-700"
                                            : "text-white hover:text-red-200"
                                          : "text-[#a66b55] hover:text-red-700"
                                      }
                                    />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>


            {/* TAXAS ADICIONAIS */}

            <section className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#342d27]">
                  Taxas adicionais
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setFees((current) => [
                      ...current,
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
                  className={addButtonClass}
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
                        setFees((current) =>
                          current.filter(
                            (item) =>
                              item.key !== fee.key
                          )
                        )
                      }
                      className={deleteButtonClass}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label>
                      <span className={labelClass}>
                        Nome
                      </span>
                      <input
                        required
                        className={inputClass}
                        value={fee.name}
                        onChange={(e) =>
                          updateFee(fee.key, {
                            name: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      <span className={labelClass}>
                        Valor
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        className={inputClass}
                        value={fee.amount}
                        onChange={(e) =>
                          updateFee(fee.key, {
                            amount: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      <span className={labelClass}>
                        Tipo de cobrança
                      </span>
                      <select
                        className={inputClass}
                        value={fee.chargeType}
                        onChange={(e) =>
                          updateFee(fee.key, {
                            chargeType:
                              e.target.value,
                          })
                        }
                      >
                        {chargeTypes.map((type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type === "FIXED"
                              ? "Valor fixo"
                              : type === "PERCENTAGE"
                                ? "Percentual"
                                : "Por unidade"}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={fee.required}
                        onChange={(e) =>
                          updateFee(fee.key, {
                            required:
                              e.target.checked,
                          })
                        }
                      />
                      Obrigatória
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={fee.active}
                        onChange={(e) =>
                          updateFee(fee.key, {
                            active: e.target.checked,
                          })
                        }
                      />
                      Ativa
                    </label>
                  </div>
                </div>
              ))}
            </section>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Link
                href={`/produtos/${encodeURIComponent(id)}`}
                className="rounded-xl border border-[#e8e1d7] px-5 py-3 text-sm font-semibold text-[#342d27]"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Salvando..."
                  : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EditProductPage() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-stone-500">
          Carregando...
        </p>
      }
    >
      <EditProductContent />
    </Suspense>
  );
}
