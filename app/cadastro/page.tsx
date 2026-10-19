
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import { userService } from "../../src/services/user-services";
import type { RegisterUserRequest } from "../../src/types/user";
import Link from "next/link";
import { useRouter } from "next/navigation";

const optionalText = (max: number, label: string) =>
  z.string().max(max, `${label} deve ter no máximo ${max} caracteres`);

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome completo")
    .max(150, "Máximo de 150 caracteres"),

  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .max(255, "Máximo de 255 caracteres")
    .email("Informe um e-mail válido"),

  login: z
    .string()
    .min(3, "Mínimo de 3 caracteres")
    .max(35, "Máximo de 35 caracteres")
    .regex(/^[a-z]/, "O login deve começar com uma letra minúscula")
    .regex(/^[^A-Z]*$/, "Use apenas letras minúsculas")
    .regex(/^\S+$/, "O login não pode conter espaços"),

  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(100, "Máximo de 100 caracteres"),

  phone: optionalText(30, "Telefone"),
  address: optionalText(500, "Endereço"),
  cpf: optionalText(14, "CPF"),
  rg: optionalText(20, "RG"),

  birthDate: z.string().refine((value) => {
    if (!value) return true;

    const now = new Date();

    const today = new Date(
      now.getTime() - now.getTimezoneOffset() * 60_000
    )
      .toISOString()
      .slice(0, 10);

    return value <= today;
  }, "A data de nascimento não pode ser futura"),
});

type RegisterForm = z.infer<typeof registerSchema>;

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
  optional?: boolean;
};

function Field({
  label,
  error,
  children,
  optional = false,
}: FieldProps) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-[#494139]">
          {label}
        </label>

        {optional && (
          <span className="text-xs text-stone-400">
            Opcional
          </span>
        )}
      </div>

      {children}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `
    w-full min-w-0 rounded-xl border bg-white px-4 py-3.5
    text-sm text-stone-800 outline-none
    transition-all duration-200
    placeholder:text-stone-400
    focus:ring-4 focus:ring-[#b99b66]/10
    ${
      hasError
        ? "border-red-400 focus:border-red-400"
        : "border-[#e7e1d8] hover:border-[#cdbd9f] focus:border-[#b99b66]"
    }
  `;
}

function getLocalDate(): string {
  const now = new Date();

  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000
  )
    .toISOString()
    .slice(0, 10);
}

function getRegisterError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Ocorreu um erro inesperado.";
  }

  if (!error.response) {
    return "Não foi possível conectar ao servidor. Verifique se o backend está disponível.";
  }

  switch (error.response.status) {
    case 400:
      return "Verifique os dados informados.";

    case 409:
      return "Já existe um usuário com algum dos dados informados.";

    case 401:
      return "Não foi possível autorizar a operação.";

    case 403:
      return "Você não possui permissão para realizar esta operação.";

    case 500:
      return "Ocorreu um erro interno no servidor.";

    default:
      return "Não foi possível realizar o cadastro. Tente novamente.";
  }
}

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [today, setToday] = useState("");

  const router = useRouter();

  useEffect(() => {
    setToday(getLocalDate());
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      login: "",
      password: "",
      phone: "",
      address: "",
      cpf: "",
      rg: "",
      birthDate: "",
    },
  });

  const onSubmit = async (values: RegisterForm) => {
    setSubmitted(false);
    setSubmitError(null);
    setIsRegistering(true);

    const optional = (value: string): string | null =>
      value.trim() || null;

    const request: RegisterUserRequest = {
      name: values.name.trim(),
      email: values.email.trim(),
      login: values.login,
      password: values.password,
      phone: optional(values.phone),
      address: optional(values.address),
      cpf: optional(values.cpf),
      rg: optional(values.rg),
      birthDate: optional(values.birthDate),
    };

    try {
      await userService.register(request);
      router.replace("/login");
    } catch (error) {
      setSubmitError(getRegisterError(error));
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#e9e2d8] bg-white shadow-[0_24px_80px_rgba(75,58,35,0.08)] lg:grid-cols-[0.8fr_1.2fr]">

        {/* Identidade visual */}
        <aside className="relative flex flex-col justify-between overflow-hidden bg-[#39342f] p-7 text-white sm:p-10 lg:min-h-[820px] lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-[#d6b879]/20"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border border-[#d6b879]/20"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-[#b99b66]/10 blur-3xl"
          />

          <div className="relative">
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-full border border-[#c7ad7d] font-serif text-2xl italic text-[#e3c99a]">
              P
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d5bd91]">
              Personalité
            </p>

            <h1 className="mt-3 font-serif text-3xl leading-tight tracking-wide sm:text-4xl">
              Creative
            </h1>

            <div className="mt-6 h-px w-16 bg-[#c7ad7d]" />

            <p className="mt-6 max-w-sm text-sm leading-7 text-[#ded6cb] sm:text-base">
              Uma experiência de gestão pensada para organizar,
              simplificar e acompanhar cada detalhe do seu negócio.
            </p>
          </div>

          <div className="relative mt-10 hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#c7ad7d]/15">
                <Check className="h-5 w-5 text-[#e3c99a]" />
              </div>

              <h2 className="font-serif text-xl">
                Seu espaço de gestão
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#d3c9bc]">
                Produtos, vendas e informações financeiras em um
                ambiente organizado e intuitivo.
              </p>
            </div>
          </div>

          <p className="relative mt-8 text-xs tracking-wide text-[#bcb0a0]">
            PERSONALITÉ CREATIVE · SISTEMA DE GESTÃO
          </p>
        </aside>

        {/* Formulário */}
        <section className="min-w-0 px-5 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-9">
              <span className="inline-flex rounded-full bg-[#f6f0e5] px-3 py-1.5 text-xs font-semibold tracking-wide text-[#977c4e]">
                NOVO CADASTRO
              </span>

            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-7"
            >
              {/* Informações de acesso */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-[#eee8df] pb-3">
                  <UserRound className="h-4 w-4 text-[#b99b66]" />

                  <h3 className="text-sm font-semibold text-[#51483e]">
                    Informações de acesso
                  </h3>
                </div>

                <Field
                  label="Nome completo"
                  error={errors.name?.message}
                >
                  <input
                    {...register("name")}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    maxLength={150}
                    className={inputClass(!!errors.name)}
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="E-mail"
                    error={errors.email?.message}
                  >
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                      <input
                        {...register("email")}
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        maxLength={255}
                        className={`${inputClass(!!errors.email)} pl-10`}
                      />
                    </div>
                  </Field>

                  <Field
                    label="Login"
                    error={errors.login?.message}
                  >
                    <input
                      {...register("login")}
                      placeholder="seu.login"
                      autoComplete="username"
                      maxLength={35}
                      className={inputClass(!!errors.login)}
                    />
                  </Field>
                </div>

                <Field
                  label="Senha"
                  error={errors.password?.message}
                >
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo de 8 caracteres"
                      autoComplete="new-password"
                      maxLength={100}
                      className={`${inputClass(!!errors.password)} pl-10 pr-12`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#977c4e]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </Field>
              </div>

              {/* Informações pessoais */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-[#eee8df] pb-3">
                  <UserRound className="h-4 w-4 text-[#b99b66]" />

                  <h3 className="text-sm font-semibold text-[#51483e]">
                    Informações pessoais
                  </h3>

                  <span className="ml-auto text-xs text-stone-400">
                    Opcionais
                  </span>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="CPF"
                    optional
                    error={errors.cpf?.message}
                  >
                    <input
                      {...register("cpf")}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      inputMode="numeric"
                      className={inputClass(!!errors.cpf)}
                    />
                  </Field>

                  <Field
                    label="RG"
                    optional
                    error={errors.rg?.message}
                  >
                    <input
                      {...register("rg")}
                      placeholder="Número do RG"
                      maxLength={20}
                      className={inputClass(!!errors.rg)}
                    />
                  </Field>

                  <Field
                    label="Telefone"
                    optional
                    error={errors.phone?.message}
                  >
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                      <input
                        {...register("phone")}
                        type="tel"
                        placeholder="(98) 99999-9999"
                        autoComplete="tel"
                        maxLength={30}
                        className={`${inputClass(!!errors.phone)} pl-10`}
                      />
                    </div>
                  </Field>

                  <Field
                    label="Data de nascimento"
                    optional
                    error={errors.birthDate?.message}
                  >
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                      <input
                        {...register("birthDate")}
                        type="date"
                        max={today || undefined}
                        className={`${inputClass(!!errors.birthDate)} pl-10`}
                      />
                    </div>
                  </Field>
                </div>

                <Field
                  label="Endereço"
                  optional
                  error={errors.address?.message}
                >
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-4 h-4 w-4 text-stone-400" />

                    <textarea
                      {...register("address")}
                      placeholder="Rua, número, bairro, cidade..."
                      rows={3}
                      maxLength={500}
                      autoComplete="street-address"
                      className={`${inputClass(!!errors.address)} resize-none pl-10`}
                    />
                  </div>
                </Field>
              </div>

              {/* Mensagem de sucesso */}
              {submitted && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-[#d8e8d7] bg-[#f1f8ef] p-4 text-sm text-[#3c7140]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />

                  <p>Usuário cadastrado com sucesso!</p>
                </div>
              )}

              {/* Mensagem de erro */}
              {submitError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {submitError}
                </div>
              )}

              {/* Botão de cadastro */}
              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isRegistering}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#a98a58] px-6 py-4 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:bg-[#927448] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a98a58] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRegistering ? "Cadastrando..." : "Criar conta"}

                  {!isRegistering && (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>
                <p className="text-center text-sm text-stone-500">
                Já possui uma conta?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#a98a58] hover:underline"
                >
                  Entrar
                </Link>
              </p>

                <p className="text-center text-xs leading-5 text-stone-400">
                  Personalité Creative · Gestão com elegância e simplicidade
                </p>
              </div>
              
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
