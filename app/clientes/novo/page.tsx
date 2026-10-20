"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Check, Loader2, Save, UserRound } from "lucide-react";
import DashboardLayout from "../../../src/components/layout/DashboardLayout";
import { api } from "../../../src/lib/api";

const DEFAULT_CREDENTIAL = "valorpadraocredencial";

interface ClientForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  rg: string;
  address: string;
  birthDate: string;
}

const initialForm: ClientForm = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  rg: "",
  address: "",
  birthDate: "",
};

type FormErrors = Partial<Record<keyof ClientForm, string>>;

const inputClass =
  "w-full rounded-xl border border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#342d27] outline-none transition placeholder:text-stone-400 focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";

function Field({
  label,
  htmlFor,
  optional = false,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-[#494139]">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function optionalValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function validate(form: ClientForm): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();

  if (!name) errors.name = "Informe o nome do cliente.";
  else if (name.length > 150) errors.name = "O nome deve ter no máximo 150 caracteres.";

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Informe um e-mail válido ou deixe em branco para gerar automaticamente.";
  } else if (email.length > 255) {
    errors.email = "O e-mail deve ter no máximo 255 caracteres.";
  }

  if (form.phone.trim().length > 30) errors.phone = "Máximo de 30 caracteres.";
  if (form.cpf.trim().length > 14) errors.cpf = "Máximo de 14 caracteres.";
  if (form.rg.trim().length > 20) errors.rg = "Máximo de 20 caracteres.";
  if (form.address.trim().length > 500) errors.address = "Máximo de 500 caracteres.";

  if (form.birthDate) {
    const today = new Date();
    const localToday = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    if (form.birthDate > localToday) errors.birthDate = "A data de nascimento não pode ser futura.";
  }

  return errors;
}

function getRequestError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const backendMessage = error.response?.data?.message;
    if (typeof backendMessage === "string" && backendMessage.trim()) {
      return backendMessage;
    }
    if (!error.response) return "Não foi possível conectar ao servidor.";
    if (error.response.status === 401) return "Sua sessão expirou. Faça login novamente.";
    if (error.response.status === 403) return "Você não possui permissão para cadastrar clientes.";
    return `Não foi possível cadastrar o cliente (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : "Erro inesperado ao cadastrar o cliente.";
}

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState<ClientForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [maxBirthDate, setMaxBirthDate] = useState("");

  useEffect(() => {
    const today = new Date();
    setMaxBirthDate([
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-"));
  }, []);

  const update = (key: keyof ClientForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const validation = validate(form);
    setErrors(validation);
    setRequestError(null);
    if (Object.keys(validation).length > 0) return;

    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined" || token === "null") {
      setRequestError("Sessão inválida. Faça login novamente.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || `${crypto.randomUUID()}@gmail.com`,
      login: `cli${crypto.randomUUID().replace(/-/g, "").toLowerCase()}`,
      password: DEFAULT_CREDENTIAL,
      phone: optionalValue(form.phone),
      cpf: optionalValue(form.cpf),
      rg: optionalValue(form.rg),
      address: optionalValue(form.address),
      birthDate: form.birthDate || null,
    };

    setSubmitting(true);
    try {
      await api.post("/users", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/clientes");
    } catch (error) {
      setRequestError(getRequestError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/clientes" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-[#a98a58]">
              <ArrowLeft className="h-4 w-4" /> Voltar para clientes já cadastrados
            </Link>
            <h1 className="mt-2 font-serif text-3xl text-[#302c29] sm:text-4xl">Novo cliente</h1>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-[#ece6dc] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#f0ece5] px-6 py-5 sm:px-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f0e6] text-[#a98a58]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="mt-1 text-xs text-stone-400">Informações pessoais e de contato</p>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
              <div className="sm:col-span-2">
                <Field
                    label="Nome"
                    htmlFor="name"
                    error={errors.name}
                >
                    <div className="relative">
                    <span className="absolute -top-[26px] left-[43px] text-xs font-normal text-stone-400">(Único campo obrigatório, os demais abaixo são opcionais)
                    </span>
                    <input
                        id="name"
                        className={inputClass}
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        maxLength={150}
                        placeholder="Nome do cliente"
                        autoComplete="name"
                        required
                    />
                    </div>
                </Field>
                </div>

              <Field label="E-mail" htmlFor="email" optional error={errors.email}>
                <input id="email" type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={255}  autoComplete="email" />
              </Field>

              <Field label="Telefone" htmlFor="phone" optional error={errors.phone}>
                <input id="phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={30} placeholder="(00) 00000-0000" autoComplete="tel" />
              </Field>

              <Field label="CPF" htmlFor="cpf" optional error={errors.cpf}>
                <input id="cpf" className={inputClass} value={form.cpf} onChange={(e) => update("cpf", e.target.value)} maxLength={14} placeholder="000.000.000-00" inputMode="numeric" />
              </Field>

              <Field label="RG" htmlFor="rg" optional error={errors.rg}>
                <input id="rg" className={inputClass} value={form.rg} onChange={(e) => update("rg", e.target.value)} maxLength={20} placeholder="Documento de identidade" />
              </Field>

              <Field label="Data de nascimento" htmlFor="birthDate" optional error={errors.birthDate}>
                <input id="birthDate" type="date" className={inputClass} value={form.birthDate} max={maxBirthDate} onChange={(e) => update("birthDate", e.target.value)} />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Endereço" htmlFor="address" optional error={errors.address}>
                  <textarea id="address" rows={3} className={`${inputClass} resize-y`} value={form.address} onChange={(e) => update("address", e.target.value)} maxLength={500} placeholder="Rua, número, bairro, cidade e CEP" autoComplete="street-address" />
                </Field>
              </div>
            </div>
          </section>

          <div className="rounded-xl border border-[#eee7dc] bg-[#faf8f4] px-5 py-4 text-sm text-stone-600">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a98a58]" />
            </div>
          </div>

          {requestError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {requestError}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Link href="/clientes" className="inline-flex items-center justify-center rounded-xl border border-[#e8e0d4] px-5 py-3 text-sm font-semibold text-stone-600 transition hover:bg-white">
              Cancelar
            </Link>
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {submitting ? "Cadastrando..." : "Cadastrar cliente"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
