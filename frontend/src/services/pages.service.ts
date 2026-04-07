import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Page, ContentStatus, PaginatedResponse } from '../types';

const COLLECTION = 'pages';

export interface PageQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContentStatus | '';
}

function toPage(id: string, data: Record<string, unknown>): Page {
  const toISO = (v: unknown) =>
    v instanceof Timestamp ? v.toDate().toISOString() : (v as string) ?? new Date().toISOString();
  const bil = (field: string) => {
    const obj = data[field] as Record<string, unknown> | undefined;
    return { en: (obj?.en as string) ?? '', ar: (obj?.ar as string) ?? undefined };
  };

  return {
    id,
    slug: (data.slug as string) ?? '',
    title: bil('title'),
    sections: data.sections as Page['sections'],
    meta_title: data.meta_title as string | undefined,
    meta_description: data.meta_description as string | undefined,
    meta_keywords: data.meta_keywords as string | undefined,
    status: (data.status as ContentStatus) ?? 'draft',
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

const col = () => collection(db, COLLECTION);

export const pagesService = {
  async list(params: PageQueryParams = {}): Promise<PaginatedResponse<Page>> {
    const pageSize = Math.min(params.limit ?? 10, 100);
    const pageNum = Math.max(params.page ?? 1, 1);
    const search = (params.search ?? '').toLowerCase().trim();
    const statusFilter = params.status ?? '';

    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];
    if (statusFilter) constraints.push(where('status', '==', statusFilter));

    const countSnap = await getCountFromServer(query(col(), ...constraints));
    const total = countSnap.data().count;

    if (search) {
      const snap = await getDocs(query(col(), ...constraints));
      const all = snap.docs
        .map((d) => toPage(d.id, d.data() as Record<string, unknown>))
        .filter(
          (p) =>
            p.title.en.toLowerCase().includes(search) ||
            (p.title.ar ?? '').toLowerCase().includes(search) ||
            p.slug.toLowerCase().includes(search),
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
    const data = snap.docs.map((d) => toPage(d.id, d.data() as Record<string, unknown>));

    return {
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
    };
  },

  async getById(id: string): Promise<Page> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) throw new Error(`Page not found: ${id}`);
    return toPage(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(dto: Partial<Page>): Promise<Page> {
    const now = serverTimestamp();
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    const ref = await addDoc(col(), { ...fields, created_at: now, updated_at: now });
    return this.getById(ref.id);
  },

  async update(id: string, dto: Partial<Page>): Promise<Page> {
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    await updateDoc(doc(db, COLLECTION, id), { ...fields, updated_at: serverTimestamp() });
    return this.getById(id);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async toggleStatus(id: string): Promise<Page> {
    const page = await this.getById(id);
    const next: ContentStatus = page.status === 'published' ? 'draft' : 'published';
    return this.update(id, { status: next });
  },
};
