"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";

const navigation = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/" },
  { label: "Produtos", icon: Package, href: "/produtos" },
  { label: "Vendas", icon: ShoppingBag, href: "/vendas" },
  { label: "Clientes", icon: Users, href: "/clientes" },
  { label: "Estoque", icon: Boxes, href: "/estoque" },
  { label: "Despesas", icon: CreditCard, href: "/despesas" },
  { label: "Relatórios", icon: ChartNoAxesCombined, href: "/relatorios" },
];


export default function Sidebar({ close }: { close: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-[#39342f] text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-7">
        <div className="mb-7 flex h-24 w-24 items-center justify-center" aria-label="Personalité Creative">
              <img
                src="data:image/png;base64,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"
                alt="Logo Personalité Creative"
                className="h-full w-full object-contain"
              />
            </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d5bd91]">
            Personalité
          </p>
          <p className="font-serif text-xl tracking-wide">Creative</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-7">
        <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a99e90]">
          Menu principal
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                  (pathname === item.href || pathname.startsWith(`${item.href}/`))
                    ? "bg-[#b99b66] font-semibold text-white"
                    : "text-[#d8d0c6] hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="mb-4 mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a99e90]">
          Sistema
        </p>

        <Link
          href="/configuracoes"
          onClick={close}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#d8d0c6] transition-colors hover:bg-white/10"
        >
          <Settings className="h-[18px] w-[18px]" />
          Configurações
        </Link>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b99b66]/20 text-sm font-semibold text-[#e3c99a]">
            PC
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              Administrador
            </p>
            <p className="text-xs text-[#bcb0a0]">
              Personalité Creative
            </p>
          </div>

          <button
              type="button"
              onClick={() => {
                localStorage.removeItem("access_token");
                window.location.replace("/login");
              }}
              aria-label="Sair"
              title="Sair"
              className="text-[#bcb0a0] hover:text-white"
            >
  <LogOut className="h-4 w-4" />
</button>
        </div>
      </div>
    </div>
  );
}

