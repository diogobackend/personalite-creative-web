
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  Loader2,
  LockKeyhole,
  Pencil,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { api } from "../../src/lib/api";
import DashboardLayout from "../../src/components/layout/DashboardLayout";

type User = {
  userId: string;
  name: string;
  email: string;
  login: string;
  role: string;
  status: string;
  phone: string | null;
  cpf: string | null;
  rg: string | null;
  address: string | null;
  birthDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type EditableField =
  | "name"
  | "email"
  | "login"
  | "phone"
  | "cpf"
  | "rg"
  | "address"
  | "birthDate";

type FormData = Record<EditableField, string>;

const EMPTY_FORM: FormData = {
  name: "",
  email: "",
  login: "",
  phone: "",
  cpf: "",
  rg: "",
  address: "",
  birthDate: "",
};

function getUserIdFromToken(token: string): string {
  const payload = token.split(".")[1];

  if (!payload) {
    throw new Error("Token inválido.");
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
  ) as { sub?: string };

  if (!data.sub) {
    throw new Error("Usuário não identificado.");
  }

  return data.sub;
}

function toFormData(user: User): FormData {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    login: user.login ?? "",
    phone: user.phone ?? "",
    cpf: user.cpf ?? "",
    rg: user.rg ?? "",
    address: user.address ?? "",
    birthDate: user.birthDate ?? "",
    };
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("");
}

function formatDate(value: string | null): string {
  if (!value) return "Não informado";

  const date = new Date(
    value.includes("T") ? value : `${value}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}


function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    BLOCKED: "Bloqueado",
  };

  return labels[status] ?? status;
}

type ProfileFieldProps = {
  label: string;
  value: string;
  editing: boolean;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
};

function ProfileField({
  label,
  value,
  editing,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "Não informado",
}: ProfileFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-[#8b7b68]">
          {label}
        </label>

        {editing && disabled && (
          <LockKeyhole className="h-3.5 w-3.5 text-[#a48a63]" />
        )}
      </div>

      {editing ? (
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition-colors ${
            disabled
              ? "cursor-not-allowed border-[#e9e3da] bg-[#f3f0eb] text-[#958b80]"
              : "border-[#e7dfd4] bg-white text-[#342d27] focus:border-[#b99b66]"
          }`}
        />
      ) : (
        <div className="flex min-h-11 items-center rounded-xl border border-[#eee8df] bg-[#faf9f7] px-4 py-3 text-sm text-[#342d27]">
          {value || (
            <span className="text-stone-400">Não informado</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Sessão não encontrada.");
      }

      const userId = getUserIdFromToken(token);

      const response = await api.get<User>("/users/id", {
        params: { userId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);
      setForm(toFormData(response.data));
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      setError("Não foi possível carregar os dados do perfil.");
      toast.error("Não foi possível carregar os dados do perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  };

  const handleCancel = () => {
    if (user) {
      setForm(toFormData(user));
    }

    setEditing(false);
    setError("");
  };

  const handleSave = async () => {
    if (!user || saving) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      toast.error("Sessão não encontrada.");
      return;
    }

    const payload: Record<string, string> = {};

    const editableFields: EditableField[] = [
      "name",
      "email",
      "login",
      "phone",
      "cpf",
      "rg",
      "address",
      "birthDate",
    ];

    for (const field of editableFields) {
      if (
        (field === "cpf" && user.cpf) ||
        (field === "rg" && user.rg)
      ) {
        continue;
      }

      const original = user[field] ?? "";
      const current = form[field].trim();

      if (current !== original && current !== "") {
        payload[field] = current;
      }
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Nenhuma alteração foi realizada.");
      return;
    }

    try {
      setSaving(true);
      setError("");
  
      await api.patch(
        `/users/${user.userId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadUser();

      setEditing(false);
      toast.success("Perfil atualizado com sucesso.");
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      const apiMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      toast.error(typeof apiMessage === "string" && apiMessage.trim()
        ? apiMessage
        : "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!user || savingPassword) return;


    if (!oldPassword || !newPassword || !repeatPassword) {
      toast.error("Preencha os três campos de senha.");
      return;
    }

    if (newPassword !== repeatPassword) {
      toast.error("As senhas novas não coincidem.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Sessão não encontrada.");
      return;
    }

    setSavingPassword(true);
    try {
      // A API de login valida a senha antiga; não armazenamos o token retornado.
      try {
        await api.post(
            "/login",
            {
                login: user.login,
                password: oldPassword,
            },
            {
                headers: {
                "X-Password-Validation": "true",
                },
            }
);
      } catch (err: unknown) {
        const status =
          typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        if (status === 400 || status === 401) {
          toast.error(
            "Senha incorreta. Se esqueceu, entre em contato com o Administrador."
          );
          return;
        }
        throw err;
      }

      await api.patch(
        `/users/${user.userId}`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOldPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setChangePassword(false);
      toast.success("Senha atualizada com sucesso.");
    } catch (err) {
      console.error("Erro ao atualizar senha:", err);
      const apiMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      toast.error(typeof apiMessage === "string" && apiMessage.trim()
        ? apiMessage
        : "Não foi possível atualizar a senha.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading && !user) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#b99b66]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-600">
        {error || "Não foi possível carregar o perfil."}
        <button
          type="button"
          onClick={() => void loadUser()}
          className="ml-4 font-semibold underline"
        >
          Tentar novamente
        </button>
        </div>
      </DashboardLayout>
    );
  }

  const fields: {
    label: string;
    key: EditableField;
    type?: string;
    disabled?: boolean;
  }[] = [
    { label: "Nome", key: "name" },
    { label: "E-mail", key: "email", type: "email" },
    { label: "Login", key: "login" },
    { label: "Telefone", key: "phone", type: "tel" },
    {
      label: "CPF",
      key: "cpf",
      disabled: Boolean(user.cpf?.trim()),
    },
    {
      label: "RG",
      key: "rg",
      disabled: Boolean(user.rg?.trim()),
    },
    { label: "Endereço", key: "address" },
    {
      label: "Data de nascimento",
      key: "birthDate",
      type: "date",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-end gap-4">


        <div className="flex items-center gap-2">
          {editing && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex h-10 items-center gap-2 rounded-xl border border-green-700 bg-green-700 px-4 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (editing) {
                handleCancel();
              } else {
                setEditing(true);
              }
            }}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-xl border border-green-700 bg-green-700 px-4 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            {editing ? (
              <>
                <Eye className="h-4 w-4" />
                Visualizar
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Editar
              </>
            )}
          </button>

          {editing && (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex h-10 items-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#ebe4da] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-5 border-b border-[#eee8df] bg-[#fcfaf7] p-6 sm:p-8">
          <div className="flex h-20 min-w-20 items-center justify-center rounded-full bg-[#f0e5d2] px-3 text-xl font-bold text-[#a18455]">
            {getInitials(user.name) || (
              <UserRound className="h-8 w-8" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-serif text-2xl text-[#342d27]">
              {user.name}
            </h2>
          </div>

          <span className="rounded-full border border-[#e8dfd0] bg-white px-3 py-1.5 text-xs font-semibold text-[#947646]">
            {getStatusLabel(user.status)}
          </span>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          <section className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              {fields.map((field) => (
                <ProfileField
                  key={field.key}
                  label={field.label}
                  value={
                    editing
                      ? form[field.key]
                      : field.key === "birthDate"
                        ? user.birthDate
                          ? formatDate(user.birthDate)
                          : ""
                        : user[field.key] ?? ""
                  }
                  editing={editing}
                  type={field.type}
                  disabled={field.disabled}
                  onChange={(value) =>
                    updateField(field.key, value)
                  }
                />
              ))}
            </div>

            {editing && (user.cpf || user.rg) && (
              <div className="flex items-start gap-2 rounded-xl bg-[#faf7f1] px-4 py-3 text-xs text-[#8b7758]">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                CPF e RG já cadastrados ficam bloqueados para edição.
              </div>
            )}
          </section>

          <section className="space-y-5">
            
            <div className="grid gap-5 md:grid-cols-2">
              <ProfileField
                label="Data de cadastro"
                value={formatDate(user.createdAt)}
                editing={false}
              />

              <ProfileField
                label="Última atualização"
                value={formatDate(user.updatedAt)}
                editing={false}
              />
            </div>
          </section>
          <section className="space-y-5">
            <h3 className="text-base font-semibold text-[#342d27]">Deseja atualizar a senha?</h3>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setChangePassword(true); }}
                className={`rounded-xl border px-5 py-2 text-sm ${changePassword ? "border-green-700 bg-green-700 text-white" : "border-[#e7dfd4] bg-white"}`}>SIM</button>
              <button type="button" onClick={() => { setChangePassword(false); setOldPassword(""); setNewPassword(""); setRepeatPassword(""); }}
                className={`rounded-xl border px-5 py-2 text-sm ${!changePassword ? "border-green-700 bg-green-700 text-white" : "border-[#e7dfd4] bg-white"}`}>NÃO</button>
            </div>
            {changePassword && (
              <div className="space-y-4 rounded-xl border border-[#eee8df] p-5">
                {([
                  ["Senha antiga", oldPassword, setOldPassword, "current-password"],
                  ["Senha nova", newPassword, setNewPassword, "new-password"],
                  ["Repetir senha nova", repeatPassword, setRepeatPassword, "new-password"],
                ] as const).map(([label, value, setter, autoComplete]) => (
                  <label key={label} className="block space-y-2">
                    <span className="text-xs font-semibold text-[#8b7b68]">{label}</span>
                    <input type="password" value={value} autoComplete={autoComplete}
                      onChange={(event) => { setter(event.target.value); }}
                      className="block h-11 w-full rounded-xl border border-[#e7dfd4] bg-white px-4 text-sm outline-none focus:border-green-700" />
                  </label>
                ))}
                <button type="button" onClick={() => void handlePasswordSave()} disabled={savingPassword}
                  className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50">
                  {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Atualizar senha
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
