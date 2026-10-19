
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from "lucide-react";

import { authService } from "../../src/services/auth-service";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  login: z.string().trim().min(1, "Informe seu e-mail ou login"),
  password: z.string().min(1, "Informe sua senha"),
});

type LoginForm = z.infer<typeof loginSchema>;

function getLoginError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Ocorreu um erro inesperado.";
  }

  if (!error.response) {
    return "Não foi possível conectar ao servidor. Verifique se o backend está disponível.";
  }

  switch (error.response.status) {
    case 400:
    case 401:
      return "Login ou senha inválidos.";

    case 403:
      return "Acesso não autorizado.";

    case 429:
      return "Muitas tentativas. Aguarde e tente novamente.";

    default:
      return "Não foi possível realizar o login. Tente novamente.";
  }
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginForm) => {
    setLoginSuccess(false);
    setLoginError(null);

    try { 
  const identifier = values.login.trim();

  await authService.login({
    ...(identifier.includes("@")
      ? { email: identifier }
      : { login: identifier }),
    password: values.password,
  });

  router.replace("/");
} catch (error) {
      setLoginError(getLoginError(error));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6f2] px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#e9e2d8] bg-white shadow-[0_24px_80px_rgba(75,58,35,0.08)] lg:grid-cols-2">

        {/* Identidade visual */}
        <aside className="relative flex flex-col justify-between overflow-hidden bg-[#39342f] p-8 text-white sm:p-10 lg:min-h-[620px] lg:p-12">
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
              Seu negócio em um só lugar. Acompanhe suas operações
              com organização, praticidade e segurança.
            </p>
          </div>

          <div className="relative mt-10 hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#c7ad7d]/15">
                <Check className="h-5 w-5 text-[#e3c99a]" />
              </div>

              <h2 className="font-serif text-xl">
                Bem-vindo de volta
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#d3c9bc]">
                Acesse sua conta para continuar gerenciando
                as informações da Personalité Creative.
              </p>
            </div>
          </div>

          <p className="relative mt-8 text-xs tracking-wide text-[#bcb0a0]">
            PERSONALITÉ CREATIVE · SISTEMA DE GESTÃO
          </p>
        </aside>

        {/* Formulário */}
        <section className="flex min-w-0 items-center px-6 py-12 sm:px-12 lg:px-14">
          <div className="w-full">
            <span className="inline-flex rounded-full bg-[#f6f0e5] px-3 py-1.5 text-xs font-semibold tracking-wide text-[#977c4e]">
              ÁREA DE ACESSO
            </span>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="mt-9 space-y-6"
            >
              {/* Login */}
              <div className="space-y-2">
                <label
                  htmlFor="login"
                  className="text-sm font-medium text-[#494139]"
                >
                  E-mail ou login
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                  <input
                    id="login"
                    {...register("login")}
                    type="text"
                    placeholder="Seu e-mail ou login"
                    autoComplete="username"
                    aria-invalid={!!errors.login}
                    className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:ring-4 focus:ring-[#b99b66]/10 ${
                      errors.login
                        ? "border-red-400 focus:border-red-400"
                        : "border-[#e7e1d8] hover:border-[#cdbd9f] focus:border-[#b99b66]"
                    }`}
                  />
                </div>

                {errors.login && (
                  <p className="text-xs text-red-600">
                    {errors.login.message}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#494139]"
                >
                  Senha
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                  <input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-12 text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:ring-4 focus:ring-[#b99b66]/10 ${
                      errors.password
                        ? "border-red-400 focus:border-red-400"
                        : "border-[#e7e1d8] hover:border-[#cdbd9f] focus:border-[#b99b66]"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-[#977c4e]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Mensagem de sucesso */}
              {loginSuccess && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-[#d8e8d7] bg-[#f1f8ef] p-4 text-sm text-[#3c7140]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Credenciais validadas com sucesso!</p>
                </div>
              )}

              {/* Mensagem de erro */}
              {loginError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {loginError}
                </div>
              )}

              {/* Botão */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#a98a58] px-6 py-4 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:bg-[#927448] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a98a58] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Entrando..." : "Entrar"}

                {!isSubmitting && (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>

              <p className="text-center text-sm text-stone-500">
                Ainda não possui uma conta?{" "}
                <Link
                  href="/cadastro"
                  className="font-semibold text-[#a98a58] transition-colors hover:text-[#927448] hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </form>

            <p className="mt-10 text-center text-xs text-stone-400">
              Personalité Creative · Gestão com elegância e simplicidade
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
