import { articlesApi } from '../api/articles';
import { mediaApi } from '../api/media';

interface SyncProgress {
  total: number;
  current: number;
  currentName: string;
  errors: string[];
}

/**
 * Sync articles from a local folder selected via File System Access API.
 * Each subfolder should contain: title_ar.txt, title_en.txt, content_ar.txt, content_en.txt, and an image file.
 */
export async function syncArticlesFromFolder(
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncProgress> {
  // Prompt user to select the OceanX_Articles directory
  const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();

  // Collect all subdirectories
  const folders: FileSystemDirectoryHandle[] = [];
  for await (const [, entry] of dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>) {
    if (entry.kind === 'directory') {
      folders.push(entry as FileSystemDirectoryHandle);
    }
  }

  const progress: SyncProgress = {
    total: folders.length,
    current: 0,
    currentName: '',
    errors: [],
  };

  for (const folder of folders) {
    progress.current++;
    progress.currentName = folder.name;
    onProgress?.({ ...progress });

    try {
      // Read text files
      const titleEn = await readTextFile(folder, 'title_en.txt');
      const titleAr = await readTextFile(folder, 'title_ar.txt');
      const contentEn = await readTextFile(folder, 'content_en.txt');
      const contentAr = await readTextFile(folder, 'content_ar.txt');
      const date = (await readTextFile(folder, 'date.txt')).trim();

      if (!titleEn.trim() && !titleAr.trim()) {
        progress.errors.push(`${folder.name}: No title found, skipping`);
        continue;
      }

      // Find and upload image
      let coverImageUrl = '';
      const imageFile = await findImageFile(folder);
      if (imageFile) {
        try {
          const res = await mediaApi.upload(imageFile, 'articles');
          coverImageUrl = res.data.url;
        } catch {
          progress.errors.push(`${folder.name}: Image upload failed`);
        }
      }

      // Create article in Firebase
      await articlesApi.create({
        title: { en: titleEn.trim(), ar: titleAr.trim() },
        body: { en: contentEn, ar: contentAr },
        categories: [],
        date: date || undefined,
        cover_image: coverImageUrl,
        status: 'published',
        featured: false,
      });
    } catch (err) {
      progress.errors.push(`${folder.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return progress;
}

async function readTextFile(dir: FileSystemDirectoryHandle, name: string): Promise<string> {
  try {
    const fileHandle = await dir.getFileHandle(name);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return '';
  }
}

async function findImageFile(dir: FileSystemDirectoryHandle): Promise<File | null> {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  for await (const [name, entry] of dir as unknown as AsyncIterable<[string, FileSystemHandle]>) {
    if (entry.kind === 'file') {
      const lower = name.toLowerCase();
      if (imageExtensions.some((ext) => lower.endsWith(ext))) {
        const fileHandle = entry as FileSystemFileHandle;
        return fileHandle.getFile();
      }
    }
  }
  return null;
}
