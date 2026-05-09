'use client';

import { useEffect, useState } from 'react';
import {
  getCurrentSubscription,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push';

type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  active: boolean;
};

export default function ConfiguracoesPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  function notify(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [meRes, usersRes] = await Promise.all([
        fetch('/api/auth/me').catch(() => null),
        fetch('/api/admin/users'),
      ]);
      if (meRes && meRes.ok) {
        const me = await meRes.json();
        setMeEmail(me?.email ?? null);
      }
      if (!usersRes.ok) throw new Error(`HTTP ${usersRes.status}`);
      const data = (await usersRes.json()) as AdminUser[];
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim(),
          name: newName.trim() || undefined,
          phone: newPhone.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setNewEmail('');
      setNewName('');
      setNewPhone('');
      await load();
      notify('Administrador adicionado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: AdminUser) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !u.active }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      await load();
      notify(u.active ? 'Acesso desativado.' : 'Acesso reativado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function updateField(
    u: AdminUser,
    patch: Partial<{ name: string; email: string; phone: string }>,
  ) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? (await res.text()));
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function resetPassword(u: AdminUser) {
    if (
      !confirm(
        `Resetar a senha de ${u.email}? Eles vão precisar entrar com link por email no próximo login e definir nova senha.`,
      )
    )
      return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPassword: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      notify(`Senha de ${u.email} resetada.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function removeUser(u: AdminUser) {
    if (!confirm(`Remover ${u.email} dos administradores?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      await load();
      notify('Administrador removido.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-3xl italic text-primary-500"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Configurações
        </h1>
        <p className="text-sm text-primary-500/60">
          Quem pode acessar este painel administrativo.
        </p>
      </header>

      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-primary-500/60">
          Como funciona o login
        </h2>
        <p className="text-sm text-primary-500/80">
          O painel aceita <strong>senha</strong> (modo padrão) ou{' '}
          <strong>link por email</strong> (recuperação se esquecer a senha).
          Defina sua senha logo abaixo. Para revogar acesso de alguém, basta
          desativar ou remover o usuário em "Administradores cadastrados".
        </p>
      </section>

      <PasswordSection
        meEmail={meEmail}
        onError={setError}
        onNotify={notify}
      />

      <AdminPushSection onError={setError} onNotify={notify} />

      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-500/60">
          Adicionar administrador
        </h2>
        <form
          onSubmit={handleAdd}
          className="grid gap-3 md:grid-cols-[2fr_2fr_1.5fr_auto]"
        >
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Email
            </span>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Nome (opcional)
            </span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Como aparece no painel"
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
              Telefone (opcional)
            </span>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="(21) 9 8765-4321"
              className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="self-end rounded-full bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? 'Adicionando…' : 'Adicionar'}
          </button>
        </form>
      </section>

      {notice && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-center text-xs text-emerald-800">
          ✓ {notice}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-center text-xs text-rose-800">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-primary-100 bg-white">
        <h2 className="border-b border-primary-100 p-5 text-sm font-medium uppercase tracking-widest text-primary-500/60">
          Administradores cadastrados
        </h2>
        {loading ? (
          <p className="p-5 text-sm text-primary-500/60">Carregando…</p>
        ) : users.length === 0 ? (
          <p className="p-5 text-sm text-primary-500/60">Nenhum cadastrado.</p>
        ) : (
          <ul className="divide-y divide-primary-100">
            {users.map((u) => (
              <AdminRow
                key={u.id}
                user={u}
                isMe={u.email === meEmail}
                onUpdate={(patch) => updateField(u, patch)}
                onToggleActive={() => toggleActive(u)}
                onResetPassword={() => resetPassword(u)}
                onRemove={() => removeUser(u)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <strong>Você não consegue desativar nem remover a si mesmo.</strong>{' '}
        Para perder o seu próprio acesso, primeiro adicione outro administrador
        e peça pra ele te remover.
      </section>
    </div>
  );
}

function AdminRow({
  user,
  isMe,
  onUpdate,
  onToggleActive,
  onResetPassword,
  onRemove,
}: {
  user: AdminUser;
  isMe: boolean;
  onUpdate: (
    patch: Partial<{ name: string; email: string; phone: string }>,
  ) => void;
  onToggleActive: () => void;
  onResetPassword: () => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? '');

  function save() {
    const patch: Partial<{ name: string; email: string; phone: string }> = {};
    if ((name || '') !== (user.name ?? '')) patch.name = name;
    if (email.trim().toLowerCase() !== user.email)
      patch.email = email.trim().toLowerCase();
    if ((phone || '') !== (user.phone ?? '')) patch.phone = phone;
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }
    onUpdate(patch);
    setEditing(false);
  }

  function cancel() {
    setName(user.name ?? '');
    setEmail(user.email);
    setPhone(user.phone ?? '');
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="space-y-2 bg-primary-50/30 p-4">
        <div className="grid gap-2 md:grid-cols-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
            className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(21) 9 8765-4321"
            className="rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-primary-500 px-4 py-1.5 text-xs text-white"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={cancel}
            className="rounded-full border border-primary-200 px-4 py-1.5 text-xs text-primary-500/70"
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-medium text-primary-500">
          {user.name || '(sem nome)'} {isMe && <span className="text-[11px] font-normal text-primary-500/60">(você)</span>}
        </p>
        <p className="text-xs text-primary-500/60">📧 {user.email}</p>
        {user.phone && (
          <p className="text-xs text-primary-500/60">
            📱{' '}
            <a
              href={`https://wa.me/55${user.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              {user.phone}
            </a>
          </p>
        )}
      </div>
      <span
        className={
          user.active
            ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800'
            : 'rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-800'
        }
      >
        {user.active ? 'Ativo' : 'Inativo'}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500/80 hover:border-primary-500"
      >
        ✏️ Editar
      </button>
      <button
        type="button"
        onClick={onResetPassword}
        className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs text-amber-700 hover:bg-amber-50"
        title="Limpa a senha. Pessoa precisa entrar via link por email e definir nova senha."
      >
        🔑 Resetar senha
      </button>
      <button
        type="button"
        onClick={onToggleActive}
        disabled={isMe && user.active}
        className="rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500/80 hover:border-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {user.active ? 'Desativar' : 'Reativar'}
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={isMe}
        className="rounded-full border border-rose-300 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        🗑 Remover
      </button>
    </li>
  );
}

function AdminPushSection({
  onError,
  onNotify,
}: {
  onError: (msg: string | null) => void;
  onNotify: (msg: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    setSupported(true);
    getCurrentSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  async function enable() {
    onError(null);
    setBusy(true);
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        onError('Push não configurado neste site.');
        return;
      }
      const sub = await subscribeToPush(key, { role: 'admin' });
      if (sub) {
        setSubscribed(true);
        onNotify('Avisos ativados neste dispositivo.');
      } else {
        onError(
          'Permissão negada. Pra ativar, abra as configurações do navegador e permita notificações.',
        );
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    onError(null);
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      onNotify('Avisos desativados neste dispositivo.');
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-primary-100 bg-white p-5">
      <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-primary-500/60">
        Notificações de novos pedidos
      </h2>
      <p className="mb-3 text-sm text-primary-500/80">
        Ative pra receber um aviso no celular toda vez que um cliente
        reservar uma pizza. Funciona via PWA: instale primeiro o atalho do
        admin (compartilhar → adicionar à tela inicial), abra ele, e ative
        aqui.
      </p>
      {!supported ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          Este navegador não suporta notificações push. Use Chrome (Android)
          ou Safari (iOS 16.4+).
        </p>
      ) : subscribed ? (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">
            ✓ Ativo neste dispositivo
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={disable}
            className="rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500/70 hover:border-primary-500 disabled:opacity-50"
          >
            Desativar
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={enable}
          className="rounded-full bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? 'Pedindo permissão…' : '🔔 Ativar avisos neste celular'}
        </button>
      )}
    </section>
  );
}

function PasswordSection({
  meEmail,
  onError,
  onNotify,
}: {
  meEmail: string | null;
  onError: (msg: string | null) => void;
  onNotify: (msg: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    if (newPassword.length < 8) {
      onError('Nova senha precisa ter ao menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      onError('Confirmação não confere com a nova senha.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onNotify('Senha atualizada. Use no próximo login.');
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-primary-100 bg-white p-5">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-500/60">
        Definir/alterar senha {meEmail && <span className="text-primary-500/40">({meEmail})</span>}
      </h2>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
            Senha atual (deixe vazio se ainda não tem)
          </span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
            Nova senha (mín 8)
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-primary-500/60">
            Confirmar nova senha
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-md border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </label>
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={busy || !newPassword || !confirmPassword}
            className="rounded-full bg-primary-500 px-5 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? 'Salvando…' : 'Salvar senha'}
          </button>
        </div>
      </form>
    </section>
  );
}
