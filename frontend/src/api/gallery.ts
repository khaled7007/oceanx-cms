import {
  collection,
  doc,
  getDocs,
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
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GalleryItem, PaginatedResponse } from '../types';
import { deleteFile } from '../services/storage.service';

const COLLECTION = 'gallery';
const galleryCol = () => collection(db, COLLECTION);

function toGalleryItem(id: string, data: Record<string, unknown>): GalleryItem {
  const toISO = (v: unknown) =>
    v instanceof Timestamp ? v.toDate().toISOString() : (v as string) ?? new Date().toISOString();

  return {
    id,
    img: (data.img as string) ?? '',
    uploaded_from: (data.uploaded_from as string) ?? 'manual',
    visible: (data.visible as boolean) ?? true,
    created_at: toISO(data.created_at),
  };
}

const r = <T>(data: T): Promise<{ data: T }> => Promise.resolve({ data });

export const galleryApi = {
  list: async (params?: Record<string, string | number>): Promise<{ data: PaginatedResponse<GalleryItem> }> => {
    const pageSize = Math.min(Number(params?.limit || 20), 100);
    const pageNum = Math.max(Number(params?.page || 1), 1);
    const sourceFilter = (params?.source as string) || '';

    const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];

    const countSnap = await getCountFromServer(query(galleryCol(), ...constraints));
    const total = countSnap.data().count;

    if (sourceFilter) {
      const snap = await getDocs(query(galleryCol(), ...constraints));
      let all = snap.docs.map((d) => toGalleryItem(d.id, d.data() as Record<string, unknown>));
      all = all.filter((g) => g.uploaded_from === sourceFilter);
      const start = (pageNum - 1) * pageSize;
      return r({
        data: all.slice(start, start + pageSize),
        pagination: { page: pageNum, limit: pageSize, total: all.length, pages: Math.ceil(all.length / pageSize) || 1 },
      });
    }

    const offset = (pageNum - 1) * pageSize;
    let pageConstraints: QueryConstraint[] = [...constraints, fbLimit(pageSize)];

    if (offset > 0) {
      const cursorSnap = await getDocs(query(galleryCol(), ...constraints, fbLimit(offset)));
      const last = cursorSnap.docs[cursorSnap.docs.length - 1];
      if (last) pageConstraints = [...constraints, startAfter(last), fbLimit(pageSize)];
    }

    const snap = await getDocs(query(galleryCol(), ...pageConstraints));
    const data = snap.docs.map((d) => toGalleryItem(d.id, d.data() as Record<string, unknown>));

    return r({
      data,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
    });
  },

  addToGallery: async (img: string, uploadedFrom: string): Promise<{ data: GalleryItem }> => {
    const now = serverTimestamp();
    const docRef = await addDoc(galleryCol(), {
      img,
      uploaded_from: uploadedFrom,
      visible: true,
      created_at: now,
    });
    return r({
      id: docRef.id,
      img,
      uploaded_from: uploadedFrom,
      visible: true,
      created_at: new Date().toISOString(),
    });
  },

  toggleVisible: async (id: string, visible: boolean): Promise<{ data: GalleryItem }> => {
    await updateDoc(doc(db, COLLECTION, id), { visible });
    return r({ id, visible } as unknown as GalleryItem);
  },

  delete: async (id: string): Promise<{ data: Record<string, never> }> => {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (snap.exists()) {
      const data = snap.data();
      if (data.img) await deleteFile(data.img as string);
      await deleteDoc(doc(db, COLLECTION, id));
    }
    return r({} as Record<string, never>);
  },
};
