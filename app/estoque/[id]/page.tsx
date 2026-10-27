"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Boxes, Pencil, RefreshCw } from "lucide-react";

import { api } from "../../../src/lib/api";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";

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

const CATEGORIES: Record<string, string> = {
  GOURMET: "Gourmet", AGUAS: "Águas", GARRAFAS: "Garrafas", GLOSS: "Gloss",
  BOLSAS: "Bolsas", NECESSAIRES: "Necessaires", LENCOS: "Lenços",
  PAPELARIA: "Papelaria", CAIXAS: "Caixas", KITS: "Kits",
};

const UNITS: Record<string, string> = {
  UN: "Unidade (un)", PAR: "Par", KIT: "Kit", CX: "Caixa", PCT: "Pacote",
  DZ: "Dúzia", M: "Metro (m)", CM: "Centímetro (cm)", M2: "Metro quadrado (m²)",
  KG: "Quilograma (kg)", G: "Grama (g)", L: "Litro (L)", ML: "Mililitro (mL)",
  ROLO: "Rolo", FOLHA: "Folha",
};

function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-[#81766b]">{label}</dt>
      <dd className="mt-2 break-words text-sm font-medium text-[#342d27]">{display(value)}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-6 border-b border-[#f0ece5] pb-4 text-lg font-semibold text-[#342d27]">{title}</h2>
      <dl className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  );
}

function VisualizarEstoqueContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [item, setItem] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") {
          throw new Error("Sessão inválida. Faça login novamente.");
        }
        if (!id) throw new Error("Identificador do item inválido.");

        const { data } = await api.get<Inventory>(`/inventory/${encodeURIComponent(id)}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!controller.signal.aborted) setItem(data);
      } catch (cause) {
        if (controller.signal.aborted || axios.isCancel(cause)) return;
        setItem(null);
        if (axios.isAxiosError(cause)) {
          if (cause.response?.status === 404) setError("Item do estoque não encontrado.");
          else if (cause.response?.status === 401) setError("Sua sessão expirou. Faça login novamente.");
          else if (cause.response?.status === 403) setError("Você não possui permissão para consultar este item.");
          else setError(cause.response?.data?.message || "Não foi possível consultar o item.");
        } else {
          setError(cause instanceof Error ? cause.message : "Não foi possível consultar o item.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void fetchItem();
    return () => controller.abort();
  }, [id, reloadKey]);

  const lowStock = item && item.minimumQuantity !== null && item.quantity <= item.minimumQuantity;

  return (
    <DashboardLayout>
      <main className="space-y-6 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/estoque" className="inline-flex items-center gap-2 text-sm font-medium text-[#927448] hover:underline">
              <ArrowLeft size={17} /> Voltar ao estoque
            </Link>
          </div>
          {item && !loading && (
            <Link href={`/estoque/${item.id}/editar`} className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#927448]">
              <Pencil size={17} /> Editar item
            </Link>
          )}
        </div>

        {loading ? (
          <section className="rounded-2xl border border-[#ece6dc] bg-white px-6 py-16 text-center text-sm text-[#81766b]">Carregando item...</section>
        ) : error ? (
          <section className="rounded-2xl border border-[#ece6dc] bg-white px-6 py-14 text-center">
            <Boxes size={38} className="mx-auto mb-4 text-[#cbb58e]" />
            <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#927448] hover:underline">
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </section>
        ) : item ? (
          <>
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
              <div className="min-w-0">
                <h2 className="break-words font-serif text-2xl text-[#342d27]">{item.name} </h2>
                <p className="mt-1 text-sm text-[#81766b]">Categoria: {display(item.category)}</p>
                <p className="mt-1 text-sm text-[#81766b]">SKU: {display(item.sku)}</p>
              </div>
              {lowStock && <span className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">Estoque baixo</span>}
            </section>

            <Section title="Descrição">
              {item.description}
            </Section>

            <Section title="Controle de estoque">
              <Detail label="Qtd disponível" value={item.quantity} />
              <Detail label="Qtd mínima p/ alertar" value={item.minimumQuantity} />
              <Detail label="Unidade de medida" value={item.unit ? UNITS[item.unit] ?? item.unit : null} />
            </Section>

            <Section title="Detalhes do item">
              <Detail label="Cor" value={item.color} />
              <Detail label="Tamanho" value={item.size} />
              <Detail label="Material" value={item.material} />
              <Detail label="Marca" value={item.brand} />
              <Detail label="Modelo" value={item.model} />
            </Section>

            <Section title="Registro">
              <Detail label="Data de cadastro" value={formatDate(item.createdAt)} />
              <Detail label="Última atualização" value={formatDate(item.updatedAt)} />
            </Section>
          </>
        ) : null}
      </main>
    </DashboardLayout>
  );
}

export default function VisualizarEstoquePage() {
  return (
    <Suspense fallback={<div>Carregando item...</div>}>
      <VisualizarEstoqueContent />
    </Suspense>
  );
}
