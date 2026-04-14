import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, PaginatedResponse } from '../types';

const COLLECTION = 'categories';

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

function toCategory(id: string, data: Record<string, unknown>): Category {
  const toISO = (v: unknown) =>
    v instanceof Timestamp ? v.toDate().toISOString() : (v as string) ?? new Date().toISOString();
  const bil = (field: string) => {
    const obj = data[field];
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const o = obj as Record<string, unknown>;
      return { en: (o.en as string) ?? '', ar: (o.ar as string) ?? undefined };
    }
    return { en: (data[`${field}_en`] as string) ?? '', ar: (data[`${field}_ar`] as string) ?? undefined };
  };

  return {
    id,
    name: bil('name'),
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

const col = () => collection(db, COLLECTION);

export const categoriesService = {
  async list(params: CategoryQueryParams = {}): Promise<PaginatedResponse<Category>> {
    const pageSize = Math.min(params.limit ?? 10, 100);
    const pageNum = Math.max(params.page ?? 1, 1);
    const search = (params.search ?? '').toLowerCase().trim();

    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

    const countSnap = await getCountFromServer(query(col(), ...constraints));
    const total = countSnap.data().count;

    if (search) {
      const snap = await getDocs(query(col(), ...constraints));
      const all = snap.docs
        .map((d) => toCategory(d.id, d.data() as Record<string, unknown>))
        .filter(
          (c) =>
            c.name.en.toLowerCase().includes(search) ||
            (c.name.ar ?? '').toLowerCase().includes(search),
        );
      const start = (pageNum - 1) * pageSize;
      return {
        data: all.slice(start, start + pageSize),
        pagination: { page: pageNum, limit: pageSize, total: all.length, pages: Math.ceil(all.length / pageSize) || 1 },
      };
    }

    const offset = (pageNum - 1) * pageSize;
    let pageConstraints: QueryConstraint[] = [...constraints, limit(pageSize)];

    if (offset > 0) {
      const cursorSnap = await getDocs(query(col(), ...constraints, limit(offset)));
      const last = cursorSnap.docs[cursorSnap.docs.length - 1];
      if (last) pageConstraints = [...constraints, startAfter(last), limit(pageSize)];
    }

    const snap = await getDocs(query(col(), ...pageConstraints));
    const data = snap.docs.map((d) => toCategory(d.id, d.data() as Record<string, unknown>));

    return {
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
    };
  },

  async listAll(): Promise<Category[]> {
    const snap = await getDocs(query(col(), orderBy('name.en', 'asc')));
    return snap.docs.map((d) => toCategory(d.id, d.data() as Record<string, unknown>));
  },

  async getById(id: string): Promise<Category> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) throw new Error(`Category not found: ${id}`);
    return toCategory(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(dto: Partial<Category>): Promise<Category> {
    const now = serverTimestamp();
    const ref = await addDoc(col(), { name: dto.name, created_at: now, updated_at: now });
    return this.getById(ref.id);
  },

  async update(id: string, dto: Partial<Category>): Promise<Category> {
    await updateDoc(doc(db, COLLECTION, id), { name: dto.name, updated_at: serverTimestamp() });
    return this.getById(id);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },
};
