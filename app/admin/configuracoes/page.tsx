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
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setNewEmail('');
      setNewName('');
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

  async function updateName(u: AdminUser, name: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
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

      <CleanupSection onError={setError} onNotify={notify} />

      <section className="rounded-xl border border-primary-100 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-500/60">
          Adicionar administrador
        </h2>
        <form
          onSubmit={handleAdd}
          className="grid gap-3 md:grid-cols-[2fr_2fr_1fr]"
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
            {users.map((u) => {
              const isMe = u.email === meEmail;
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={u.name ?? ''}
                      placeholder="(sem nome)"
                      onBlur={(e) => {
                        if ((e.target.value ?? '') !== (u.name ?? '')) {
                          updateName(u, e.target.value);
                        }
                      }}
                      onChange={(e) => {
                        setUsers((prev) =>
                          prev.map((x) =>
                            x.id === u.id ? { ...x, name: e.target.value } : x,
                          ),
                        );
                      }}
                      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-primary-500 hover:border-primary-100 focus:border-primary-500 focus:outline-none"
                    />
                    <p className="text-xs text-primary-500/60">
                      {u.email} {isMe && '(você)'}
                    </p>
                  </div>
                  <span
                    className={
                      u.active
                        ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800'
                        : 'rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-800'
                    }
                  >
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleActive(u)}
                    disabled={isMe && u.active}
                    className="rounded-full border border-primary-200 px-3 py-1 text-xs text-primary-500/80 hover:border-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {u.active ? 'Desativar' : 'Reativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeUser(u)}
                    disabled={isMe}
                    className="rounded-full border border-rose-300 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remover
                  </button>
                </li>
              );
            })}
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

const CLEANUP_OPTIONS: Array<{ key: string; label: string; warn?: string }> = [
  { key: 'orders', label: 'Pedidos (orders + order_items)' },
  { key: 'customers', label: 'Clientes' },
  { key: 'purchases', label: 'Compras' },
  { key: 'expenses', label: 'Despesas operacionais' },
  { key: 'community_posts', label: 'Posts da comunidade' },
  { key: 'customer_suggestions', label: 'Sugestões' },
  { key: 'push_subscriptions', label: 'Assinaturas de push' },
  { key: 'availability', label: 'Datas de produção' },
];

function CleanupSection({
  onError,
  onNotify,
}: {
  onError: (msg: string | null) => void;
  onNotify: (msg: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [confirmText, setConfirmText] = useState('');

  function toggle(key: string) {
    if (selected.includes(key)) {
      setSelected(selected.filter((k) => k !== key));
    } else {
      setSelected([...selected, key]);
    }
  }

  function selectAll() {
    setSelected(CLEANUP_OPTIONS.map((o) => o.key));
  }
  function clearAll() {
    setSelected([]);
  }

  async function run() {
    if (selected.length === 0) return;
    if (confirmText !== 'APAGAR') {
      onError('Digite APAGAR (em maiúsculas) pra confirmar.');
      return;
    }
    if (
      !confirm(
        `Apagar dados de ${selected.length} tabela${selected.length > 1 ? 's' : ''}?\n\n` +
          selected.join(', ') +
          '\n\nEssa ação não pode ser desfeita.',
      )
    )
      return;
    setBusy(true);
    onError(null);
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: selected }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data.deleted as Record<string, number>);
      setSelected([]);
      setConfirmText('');
      onNotify('Limpeza concluída.');
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border-2 border-rose-200 bg-rose-50/30 p-5">
      <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-rose-900/70">
        🧹 Limpar dados de teste
      </h2>
      <p className="mb-3 text-sm text-primary-500/80">
        Use isso pra apagar dados que você criou testando antes do uso
        real. Marque o que quer limpar, digite <strong>APAGAR</strong> no
        campo abaixo e clique em executar. Produtos, sabores e
        administradores não são apagados.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="rounded-full border border-primary-200 px-2 py-0.5 text-[10px] text-primary-500/70 hover:border-primary-500"
        >
          Marcar todos
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-full border border-primary-200 px-2 py-0.5 text-[10px] text-primary-500/70 hover:border-primary-500"
        >
          Desmarcar
        </button>
      </div>

      <ul className="grid gap-1.5 md:grid-cols-2">
        {CLEANUP_OPTIONS.map((opt) => (
          <li key={opt.key}>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm text-primary-500/90 hover:border-rose-300">
              <input
                type="checkbox"
                checked={selected.includes(opt.key)}
                onChange={() => toggle(opt.key)}
              />
              {opt.label}
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
          placeholder="Digite APAGAR pra confirmar"
          disabled={selected.length === 0}
          className="flex-1 rounded-md border border-rose-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={busy || selected.length === 0 || confirmText !== 'APAGAR'}
          onClick={run}
          className="rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-40"
        >
          {busy ? 'Apagando…' : `🧹 Apagar ${selected.length} ${selected.length === 1 ? 'tabela' : 'tabelas'}`}
        </button>
      </div>

      {result && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="mb-1 font-medium">Limpeza concluída:</p>
          <ul className="ml-4 list-disc">
            {Object.entries(result).map(([table, count]) => (
              <li key={table}>
                {table}: {count === -1 ? 'erro' : `${count} linhas apagadas`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
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
