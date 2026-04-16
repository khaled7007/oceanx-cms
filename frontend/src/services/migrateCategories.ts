import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bilingual } from '../types';

interface MigrationProgress {
  total: number;
  current: number;
  currentName: string;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Migrate categories in articles and reports from string[] to Bilingual[].
 * Reads all categories from the categories collection,
 * then loops through articles and reports matching each string
 * to its bilingual equivalent.
 */
export async function migrateCategoriesToBilingual(
  onProgress?: (progress: MigrationProgress) => void,
): Promise<MigrationProgress> {
  // 1. Load all categories into a lookup map (en name → {en, ar})
  const catSnap = await getDocs(collection(db, 'categories'));
  const catMap = new Map<string, Bilingual>();
  catSnap.docs.forEach((d) => {
    const data = d.data();
    const name = data.name as { en?: string; ar?: string } | undefined;
    if (name?.en) {
      catMap.set(name.en.toLowerCase(), { en: name.en, ar: name.ar ?? '' });
    }
  });

  // 2. Collect all articles + reports
  const articlesSnap = await getDocs(collection(db, 'articles'));
  const reportsSnap = await getDocs(collection(db, 'reports'));

  const docs = [
    ...articlesSnap.docs.map((d) => ({ ref: d.ref, data: d.data(), collection: 'articles' })),
    ...reportsSnap.docs.map((d) => ({ ref: d.ref, data: d.data(), collection: 'reports' })),
  ];

  const progress: MigrationProgress = {
    total: docs.length,
    current: 0,
    currentName: '',
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const item of docs) {
    progress.current++;
    const title =
      (item.data.title as { en?: string })?.en || item.ref.id;
    progress.currentName = `${item.collection}/${title}`;
    onProgress?.({ ...progress });

    try {
      const cats = item.data.categories;
      if (!Array.isArray(cats) || cats.length === 0) {
        progress.skipped++;
        continue;
      }

      // Check if already migrated (first element is an object)
      if (typeof cats[0] === 'object' && cats[0] !== null && 'en' in cats[0]) {
        progress.skipped++;
        continue;
      }

      // Map string categories to bilingual
      const bilingualCats: Bilingual[] = (cats as string[]).map((catStr) => {
        const match = catMap.get(catStr.toLowerCase());
        if (match) return match;
        // No match found — keep the string as en, empty ar
        return { en: catStr, ar: '' };
      });

      await updateDoc(item.ref, {
        categories: bilingualCats,
        updated_at: serverTimestamp(),
      });
      progress.updated++;
    } catch (err) {
      progress.errors.push(
        `${item.collection}/${item.ref.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  return progress;
}
