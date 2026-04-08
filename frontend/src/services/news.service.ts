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
import { NewsItem, ContentStatus, PaginatedResponse } from '../types';

const COLLECTION = 'news';

export interface NewsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContentStatus | '';
}

function toNewsItem(id: string, data: Record<string, unknown>): NewsItem {
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
    headline: bil('headline'),
    body: bil('body'),
    source: data.source as string | undefined,
    publish_date: data.publish_date as string | undefined,
    cover_image: data.cover_image as string | undefined,
    status: (data.status as ContentStatus) ?? 'draft',
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

const col = () => collection(db, COLLECTION);

export const newsService = {
  async list(params: NewsQueryParams = {}): Promise<PaginatedResponse<NewsItem>> {
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
        .map((d) => toNewsItem(d.id, d.data() as Record<string, unknown>))
        .filter(
          (n) =>
            n.headline.en.toLowerCase().includes(search) ||
            (n.headline.ar ?? '').toLowerCase().includes(search) ||
            (n.source ?? '').toLowerCase().includes(search),
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
    const data = snap.docs.map((d) => toNewsItem(d.id, d.data() as Record<string, unknown>));

    return {
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
    };
  },

  async getById(id: string): Promise<NewsItem> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) throw new Error(`News item not found: ${id}`);
    return toNewsItem(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(dto: Partial<NewsItem>): Promise<NewsItem> {
    const now = serverTimestamp();
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    const ref = await addDoc(col(), { ...fields, created_at: now, updated_at: now });
    return this.getById(ref.id);
  },

  async update(id: string, dto: Partial<NewsItem>): Promise<NewsItem> {
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    await updateDoc(doc(db, COLLECTION, id), { ...fields, updated_at: serverTimestamp() });
    return this.getById(id);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async toggleStatus(id: string): Promise<NewsItem> {
    const item = await this.getById(id);
    const next: ContentStatus = item.status === 'published' ? 'draft' : 'published';
    return this.update(id, { status: next });
  },
};
