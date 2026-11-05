
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { api } from "../../lib/api";
import Link from "next/link";
import Sidebar from "./Sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

type JwtPayload = {
  sub: string;
};

type UserResponse = {
  userId: string;
  name: string;
};

function getUserIdFromToken(token: string): string {
  const payload = token.split(".")[1];

  if (!payload) {
    throw new Error("Token inválido");
  }

  const normalized = payload
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const decoded = atob(normalized);

  const bytes = Uint8Array.from(decoded, (character) =>
    character.charCodeAt(0)
  );

  const data = JSON.parse(
    new TextDecoder().decode(bytes)
  ) as JwtPayload;

  if (!data.sub) {
    throw new Error("Usuário não identificado no token");
  }

  return data.sub;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("");
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  const router = useRouter();

  useEffect(() => {
    let active = true;

    const loadAuthenticatedUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      setAuthenticated(true);

      try {
        const userId = getUserIdFromToken(token);

        const response = await api.get<UserResponse>(
          "/users/id",
          {
            params: { userId },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (active) {
          setUserName(response.data.name);
        }
      } catch (error) {
        if (active) {
          console.error(
            "Erro ao carregar usuário autenticado:",
            error
          );
        }
      }
    };

    void loadAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [router]);

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-[#f8f6f2] text-[#342d27]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] lg:block">
        <Sidebar close={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <aside className="relative h-full w-[280px] max-w-[85vw]">
            <Sidebar close={() => setSidebarOpen(false)} />

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-4 top-4 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:ml-[260px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-4 border-b border-[#ece6dc] bg-white/95 px-5 backdrop-blur-sm sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setSidebarOpen(true)}
              className="text-stone-600 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <span className="truncate font-serif text-xl lg:hidden">
              Personalité Creative
            </span>
          </div>
            <Link
              href="/perfil"
              className="flex items-center gap-4"
              title="Meu Perfil"
            >
              <span className="hidden text-xs text-stone-400 transition-colors hover:text-[#9c7e4e] sm:inline">
                {userName || "Carregando..."}
              </span>

              <div className="h-7 w-px bg-[#ece6dc]" />

              <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#f3eadb] px-2 text-xs font-bold text-[#9c7e4e] transition-colors hover:bg-[#e9dcc5]">
                {userName ? getInitials(userName) : "..."}
              </div>
            </Link>

        </header>

        <main className="mx-auto max-w-[1500px] space-y-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
