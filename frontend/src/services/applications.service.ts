import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Application, ApplicationType, ApplicationGender, PaginatedResponse } from '../types';

const COLLECTION = 'applies';

export interface ApplicationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: ApplicationType | '';
  gender?: ApplicationGender | '';
}

function toApplication(id: string, data: Record<string, unknown>): Application {
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
    specialization: (data.specialization as string) ?? '',
    dob: (data.dob as string) ?? '',
    email: (data.email as string) ?? '',
    phone: (data.phone as string) ?? '',
    experience: (data.experience as string) ?? '',
    cv: (data.cv as string) || undefined,
    links: (data.links as string) || undefined,
    gender: (data.gender as ApplicationGender) ?? 'M',
    type: (data.type as ApplicationType) ?? 'open_application',
    created_at: toISO(data.created_at),
  };
}

const col = () => collection(db, COLLECTION);

export const applicationsService = {
  async list(params: ApplicationQueryParams = {}): Promise<PaginatedResponse<Application>> {
    const pageSize = Math.min(params.limit ?? 12, 100);
    const pageNum = Math.max(params.page ?? 1, 1);
    const search = (params.search ?? '').toLowerCase().trim();

    const constraints: QueryConstraint[] = [];
    if (params.type) constraints.push(where('type', '==', params.type));
    if (params.gender) constraints.push(where('gender', '==', params.gender));

    const snap = await getDocs(query(col(), ...constraints));
    let all = snap.docs.map((d) => toApplication(d.id, d.data() as Record<string, unknown>));

    // Client-side sort — newest first (works even if created_at is missing)
    all.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

    // Client-side search
    if (search) {
      all = all.filter(
        (a) =>
          a.name.en.toLowerCase().includes(search) ||
          (a.name.ar ?? '').toLowerCase().includes(search) ||
          a.email.toLowerCase().includes(search) ||
          a.specialization.toLowerCase().includes(search),
      );
    }

    const total = all.length;
    const start = (pageNum - 1) * pageSize;
    return {
      data: all.slice(start, start + pageSize),
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize) || 1,
      },
    };
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },
};
