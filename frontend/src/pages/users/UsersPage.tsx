import { useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { db, secondaryAuth } from '../../lib/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRecord, UserRole } from '../../types';
import toast from 'react-hot-toast';
import { UserCircleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ROLES: UserRole[] = ['admin', 'marketing', 'hr', 'user'];

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  marketing: 'bg-blue-100 text-blue-700',
  hr: 'bg-teal-100 text-teal-700',
  user: 'bg-gray-100 text-gray-600',
};

async function fetchUsers(): Promise<UserRecord[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserRecord));
}

interface AddUserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const emptyForm: AddUserForm = { name: '', email: '', password: '', role: 'user' };

export default function UsersPage() {
  const qc = useQueryClient();
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddUserForm>(emptyForm);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const updateRole = useMutation({
    mutationFn: async ({ uid, role }: { uid: string; role: UserRole }) => {
      await updateDoc(doc(db, 'users', uid), { role });
    },
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditingUid(null);
    },
    onError: () => toast.error('Failed to update role'),
  });

  const createUser = useMutation({
    mutationFn: async (data: AddUserForm) => {
      // Use secondary auth instance so current admin session is unaffected
      const cred = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: serverTimestamp(),
      });
      // Sign out of secondary session immediately
      await signOut(secondaryAuth);
    },
    onSuccess: () => {
      toast.success('User created');
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowAdd(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : err?.message ?? 'Failed to create user';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    createUser.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {users.length} user{users.length !== 1 ? 's' : ''} registered
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <UserCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No users found</p>
            <p className="text-sm mt-1">Add a user or wait for someone to log in.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-start font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">UID</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">Joined</th>
                <th className="px-4 py-3 text-end font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[160px] truncate">{u.uid}</td>
                  <td className="px-4 py-3">
                    {editingUid === u.uid ? (
                      <select
                        defaultValue={u.role}
                        autoFocus
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        onChange={(e) => updateRole.mutate({ uid: u.uid, role: e.target.value as UserRole })}
                        onBlur={() => setEditingUid(null)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role]}`}>
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.createdAt
                      ? new Date(typeof u.createdAt === 'string' ? u.createdAt : (u.createdAt as any).toDate?.() ?? u.createdAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditingUid(editingUid === u.uid ? null : u.uid)}
                        className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        Change Role
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Add User</h3>
              <button type="button" onClick={() => { setShowAdd(false); setForm(emptyForm); }}>
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowAdd(false); setForm(emptyForm); }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createUser.isPending}
                className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
              >
                {createUser.isPending ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
