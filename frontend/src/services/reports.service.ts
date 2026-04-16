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
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Report, ReportStatus, CreateReportDto, UpdateReportDto, PaginatedResponse } from '../types';

const COLLECTION = 'reports';

export interface ReportQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReportStatus | '';
  /** Internal: last document snapshot for cursor-based pagination */
  _cursor?: DocumentSnapshot;
}

// Firestore doesn't support full-text search natively.
// Title/author search is handled client-side after fetching the status-filtered page.
// For production scale, replace with Algolia / Typesense.

function toReport(id: string, data: Record<string, unknown>): Report {
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
    title: bil('title'),
    description: bil('description'),
    categories: Array.isArray(data.categories)
      ? (data.categories as Record<string, unknown>[]).map((c) =>
          typeof c === 'string' ? { en: c as string } : { en: (c.en as string) ?? '', ar: (c.ar as string) ?? '' },
        )
      : [],
    date: (data.date as string) ?? undefined,
    status: (data.status as ReportStatus) ?? ReportStatus.Draft,
    cover_image: (data.cover_image as string) ?? undefined,
    file_url: (data.file_url as string) ?? undefined,
    created_at: toISO(data.created_at),
    updated_at: toISO(data.updated_at),
  };
}

const reportsCol = () => collection(db, COLLECTION);

export const reportsService = {
  async list(params: ReportQueryParams = {}): Promise<PaginatedResponse<Report>> {
    const pageSize = Math.min(params.limit ?? 10, 100);
    const pageNum = Math.max(params.page ?? 1, 1);
    const search = (params.search ?? '').toLowerCase().trim();
    const statusFilter = params.status ?? '';

    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];
    if (statusFilter) constraints.push(where('status', '==', statusFilter));

    // Count total (ignoring search, which is client-side)
    const countSnap = await getCountFromServer(query(reportsCol(), ...constraints));
    const total = countSnap.data().count;

    // If searching, fetch all matching docs and filter client-side
    if (search) {
      const snap = await getDocs(query(reportsCol(), ...constraints));
      const all = snap.docs
        .map((d) => toReport(d.id, d.data() as Record<string, unknown>))
        .filter(
          (r) =>
            r.title.en.toLowerCase().includes(search) ||
            (r.title.ar ?? '').toLowerCase().includes(search) ||
            r.categories.some((c) => c.en.toLowerCase().includes(search) || (c.ar ?? '').toLowerCase().includes(search)),
        );
      const start = (pageNum - 1) * pageSize;
      return {
        data: all.slice(start, start + pageSize),
        pagination: { page: pageNum, limit: pageSize, total: all.length, pages: Math.ceil(all.length / pageSize) || 1 },
      };
    }

    // Cursor-based pagination: skip to the right page
    const offset = (pageNum - 1) * pageSize;
    let pageConstraints = [...constraints, limit(pageSize)];

    if (offset > 0) {
      // Fetch the cursor doc at the offset position
      const cursorSnap = await getDocs(query(reportsCol(), ...constraints, limit(offset)));
      const last = cursorSnap.docs[cursorSnap.docs.length - 1];
      if (last) pageConstraints = [...constraints, startAfter(last), limit(pageSize)];
    }

    const snap = await getDocs(query(reportsCol(), ...pageConstraints));
    const data = snap.docs.map((d) => toReport(d.id, d.data() as Record<string, unknown>));

    return {
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
    };
  },

  async getById(id: string): Promise<Report> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) throw new Error(`Report not found: ${id}`);
    return toReport(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(dto: CreateReportDto): Promise<Report> {
    const now = serverTimestamp();
    const ref = await addDoc(reportsCol(), { ...dto, created_at: now, updated_at: now });
    return this.getById(ref.id);
  },

  async update(id: string, dto: UpdateReportDto): Promise<Report> {
    await updateDoc(doc(db, COLLECTION, id), { ...dto, updated_at: serverTimestamp() });
    return this.getById(id);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async toggleStatus(id: string): Promise<Report> {
    const report = await this.getById(id);
    if (report.status === ReportStatus.Archived) return report;
    const next = report.status === ReportStatus.Published ? ReportStatus.Draft : ReportStatus.Published;
    return this.update(id, { status: next });
  },
};

