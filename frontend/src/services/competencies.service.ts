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
import { Competency, PaginatedResponse } from '../types';

const COLLECTION = 'competencies';

export interface CompetencyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

function toCompetency(id: string, data: Record<string, unknown>): Competency {
  const toISO = (v: unknown) =>
    v instanceof Timestamp ? v.toDate().toISOString() : (v as string) ?? new Date().toISOString();
  const bil = (field: string) => {
    const obj = data[field] as Record<string, unknown> | undefined;
    return { en: (obj?.en as string) ?? '', ar: (obj?.ar as string) ?? undefined };
  };
  const bilArr = (field: string) => {
    const obj = data[field] as Record<string, unknown> | undefined;
    return {
      en: Array.isArray(obj?.en) ? (obj.en as string[]) : [],
      ar: Array.isArray(obj?.ar) ? (obj.ar as string[]) : [],
    };
  };

  return {
    id,
    name: bil('name'),
    position: bil('position'),
    photo: data.photo as string | undefined,
    category: data.category as Competency['category'],
    department: bil('department'),
    overview: bil('overview'),
    experience: bilArr('experience'),
    linkedin_url: data.linkedin_url as string | undefined,
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

const col = () => collection(db, COLLECTION);

export const competenciesService = {
  async list(params: CompetencyQueryParams = {}): Promise<PaginatedResponse<Competency>> {
    const pageSize = Math.min(params.limit ?? 10, 100);
    const pageNum = Math.max(params.page ?? 1, 1);
    const search = (params.search ?? '').toLowerCase().trim();

    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

    const countSnap = await getCountFromServer(query(col(), ...constraints));
    const total = countSnap.data().count;

    if (search) {
      const snap = await getDocs(query(col(), ...constraints));
      const all = snap.docs
        .map((d) => toCompetency(d.id, d.data() as Record<string, unknown>))
        .filter(
          (c) =>
            c.name.en.toLowerCase().includes(search) ||
            (c.name.ar ?? '').toLowerCase().includes(search) ||
            c.position.en.toLowerCase().includes(search) ||
            (c.position.ar ?? '').toLowerCase().includes(search) ||
            (c.department?.en ?? '').toLowerCase().includes(search) ||
            (c.department?.ar ?? '').toLowerCase().includes(search),
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
    const data = snap.docs.map((d) => toCompetency(d.id, d.data() as Record<string, unknown>));

    return {
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
    };
  },

  async getById(id: string): Promise<Competency> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) throw new Error(`Competency not found: ${id}`);
    return toCompetency(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(dto: Partial<Competency>): Promise<Competency> {
    const now = serverTimestamp();
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    const ref = await addDoc(col(), { ...fields, created_at: now, updated_at: now });
    return this.getById(ref.id);
  },

  async update(id: string, dto: Partial<Competency>): Promise<Competency> {
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    await updateDoc(doc(db, COLLECTION, id), { ...fields, updated_at: serverTimestamp() });
    return this.getById(id);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },
};
