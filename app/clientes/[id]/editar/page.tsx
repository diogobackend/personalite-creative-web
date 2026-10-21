"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Save, UserRound } from "lucide-react";
import DashboardLayout from "../../../../src/components/layout/DashboardLayout";
import { api } from "../../../../src/lib/api";

type Client = {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  cpf: string | null;
  rg: string | null;
  birthDate: string | null;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  cpf: string;
  rg: string;
  birthDate: string;
};

const generatedEmail = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}@gmail\.com$/i;
const inputClass = "w-full min-w-0 rounded-xl border border-[#e8e0d4] bg-white px-3 py-2.5 text-sm font-normal text-[#342d27] outline-none transition focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";
const emptyForm: FormData = { name: "", email: "", phone: "", address: "", cpf: "", rg: "", birthDate: "" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-stone-600">{label}{children}</label>;
}

function getError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Sessão expirada ou inválida. Faça login novamente.";
    if (error.response?.status === 403) return "Você não possui permissão para editar este cliente.";
    if (error.response?.status === 404) return "Cliente não encontrado.";
    if (!error.response) return "Não foi possível conectar ao servidor.";
    return typeof error.response.data?.message === "string" ? error.response.data.message : `Erro HTTP ${error.response.status}.`;
  }
  return error instanceof Error ? error.message : "Erro inesperado.";
}

function EditClientContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        if (controller.signal.aborted) return;
        setClient(data);
        setForm({
          name: data.name ?? "",
          email: data.email && !generatedEmail.test(data.email) ? data.email : "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          cpf: data.cpf ?? "",
          rg: data.rg ?? "",
          birthDate: data.birthDate ?? "",
        });
      } catch (cause) {
        if (!controller.signal.aborted) setError(getError(cause));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id]);

  function update(field: keyof FormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || saving) return;
    if (!form.name.trim()) {
      setError("Informe o nome completo.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token || token === "undefined" || token === "null") throw new Error("Sessão não encontrada. Faça login novamente.");
      const payload: Record<string, string | null> = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };
      const email = form.email.trim();
      if (email) payload.email = email;
      if (client.email && !generatedEmail.test(client.email) && !email) payload.email = client.email;
      if (client.cpf == null && form.cpf.trim()) payload.cpf = form.cpf.trim();
      if (client.rg == null && form.rg.trim()) payload.rg = form.rg.trim();
      if (client.birthDate == null && form.birthDate) payload.birthDate = form.birthDate;

      await api.patch(`/users/${encodeURIComponent(id)}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push(`/clientes/${encodeURIComponent(id)}`);
      router.refresh();
    } catch (cause) {
      setError(getError(cause));
    } finally {
      setSaving(false);
    }
  }

  return <DashboardLayout>
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <Link href={`/clientes/${encodeURIComponent(id)}`} className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-[#a98a58]">
          <ArrowLeft className="h-4 w-4" /> Voltar aos dados do cliente
        </Link>
        <h1 className="mt-4 font-serif text-3xl text-[#342d27] sm:text-4xl">Editar cliente</h1>
      </div>
    </div>
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
      {loading ? <p className="px-6 py-16 text-center text-sm text-stone-500">Carregando dados do cliente...</p>
      : !client ? <p className="px-6 py-16 text-center text-sm font-medium text-red-700">{error ?? "Cliente não encontrado."}</p>
      : <form onSubmit={save} className="space-y-7 p-5 sm:p-7">
        <div className="flex items-center gap-3 border-b border-[#f0ece5] pb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7f0e6] text-[#a98a58]"><UserRound className="h-6 w-6" /></span>
          <div><h2 className="text-lg font-semibold text-[#342d27]">Dados cadastrais</h2></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Nome completo"><input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={150} required autoComplete="name" /></Field></div>
          <Field label="E-mail"><input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={255} placeholder="E-mail do cliente" autoComplete="email" /></Field>
          <Field label="Telefone"><input type="tel" className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={30} placeholder="Telefone do cliente" autoComplete="tel" /></Field>
          <div className="sm:col-span-2"><Field label="Endereço"><input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} maxLength={500} placeholder="Endereço completo" autoComplete="street-address" /></Field></div>
          {client.cpf == null && <Field label="CPF"><input className={inputClass} value={form.cpf} onChange={(e) => update("cpf", e.target.value)} maxLength={14} placeholder="CPF" inputMode="numeric" /></Field>}
          {client.rg == null && <Field label="RG"><input className={inputClass} value={form.rg} onChange={(e) => update("rg", e.target.value)} maxLength={20} placeholder="RG" /></Field>}
          {client.birthDate == null && <Field label="Data de nascimento"><input type="date" className={inputClass} value={form.birthDate} onChange={(e) => update("birthDate", e.target.value)} /></Field>}
        </div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-[#f0ece5] pt-6">
          <Link href={`/clientes/${encodeURIComponent(id)}`} className="inline-flex items-center justify-center rounded-xl border border-[#e8e0d4] px-5 py-3 text-sm font-semibold text-stone-600 hover:bg-[#faf8f4]">Cancelar</Link>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>}
    </section>
  </DashboardLayout>;
}

export default function EditClientPage() {
  return <Suspense fallback={null}><EditClientContent /></Suspense>;
}
