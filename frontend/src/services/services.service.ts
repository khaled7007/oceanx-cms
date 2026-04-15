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
import { Service, PaginatedResponse } from '../types';

const COLLECTION = 'services';

export interface ServiceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

function toService(id: string, data: Record<string, unknown>): Service {
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

  const bilArr = (field: string): { en: string; ar?: string }[] => {
    const arr = data[field];
    if (Array.isArray(arr)) return arr.map((item: Record<string, unknown>) => ({ en: (item.en as string) ?? '', ar: (item.ar as string) ?? undefined }));
    return [];
  };

  return {
    id,
    title: bil('title'),
    overview: bil('overview'),
    description: bil('description'),
    services_list: bilArr('services_list'),
    img: data.img as string | undefined,
    order_index: (data.order_index as number) ?? 0,
    active: (data.active as boolean) ?? true,
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

const col = () => collection(db, COLLECTION);

export const servicesService = {
  async list(params: ServiceQueryParams = {}): Promise<PaginatedResponse<Service>> {
    const pageSize = Math.min(params.limit ?? 10, 100);
    const pageNum = Math.max(params.page ?? 1, 1);
    const search = (params.search ?? '').toLowerCase().trim();

    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

    const countSnap = await getCountFromServer(query(col(), ...constraints));
    const total = countSnap.data().count;

    if (search) {
      const snap = await getDocs(query(col(), ...constraints));
      const all = snap.docs
        .map((d) => toService(d.id, d.data() as Record<string, unknown>))
        .filter(
          (s) =>
            s.title.en.toLowerCase().includes(search) ||
            (s.title.ar ?? '').toLowerCase().includes(search) ||
            (s.description?.en ?? '').toLowerCase().includes(search),
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
    const data = snap.docs.map((d) => toService(d.id, d.data() as Record<string, unknown>));

    return {
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
    };
  },

  async getById(id: string): Promise<Service> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) throw new Error(`Service not found: ${id}`);
    return toService(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(dto: Partial<Service>): Promise<Service> {
    const now = serverTimestamp();
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    const ref = await addDoc(col(), { ...fields, created_at: now, updated_at: now });
    return this.getById(ref.id);
  },

  async update(id: string, dto: Partial<Service>): Promise<Service> {
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    await updateDoc(doc(db, COLLECTION, id), { ...fields, updated_at: serverTimestamp() });
    return this.getById(id);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async toggleActive(id: string): Promise<Service> {
    const svc = await this.getById(id);
    return this.update(id, { active: !svc.active });
  },
};
