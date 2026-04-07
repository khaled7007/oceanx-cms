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
import { Article, ContentStatus, PaginatedResponse } from '../types';

const COLLECTION = 'articles';

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContentStatus | '';
}

function toArticle(id: string, data: Record<string, unknown>): Article {
  const toISO = (v: unknown) =>
    v instanceof Timestamp ? v.toDate().toISOString() : (v as string) ?? new Date().toISOString();

  return {
    id,
    title_en: (data.title_en as string) ?? '',
    title_ar: data.title_ar as string | undefined,
    body_en: data.body_en as string | undefined,
    body_ar: data.body_ar as string | undefined,
    author: data.author as string | undefined,
    category: data.category as string | undefined,
    cover_image: data.cover_image as string | undefined,
    status: (data.status as ContentStatus) ?? 'draft',
    featured: (data.featured as boolean) ?? false,
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

const col = () => collection(db, COLLECTION);

export const articlesService = {
  async list(params: ArticleQueryParams = {}): Promise<PaginatedResponse<Article>> {
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
        .map((d) => toArticle(d.id, d.data() as Record<string, unknown>))
        .filter(
          (a) =>
            a.title_en.toLowerCase().includes(search) ||
            (a.title_ar ?? '').toLowerCase().includes(search) ||
            (a.author ?? '').toLowerCase().includes(search) ||
            (a.category ?? '').toLowerCase().includes(search),
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
    const data = snap.docs.map((d) => toArticle(d.id, d.data() as Record<string, unknown>));

    return {
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
    };
  },

  async getById(id: string): Promise<Article> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) throw new Error(`Article not found: ${id}`);
    return toArticle(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(dto: Partial<Article>): Promise<Article> {
    const now = serverTimestamp();
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    const ref = await addDoc(col(), { ...fields, created_at: now, updated_at: now });
    return this.getById(ref.id);
  },

  async update(id: string, dto: Partial<Article>): Promise<Article> {
    const { id: _, created_at: _c, updated_at: _u, ...fields } = dto as Record<string, unknown>;
    await updateDoc(doc(db, COLLECTION, id), { ...fields, updated_at: serverTimestamp() });
    return this.getById(id);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async toggleStatus(id: string): Promise<Article> {
    const article = await this.getById(id);
    const next: ContentStatus = article.status === 'published' ? 'draft' : 'published';
    return this.update(id, { status: next });
  },
};
