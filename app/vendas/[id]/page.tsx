
"use client";

import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  Package,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { api } from "../../../src/lib/api";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";

type SaleItem = {
  id: string;
  productId: string;
  inventoryId: string | null;
  quantity: number;
  color: string | null;
  brand: string | null;
  model: string | null;
  size: string | null;
  material: string | null;
};

type Sale = {
  id: string;
  customerId: string;
  deliveryDeadline: string | null;
  totalAmount: number;
  downPaymentPercentage: number;
  downPaymentAmount: number;
  paidPercentage: number;
  paidAmount: number;
  remainingPercentage: number;
  remainingAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deadlineStatus: string;
  observation: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: string;
  name: string;
  rg?: string | null;
  email?: string | null;
  cpf?: string | null;
  phone?: string | null;
};

type Product = {
  id: string;
  name: string;
  code?: string | null;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BANK_TRANSFER: "Transferência bancária",
  BANK_SLIP: "Boleto",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Não pago",
  PARTIALLY_PAID: "Parcialmente pago",
  PAID: "Pago",
};

const DEADLINE_STATUS_LABELS: Record<string, string> = {
  NO_DEADLINE: "Sem prazo",
  OVERDUE: "Atrasado",
  DUE_TODAY: "Vence hoje",
  ON_TIME: "No prazo",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  UNPAID: "bg-red-50 text-red-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
};

function formatCurrency(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const [year, month, day] = value.split("T")[0].split("-");
  return year && month && day ? `${day}/${month}/${year}` : "—";
}

function formatDateTime(value: string | null | undefined): string {
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
      <div className="break-words text-sm font-medium text-[#342d27]">
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
        <h2 className="text-lg font-semibold text-[#342d27]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SaleDetailsContent() {
  const params = useParams();
  const id = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    async function loadSale() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Sessão não encontrada. Faça login novamente.");
          return;
        }

        const config = {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        };

        const saleResponse = await api.get<Sale>(
          `/sales/${encodeURIComponent(id)}`,
          config
        );

        if (controller.signal.aborted) return;

        const saleData = saleResponse.data;
        setSale(saleData);

        const [customersResult, productsResult] = await Promise.allSettled([
          api.get("/users", {
            ...config,
            params: { page: 0, size: 100 },
          }),
          api.get("/products", {
            ...config,
            params: { page: 0, size: 100 },
          }),
        ]);

        if (controller.signal.aborted) return;

        if (customersResult.status === "fulfilled") {
          const responseData =
            customersResult.value.data?.content ?? customersResult.value.data;

          const customers = (
            Array.isArray(responseData) ? responseData : []
          ) as Array<{
            userId?: string;
            id?: string;
            name: string;
            email?: string | null;
            cpf?: string | null;
            phone?: string | null;
            telephone?: string | null;
          }>;

          const matchedCustomer = customers.find(
            (entry) => (entry.userId ?? entry.id) === saleData.customerId
          );

          if (matchedCustomer) {
            setCustomer({
              id: matchedCustomer.userId ?? matchedCustomer.id ?? "",
              name: matchedCustomer.name,
              email: matchedCustomer.email,
              cpf: matchedCustomer.cpf,
              phone: matchedCustomer.phone ?? matchedCustomer.telephone,
            });
          }
        }

        if (productsResult.status === "fulfilled") {
          const responseData =
            productsResult.value.data?.content ?? productsResult.value.data;

          const entries = (
            Array.isArray(responseData) ? responseData : []
          ) as Product[];

          setProducts(
            Object.fromEntries(entries.map((product) => [product.id, product]))
          );
        }
      } catch (exception) {
        if (controller.signal.aborted || axios.isCancel(exception)) return;

        if (axios.isAxiosError(exception)) {
          const status = exception.response?.status;

          if (status === 404) {
            setError("Venda não encontrada.");
          } else if (status === 401 || status === 403) {
            setError("Sessão inválida ou sem permissão.");
          } else {
            setError("Não foi possível carregar os detalhes da venda.");
          }
        } else {
          setError("Ocorreu um erro inesperado ao consultar a venda.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSale();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8f5]">
        <p className="text-sm text-[#81766b]">Carregando venda...</p>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 bg-[#faf8f5]">
        <ReceiptText size={40} className="text-[#b9a58a]" />
        <p className="text-[#51473d]">{error ?? "Venda não encontrada."}</p>
        <Link
          href="/vendas"
          className="rounded-xl bg-[#927448] px-5 py-3 text-sm font-semibold text-white"
        >
          Voltar para vendas
        </Link>
      </div>
    );
  }

  return (
    <main className="bg-[#faf8f5] px-2 py-5 sm:px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/vendas"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#927448] hover:text-[#735a36]"
        >
          <ArrowLeft size={16} />
          Voltar para vendas
        </Link>

        <div className="rounded-2xl border border-[#e8dfd2] bg-[#f4ede2] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#927448]">
                Cliente
              </p>
              <h1 className="mt-2 font-serif text-2xl text-[#342d27] sm:text-3xl">
                {customer?.name ?? "Cliente não identificado"}
              </h1>
              <p className="mt-2 text-sm text-[#81766b]">
                Registrada em {formatDateTime(sale.createdAt)}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                PAYMENT_STATUS_STYLES[sale.paymentStatus] ??
                "bg-gray-100 text-gray-700"
              }`}
            >
              {PAYMENT_STATUS_LABELS[sale.paymentStatus] ??
                sale.paymentStatus}
            </span>
          </div>

          <div className="mt-6 border-t border-[#e4d8c7] pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#927448]">
              Valor total
            </p>
            <p className="mt-2 text-3xl font-bold text-[#342d27]">
              {formatCurrency(sale.totalAmount)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
                    
            {customer && (() => {
            const email = customer.email?.trim();

            const validEmail =
                email &&
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@/i.test(email)
                ? email
                : null;

            const fields = [
                { label: "CPF", value: customer.cpf?.trim() },
                { label: "RG", value: customer.rg?.trim() },
                { label: "Telefone", value: customer.phone?.trim() },
                { label: "E-mail", value: validEmail },
            ].filter((field) => field.value);

            if (fields.length === 0) return null;

            return (
                <Section title="Dados do comprador" icon={UserRound}>
                <div className="grid gap-6 sm:grid-cols-2">
                    {fields.map((field) => (
                    <DetailField
                        key={field.label}
                        label={field.label}
                        value={field.value}
                    />
                    ))}
                </div>
                </Section>
            );
            })()}


          <Section title="Entrega e registros" icon={CalendarDays}>
            <div className="grid gap-6 sm:grid-cols-2">
              {sale.deliveryDeadline && (
                <DetailField
                    label="Prazo de entrega"
                    value={formatDate(sale.deliveryDeadline)}
                />
                )}
              <DetailField
                label="Situação da entrega"
                value={
                  DEADLINE_STATUS_LABELS[sale.deadlineStatus] ??
                  sale.deadlineStatus
                }
              />
              <DetailField
                label="Última atualização"
                value={formatDateTime(sale.updatedAt)}
              />
            </div>
          </Section>
        </div>

        <Section title="Informações financeiras" icon={CreditCard}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField
              label={`Entrada (${sale.downPaymentPercentage}%)`}
              value={formatCurrency(sale.downPaymentAmount)}
            />
            <DetailField
              label={`Já pago (${sale.paidPercentage}%)`}
              value={formatCurrency(sale.paidAmount)}
            />
            <DetailField
              label={`Restante (${sale.remainingPercentage}%)`}
              value={formatCurrency(sale.remainingAmount)}
            />
            <DetailField
              label="Forma de pagamento"
              value={
                PAYMENT_METHOD_LABELS[sale.paymentMethod] ??
                sale.paymentMethod
              }
            />
            <DetailField
              label="Status do pagamento"
              value={
                PAYMENT_STATUS_LABELS[sale.paymentStatus] ??
                sale.paymentStatus
              }
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-full bg-[#eee8df]">
            <div
              className="h-3 rounded-full bg-[#a98a58] transition-all"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, Number(sale.paidPercentage) || 0)
                )}%`,
              }}
            />
          </div>
          <p className="mt-2 text-right text-xs text-[#81766b]">
            {sale.paidPercentage}% do valor pago
          </p>
        </Section>

        
            <Section title={`Produtos comprados (${sale.items.length})`} icon={Package}>
            {sale.items.length === 0 ? (
                <p className="text-sm text-[#81766b]">
                Nenhum produto vinculado.
                </p>
            ) : (
                <div className="space-y-4">
                {sale.items.map((item, index) => {
                    const product = products[item.productId];

                    const characteristics = [
                    ["Cor", item.color],
                    ["Tamanho", item.size],
                    ["Material", item.material],
                    ["Marca", item.brand],
                    ["Modelo", item.model],
                    ].filter(([, value]) => Boolean(value));

                    return (
                    <div
                        key={item.id ?? `${item.productId}-${index}`}
                        className={`rounded-xl border border-[#eee8df] p-5 transition-colors ${
                        index % 2 === 0
                            ? "bg-white"
                            : "bg-[#e9e4dc]"
                        }`}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                            href={`/produtos/${encodeURIComponent(item.productId)}`}
                            className="text-sm font-semibold text-[#342d27] transition-colors hover:text-[#927448] hover:underline"
                            >
                            {product?.name ?? `Produto ${index + 1}`}
                            </Link>
                            {product?.code && (
                            <span className="text-sm font-bold text-[#a98a58]">
                                {product.code}
                            </span>
                            )}
                        </div>

                        <span className="rounded-lg bg-[#f4ede2] px-3 py-2 text-sm font-semibold text-[#51473d]">
                            {item.quantity} un.
                        </span>
                        </div>

                        {characteristics.length > 0 && (
                        <div className="mt-5 grid gap-4 border-t border-[#e8e0d4] pt-4 sm:grid-cols-2 lg:grid-cols-3">
                            {characteristics.map(([label, value]) => (
                            <DetailField
                                key={label}
                                label={label ?? ""}
                                value={value ?? "—"}
                            />
                            ))}
                        </div>
                        )}
                    </div>
                    );
                })}
                </div>
            )}
            </Section>


        {sale.observation?.trim() && (
        <Section title="Observações" icon={FileText}>
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#51473d]">
            {sale.observation.trim()}
            </p>
        </Section>
        )}
      </div>
    </main>
  );
}

export default function SaleDetailsPage() {
  return (
    <DashboardLayout>
      <SaleDetailsContent />
    </DashboardLayout>
  );
}
