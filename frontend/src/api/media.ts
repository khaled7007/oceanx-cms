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
  limit as fbLimit,
  startAfter,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Media, PaginatedResponse } from '../types';
import { uploadFile, deleteFile } from '../services/storage.service';

const COLLECTION = 'media';
const mediaCol = () => collection(db, COLLECTION);

function toMedia(id: string, data: Record<string, unknown>): Media {
  const toISO = (v: unknown) =>
    v instanceof Timestamp ? v.toDate().toISOString() : (v as string) ?? new Date().toISOString();

  return {
    id,
    filename: (data.filename as string) ?? '',
    original_name: (data.original_name as string) ?? '',
    url: (data.url as string) ?? '',
    mime_type: data.mime_type as string | undefined,
    size: data.size as number | undefined,
    tags: (data.tags as string[]) ?? [],
    created_at: toISO(data.created_at),
  };
}

const r = <T>(data: T): Promise<{ data: T }> => Promise.resolve({ data });

export const mediaApi = {
  list: async (params?: Record<string, string | number>): Promise<{ data: PaginatedResponse<Media> }> => {
    const pageSize = Math.min(Number(params?.limit || 20), 100);
    const pageNum = Math.max(Number(params?.page || 1), 1);
    const search = ((params?.search as string) || '').toLowerCase().trim();
    const typeFilter = (params?.type as string) || '';

    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

    const countSnap = await getCountFromServer(query(mediaCol(), ...constraints));
    const total = countSnap.data().count;

    // Fetch all for client-side search/type filtering
    if (search || typeFilter) {
      const snap = await getDocs(query(mediaCol(), ...constraints));
      let all = snap.docs.map((d) => toMedia(d.id, d.data() as Record<string, unknown>));

      if (typeFilter === 'image') all = all.filter((m) => m.mime_type?.startsWith('image/'));
      else if (typeFilter === 'pdf') all = all.filter((m) => m.mime_type === 'application/pdf');

      if (search) {
        all = all.filter(
          (m) =>
            m.original_name.toLowerCase().includes(search) ||
            (m.tags ?? []).some((t) => t.toLowerCase().includes(search)),
        );
      }

      const start = (pageNum - 1) * pageSize;
      return r({
        data: all.slice(start, start + pageSize),
        pagination: { page: pageNum, limit: pageSize, total: all.length, pages: Math.ceil(all.length / pageSize) || 1 },
      });
    }

    // Cursor-based pagination
    const offset = (pageNum - 1) * pageSize;
    let pageConstraints: QueryConstraint[] = [...constraints, fbLimit(pageSize)];

    if (offset > 0) {
      const cursorSnap = await getDocs(query(mediaCol(), ...constraints, fbLimit(offset)));
      const last = cursorSnap.docs[cursorSnap.docs.length - 1];
      if (last) pageConstraints = [...constraints, startAfter(last), fbLimit(pageSize)];
    }

    const snap = await getDocs(query(mediaCol(), ...pageConstraints));
    const data = snap.docs.map((d) => toMedia(d.id, d.data() as Record<string, unknown>));

    return r({
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
    });
  },

  upload: async (file: File, tags?: string[]): Promise<{ data: Media }> => {
    const key = `media/${Date.now()}_${file.name}`;
    const url = await uploadFile(file, key);

    const now = serverTimestamp();
    const docRef = await addDoc(mediaCol(), {
      filename: key,
      original_name: file.name,
      url,
      mime_type: file.type,
      size: file.size,
      tags: tags || [],
      created_at: now,
    });

    return r({
      id: docRef.id,
      filename: key,
      original_name: file.name,
      url,
      mime_type: file.type,
      size: file.size,
      tags: tags || [],
      created_at: new Date().toISOString(),
    });
  },

  updateTags: async (id: string, tags: string[]): Promise<{ data: Media }> => {
    await updateDoc(doc(db, COLLECTION, id), { tags });
    // Return minimal updated object; the query cache will refetch
    return r({ id, tags } as unknown as Media);
  },

  delete: async (id: string): Promise<{ data: Record<string, never> }> => {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (snap.exists()) {
      const data = snap.data();
      if (data.url) await deleteFile(data.url as string);
      await deleteDoc(doc(db, COLLECTION, id));
    }
    return r({} as Record<string, never>);
  },
};

