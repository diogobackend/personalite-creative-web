"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Pencil, UserRound } from "lucide-react";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";
import { api } from "../../../src/lib/api";

type Client = {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  rg: string | null;
  address: string | null;
  birthDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const uuidEmail = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}@gmail\.com$/i;
const display = (value: string | null | undefined) => value?.trim() || "—";
function date(value: string | null | undefined) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}
function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[#eee8df] bg-[#fdfcfb] px-4 py-4">
    <dt className="mb-2 text-xs font-semibold text-stone-500">{label}</dt>
    <dd className="break-words text-sm font-medium text-[#342d27]">{value}</dd>
  </div>;
}
function ClientDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token || token === "undefined" || token === "null") throw new Error("Sessão não encontrada. Faça login novamente.");
        const { data } = await api.get<Client>("/users/id", {
            params: { userId: id },
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
            });
        if (!controller.signal.aborted) setClient(data);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setClient(null);
        if (axios.isAxiosError(cause)) {
          if (cause.response?.status === 404) setError("Cliente não encontrado.");
          else if (cause.response?.status === 401) setError("Sessão expirada ou inválida. Faça login novamente.");
          else if (cause.response?.status === 403) setError("Você não possui permissão para visualizar este cliente.");
          else setError(cause.response?.data?.message || "Não foi possível carregar o cliente.");
        } else setError(cause instanceof Error ? cause.message : "Erro inesperado.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [id]);

  return <DashboardLayout>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link href="/clientes" className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-[#a98a58]">
          <ArrowLeft className="h-4 w-4" /> Voltar para clientes
        </Link>
      </div>
      {client && !loading && <Link href={`/clientes/${encodeURIComponent(id)}/editar`} className="inline-flex items-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#927448]">
        <Pencil className="h-4 w-4" /> Editar cliente
      </Link>}
    </div>
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
      {loading ? <p className="px-6 py-16 text-center text-sm text-stone-500">Carregando dados do cliente...</p>
      : error ? <p className="px-6 py-16 text-center text-sm font-medium text-red-700">{error}</p>
      : client ? <div className="space-y-8 p-5 sm:p-7">
        <div className="flex items-center gap-3 border-b border-[#f0ece5] pb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7f0e6] text-[#a98a58]"><UserRound className="h-6 w-6" /></span>
          <h2 className="text-lg font-semibold text-[#342d27]">{client.name}</h2>
        </div>
        <div><h3 className="mb-4 text-sm font-semibold">Dados pessoais</h3>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="CPF" value={display(client.cpf)} />
            <Detail label="RG" value={display(client.rg)} />
            <Detail label="Data de nascimento" value={date(client.birthDate)} />
          </dl>
        </div>
        <div><h3 className="mb-4 text-sm font-semibold">Contato</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="E-mail" value={client.email && !uuidEmail.test(client.email) ? client.email : "—"} />
            <Detail label="Telefone" value={display(client.phone)} />
          </dl>
        </div>
        <div><h3 className="mb-4 text-sm font-semibold">Endereço</h3><dl><Detail label="Endereço cadastrado" value={display(client.address)} /></dl></div>
        <div><h3 className="mb-4 text-sm font-semibold">Informações do cadastro</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Data de cadastro" value={date(client.createdAt)} />
            <Detail label="Última atualização" value={date(client.updatedAt)} />
          </dl>
        </div>
      </div> : null}
    </section>
  </DashboardLayout>;
}

export default function ClientDetailsPage() {
  return (
    <Suspense fallback={null}>
      <ClientDetailsContent />
    </Suspense>
  );
}
