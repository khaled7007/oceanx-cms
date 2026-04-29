import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Analytics, ContactInfo } from '../types';

const DOC_REF = doc(db, 'analytics', 'stats');
const CONTACT_DOC_REF = doc(db, 'analytics', 'contact_information');

const defaults: Analytics = {
  projects_delivered: 0,
  clients: 0,
  partners: 0,
  sectors_served: 0,
  years_of_experience: 0,
};

export const analyticsService = {
  async get(): Promise<Analytics> {
    const snap = await getDoc(DOC_REF);
    if (!snap.exists()) return { ...defaults };
    const d = snap.data() as Record<string, unknown>;
    return {
      projects_delivered: (d.projects_delivered as number) ?? 0,
      clients: (d.clients as number) ?? 0,
      partners: (d.partners as number) ?? 0,
      sectors_served: (d.sectors_served as number) ?? 0,
      years_of_experience: (d.years_of_experience as number) ?? 0,
    };
  },

  async save(data: Analytics): Promise<Analytics> {
    await setDoc(DOC_REF, { ...data, updated_at: serverTimestamp() }, { merge: true });
    return data;
  },
};

const contactDefaults: ContactInfo = {
  email: '',
  phone: '',
  working_hours: { en: '', ar: '' },
};

export const contactInfoService = {
  async get(): Promise<ContactInfo> {
    const snap = await getDoc(CONTACT_DOC_REF);
    if (!snap.exists()) return { ...contactDefaults };
    const d = snap.data() as Record<string, unknown>;
    const wh = (d.working_hours ?? {}) as Record<string, unknown>;
    return {
      email: (d.email as string) ?? '',
      phone: (d.phone as string) ?? '',
      working_hours: {
        en: (wh.en as string) ?? '',
        ar: (wh.ar as string) ?? '',
      },
    };
  },

  async save(data: ContactInfo): Promise<ContactInfo> {
    await setDoc(CONTACT_DOC_REF, { ...data, updated_at: serverTimestamp() }, { merge: true });
    return data;
  },
};
