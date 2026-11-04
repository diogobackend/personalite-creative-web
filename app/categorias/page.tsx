"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import { Boxes, Eye, Loader2, Package, Pencil, Plus, ReceiptText, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import DashboardLayout from "../../src/components/layout/DashboardLayout";
import { api } from "../../src/lib/api";

type CategoryType = "PRODUCT" | "INVENTORY" | "EXPENSE";
type Category = { id: string; name: string; type: CategoryType; createdAt: string; updatedAt: string };
type CategoryResponse = Category[] | { content: Category[] };

const SECTIONS = [
  { type: "PRODUCT", title: "Produtos", icon: Package },
  { type: "INVENTORY", title: "Estoques", icon: Boxes },
  { type: "EXPENSE", title: "Despesas", icon: ReceiptText },
] as const;

const INPUT_CLASS = "w-full rounded-xl border border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#342d27] outline-none transition placeholder:text-[#aaa197] focus:border-[#a98a58] focus:ring-2 focus:ring-[#a98a58]/15";
const SECONDARY_CLASS = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e0d4] bg-white px-4 py-2.5 text-sm font-semibold text-[#51473d] transition hover:bg-[#f8f5f0] disabled:opacity-50";
const PRIMARY_CLASS = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#a98a58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#927448] disabled:cursor-not-allowed disabled:opacity-50";

function errorMessage(error: unknown, action: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Não foi possível conectar ao servidor.";
    if (error.response.status === 401) return "Sua sessão expirou. Faça login novamente.";
    if (error.response.status === 403) return "Você não tem permissão para gerenciar categorias.";
    if (error.response.status === 409) return "Já existe uma categoria com esse nome nesse tipo.";
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    return `Não foi possível ${action} (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : `Não foi possível ${action}.`;
}

function authHeaders() {
  const token = localStorage.getItem("access_token");
  if (!token || token === "undefined" || token === "null") throw new Error("Sessão inválida. Faça login novamente.");
  return { Authorization: `Bearer ${token}` };
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("PRODUCT");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<CategoryType | "ALL">("ALL");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadCategories = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get<CategoryResponse>("/categories", {
        headers: authHeaders(), signal,
      });
      const items = Array.isArray(data) ? data : data?.content;
      if (!Array.isArray(items)) throw new Error("Formato inesperado da listagem de categorias.");
      if (!signal.aborted) setCategories(items);
    } catch (error) {
      if (signal.aborted || axios.isCancel(error)) return;
      setLoadError(errorMessage(error, "listar categorias"));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadCategories(controller.signal);
    return () => controller.abort();
  }, [loadCategories, reloadKey]);

  const filtered = useMemo(() => categories.filter((category) =>
    category.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")) &&
    (filterType === "ALL" || category.type === filterType)
  ), [categories, search, filterType]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = name.trim();
    setActionError(null);
    setNotice(null);
    if (!normalized) { setActionError("Informe o nome da categoria."); return; }
    if (normalized.length > 150) { setActionError("O nome deve ter no máximo 150 caracteres."); return; }
    setSaving(true);
    try {
      const { data } = await api.post<Category>("/categories", { name: normalized, type }, { headers: authHeaders() });
      setCategories((previous) => [...previous.filter((item) => item.id !== data.id), data]);
      setName("");
      setNotice("Categoria cadastrada com sucesso.");
    } catch (error) {
      setActionError(errorMessage(error, "cadastrar categoria"));
    } finally {
      setSaving(false);
    }
  }

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setActionError(null);
    setNotice(null);
  }

  async function handleUpdate(category: Category) {
    const normalized = editName.trim();
    setActionError(null);
    setNotice(null);
    if (!normalized || normalized.length > 150) { setActionError("Informe um nome com até 150 caracteres."); return; }
    if (normalized === category.name) { setEditingId(null); return; }
    setBusyId(category.id);
    try {
      const { data } = await api.patch<Category>(`/categories/${encodeURIComponent(category.id)}`, { name: normalized }, { headers: authHeaders() });
      setCategories((previous) => previous.map((item) => item.id === category.id ? data : item));
      setEditingId(null);
      setNotice("Categoria atualizada com sucesso.");
    } catch (error) {
      setActionError(errorMessage(error, "atualizar categoria"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setBusyId(target.id);
    setActionError(null);
    setNotice(null);
    try {
      await api.delete(`/categories/${encodeURIComponent(target.id)}`, { headers: authHeaders() });
      setCategories((previous) => previous.filter((item) => item.id !== target.id));
      if (editingId === target.id) setEditingId(null);
      setDeleteTarget(null);
      setNotice("Categoria excluída com sucesso.");
    } catch (error) {
      setDeleteTarget(null);
      setActionError(errorMessage(error, "excluir categoria"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardLayout>
      <main className="space-y-6 pb-12">
        

        <section className="rounded-2xl border border-[#ece6dc] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-[#f4ede2] p-2.5 text-[#a98a58]"><Plus size={20} /></div>
            <div><h2 className="text-lg font-semibold text-[#342d27]">Categoria</h2>
              </div>
          </div>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-end">
            <label className="block text-sm font-semibold text-[#51473d]">Nome
              <input className={`${INPUT_CLASS} mt-2`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Gourmet" maxLength={150} required />
            </label>
            <label className="block text-sm font-semibold text-[#51473d]">Tipo
              <select className={`${INPUT_CLASS} mt-2`} value={type} onChange={(event) => setType(event.target.value as CategoryType)}>
                <option value="PRODUCT">Produtos</option><option value="INVENTORY">Estoque</option><option value="EXPENSE">Despesas</option>
              </select>
            </label>
            
            <button type="submit" disabled={saving} className={`${PRIMARY_CLASS} md:mb-0`}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {saving ? "Cadastrando..." : "Cadastrar"}
            </button>
          </form>
        </section>

        {notice && <div role="status" className="rounded-xl border border-[#d8e5d5] bg-[#f4faf2] px-5 py-3 text-sm font-medium text-[#42623e]">{notice}</div>}
        {actionError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">{actionError}</div>}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a98a58]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar categoria pelo nome..." aria-label="Buscar categoria pelo nome" className={`${INPUT_CLASS} pl-11`} />
          </div>
          <select
            aria-label="Filtrar categorias por tipo"
            value={filterType}
            onChange={(event) => { setFilterType(event.target.value as CategoryType | "ALL"); setSearch(""); }}
            className={INPUT_CLASS}
          >
            <option value="ALL">Todos os tipos</option>
            <option value="PRODUCT">Produtos</option>
            <option value="INVENTORY">Estoque</option>
            <option value="EXPENSE">Despesas</option>
          </select>
        </div>

        {loadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="ml-3 font-semibold underline">Tentar novamente</button>
        </div>}

        {SECTIONS.filter((section) => filterType === "ALL" || section.type === filterType).map(({ type: sectionType, title, icon: Icon }) => {
          const items = filtered.filter((category) => category.type === sectionType).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
          return (
            <section
                key={sectionType}
                className={`overflow-hidden rounded-2xl border-2 shadow-md ${
                  sectionType === "PRODUCT"
                    ? "border-blue-300 bg-blue-50/50"
                    : sectionType === "INVENTORY"
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-amber-300 bg-amber-50/50"
                }`}
              >
              <div
                  className={`flex items-center justify-between gap-4 border-b-2 p-5 sm:p-6 ${
                    sectionType === "PRODUCT"
                      ? "border-blue-200 bg-blue-100"
                      : sectionType === "INVENTORY"
                        ? "border-emerald-200 bg-emerald-100"
                        : "border-amber-200 bg-amber-100"
                  }`}
                >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#f4ede2] p-2.5 text-[#a98a58]"><Icon size={20} /></div>
                  <div><h2 className="text-lg font-semibold text-[#342d27]">{title}</h2></div>
                </div>
                <span className="rounded-full bg-[#f4ede2] px-3 py-1 text-xs font-semibold text-[#927448]">{loadError || loading ? "—" : items.length}</span>
              </div>
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-[#81766b]"><Loader2 size={17} className="animate-spin" /> Carregando categorias...</div>
              ) : loadError ? (
                <p className="px-5 py-10 text-center text-sm text-[#81766b]">Listagem indisponível.</p>
              ) : items.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-[#81766b]">{search || filterType !== "ALL" ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada neste grupo."}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">

                    <tbody>
                      {items.map((category) => {
                        const editing = editingId === category.id;
                        const busy = busyId === category.id;
                        return (
                          <tr key={category.id} className="border-b border-[#eee8df] last:border-b-0 odd:bg-white even:bg-[#e8e2d9] transition-colors hover:bg-[#ddd5ca]">
                            <td className="px-5 py-3.5">
                              {editing ? (
                                <input autoFocus aria-label={`Editar nome de ${category.name}`} className={`${INPUT_CLASS} max-w-xl py-2`} maxLength={150} value={editName} onChange={(event) => setEditName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void handleUpdate(category); } if (event.key === "Escape") setEditingId(null); }} disabled={busy} />
                              ) : <span className="text-sm font-semibold text-[#342d27]">{category.name}</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" title="Visualizar" aria-label={`Visualizar ${category.name}`} disabled={busy} onClick={() => setEditingId(null)} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${!editing ? "bg-[#f4ede2] text-[#927448]" : "text-[#a98a58] hover:bg-white"}`}><Eye size={18} /></button>
                                <button type="button" title="Editar" aria-label={`Editar ${category.name}`} disabled={busy} onClick={() => startEditing(category)} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${editing ? "bg-[#f4ede2] text-[#927448]" : "text-[#a98a58] hover:bg-white"}`}><Pencil size={17} /></button>
                                {editing && <button type="button" title="Salvar alteração" aria-label={`Salvar ${category.name}`} disabled={busy} onClick={() => void handleUpdate(category)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#42623e] hover:bg-white">{busy ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}</button>}
                                <button type="button" title="Excluir" aria-label={`Excluir ${category.name}`} disabled={busy} onClick={() => setDeleteTarget(category)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a76d66] transition hover:bg-red-50 hover:text-red-700"><Trash2 size={17} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyId) setDeleteTarget(null); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-2xl border border-[#ece6dc] bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4"><h2 id="delete-title" className="font-serif text-2xl text-[#342d27]">Excluir categoria?</h2><button type="button" aria-label="Fechar" disabled={!!busyId} onClick={() => setDeleteTarget(null)} className="text-[#81766b]"><X size={20} /></button></div>
              <p className="mt-3 text-sm leading-6 text-[#81766b]">Deseja excluir <strong className="text-[#342d27]">{deleteTarget.name}</strong>? Essa ação não poderá ser desfeita.</p>
              <div className="mt-6 flex justify-end gap-3"><button type="button" className={SECONDARY_CLASS} disabled={!!busyId} onClick={() => setDeleteTarget(null)}>Cancelar</button><button type="button" disabled={!!busyId} onClick={() => void handleDelete()} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">{busyId ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />} Excluir</button></div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
