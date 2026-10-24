
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { api } from "../../../src/lib/api";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Layers3,
  Package,
  Pencil,
  ReceiptText,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";

type ExpenseCategory =
  | "TRANSPORT"
  | "PRODUCTION"
  | "INVESTMENT"
  | "BILLS"
  | "MARKETING"
  | "PACKAGING"
  | "EQUIPMENT"
  | "STOCK"
  | "OTHER";

type ExpenseAllocationType =
  | "GENERAL"
  | "SPECIFIC_PRODUCT"
  | "CATEGORY_PRODUCTS";

type ExpenseStatus = "PENDING" | "PAID" | "CANCELLED";

type ExpenseProduct = {
  productId: string;
  allocatedValue: number;
};

type Expense = {
  id: string;
  name: string;
  description: string | null;
  value: number;
  category: ExpenseCategory;
  allocationType: ExpenseAllocationType;
  status: ExpenseStatus;
  quantity: number | null;
  products: ExpenseProduct[];
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  id: string;
  name: string;
  category?: string;
};

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TRANSPORT: "Transporte",
  PRODUCTION: "Produção",
  INVESTMENT: "Investimento",
  BILLS: "Contas",
  MARKETING: "Marketing",
  PACKAGING: "Embalagens",
  EQUIPMENT: "Equipamentos",
  STOCK: "Estoque",
  OTHER: "Outros",
};

const ALLOCATION_LABELS: Record<ExpenseAllocationType, string> = {
  GENERAL: "Geral",
  SPECIFIC_PRODUCT: "Produto",
  CATEGORY_PRODUCTS: "Categoria de produtos",
};

const STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};

const STATUS_STYLES: Record<ExpenseStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = value.split("T")[0];
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) return "—";

  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-[#94887b]">
        {label}
      </p>
      <div className="text-sm font-medium text-[#342d27]">
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#eee8df] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3 border-b border-[#f0ebe5] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5efe6] text-[#927448]">
          <Icon size={19} />
        </div>

        <h2 className="text-lg font-semibold text-[#342d27]">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function ExpenseDetailsContent() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadExpense() {
      try {
        setLoading(true);
        setError(null);

        const token = getAccessToken();
        if (!token) {
          setError("Sessão não encontrada. Faça login novamente.");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const expenseResponse = await api.get<Expense>(
          `/expenses/${encodeURIComponent(id)}`,
          { headers }
        );

        if (!active) return;

        const expenseData = expenseResponse.data;

        setExpense(expenseData);

        if (expenseData.products?.length) {
          try {
            const productsResponse = await api.get<{
              content: Product[];
            }>("/products", {
              headers,
              params: {
                page: 0,
                size: 100,
              },
            });

            if (!active) return;

            const productMap = Object.fromEntries(
              productsResponse.data.content.map((product) => [
                product.id,
                product,
              ])
            );

            setProducts(productMap);
          } catch {
            // Mantém a despesa visível caso a busca
            // dos produtos falhe.
          }
        }
      } catch (err) {
        if (!active) return;

        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("Despesa não encontrada.");
        } else if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            setError("Sessão inválida ou sem permissão. Faça login novamente.");
          } else if (status) {
            setError(`Não foi possível carregar a despesa (HTTP ${status}).`);
          } else {
            setError("Falha de conexão com a API. Verifique a URL e o CORS.");
          }
          console.error("Erro ao buscar despesa:", err);
        } else {
          setError("Não foi possível carregar os dados da despesa.");
          console.error("Erro ao buscar despesa:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadExpense();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8f5]">
        <p className="text-sm text-[#81766b]">
          Carregando dados da despesa...
        </p>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 bg-[#faf8f5]">
        <ReceiptText size={40} className="text-[#b9a58a]" />

        <p className="text-[#51473d]">
          {error ?? "Despesa não encontrada."}
        </p>

        <button
          type="button"
          onClick={() => router.push("/despesas")}
          className="rounded-xl bg-[#927448] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7d623d]"
        >
          Voltar para despesas
        </button>
      </div>
    );
  }

  return (
    <main className="bg-[#faf8f5] px-2 py-5 sm:px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/despesas")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#927448] transition hover:text-[#735a36]"
            >
              <ArrowLeft size={16} />
              Voltar para despesas
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(`/despesas/${expense.id}/editar`)
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#927448] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7d623d]"
          >
            <Pencil size={16} />
            Editar despesa
          </button>
        </div>

        <div className="rounded-2xl border border-[#e8dfd2] bg-[#f4ede2] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="mt-2 text-xl font-bold text-[#342d27]">
                {expense.name}
              </h2>

              <p className="mt-2 text-sm text-[#81766b]">
                {CATEGORY_LABELS[expense.category]}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                STATUS_STYLES[expense.status]
              }`}
            >
              {STATUS_LABELS[expense.status]}
            </span>
          </div>

          <div className="mt-6 border-t border-[#e4d8c7] pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#927448]">
              Valor total
            </p>

            <p className="mt-2 text-3xl font-bold text-[#342d27]">
              {formatCurrency(expense.value)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Informações gerais" icon={FileText}>
            <div className="grid gap-6 sm:grid-cols-2">
              <DetailField
                label="Quantidade"
                value={
                  expense.category === "STOCK"
                    ? (expense.quantity ?? "—")
                    : "N/A"
                }
              />

              <div className="sm:col-span-2">
                <DetailField
                  label="Descrição"
                  value={
                    expense.description?.trim() || "Sem descrição"
                  }
                />
              </div>
            </div>
          </Section>

          <Section title="Datas e registros" icon={CalendarDays}>
            <div className="grid gap-6 sm:grid-cols-2">
              <DetailField
                label="Data da despesa"
                value={formatDate(expense.expenseDate)}
              />

              <DetailField
                label="Data de cadastro"
                value={formatDateTime(expense.createdAt)}
              />

              <DetailField
                label="Última atualização"
                value={formatDateTime(expense.updatedAt)}
              />
            </div>
          </Section>
        </div>

        <Section title="Alocação" icon={Layers3}>
          

          {expense.allocationType === "GENERAL" && (
            <div className="mt-6 rounded-xl bg-[#faf8f5] p-4">
              <p className="text-sm text-[#81766b]">
                Esta despesa é geral e não possui produtos vinculados.
              </p>
            </div>
          )}

          {expense.allocationType !== "GENERAL" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Package
                  size={17}
                  className="text-[#927448]"
                />

                <h3 className="text-sm font-semibold text-[#342d27]">
                  Produtos vinculados (
                  {expense.products?.length ?? 0})
                </h3>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#eee8df]">
                <div className="grid grid-cols-[1fr_auto] gap-4 bg-[#faf8f5] px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#81766b]">
                  <span>Produto</span>
                  <span>Valor alocado</span>
                </div>

                {expense.products?.map((item) => (
                  <div
                    key={item.productId}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-[#eee8df] px-5 py-4"
                  >
                    
                      <Link
                        href={`/produtos/${encodeURIComponent(item.productId)}`}
                        className="text-sm font-semibold text-[#342d27] hover:text-[#a98a58] hover:underline"
                        >
                        {products[item.productId]?.name ?? `Produto ${item.productId}`}
                        </Link>

                    <p className="text-sm font-semibold text-[#342d27]">
                      {formatCurrency(item.allocatedValue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}

export default function ExpenseDetailsPage() {
  return (
    <DashboardLayout>
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8f5]">
          <p className="text-sm text-[#81766b]">
            Carregando despesa...
          </p>
        </div>
      }
    >
      <ExpenseDetailsContent />
    </Suspense>
    </DashboardLayout>
  );
}
