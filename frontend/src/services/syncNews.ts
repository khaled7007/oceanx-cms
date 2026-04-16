import { newsApi } from '../api/news';
import { mediaApi } from '../api/media';

interface SyncProgress {
  total: number;
  current: number;
  currentName: string;
  errors: string[];
}

/**
 * Sync news from a local folder selected via File System Access API.
 * Each subfolder should contain:
 *   - title_en.txt / title_ar.txt
 *   - content_en.txt / content_ar.txt (optional)
 *   - date.txt
 *   - images/ subfolder with image files
 *
 * ~1.3 GB total — images are uploaded one-by-one to avoid memory issues.
 */
export async function syncNewsFromFolder(
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncProgress> {
  const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();

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
      const titleEn = await readTextFile(folder, 'title_en.txt');
      const titleAr = await readTextFile(folder, 'title_ar.txt');
      const contentEn = await readTextFile(folder, 'content_en.txt');
      const contentAr = await readTextFile(folder, 'content_ar.txt');
      const date = (await readTextFile(folder, 'date.txt')).trim();

      if (!titleEn.trim() && !titleAr.trim()) {
        progress.errors.push(`${folder.name}: No title found, skipping`);
        continue;
      }

      // Find images inside the images/ subdirectory
      const imageFiles = await findAllImageFiles(folder);
      const imageUrls: string[] = [];

      for (const imgFile of imageFiles) {
        try {
          const res = await mediaApi.upload(imgFile, 'news');
          imageUrls.push(res.data.url);
        } catch {
          progress.errors.push(`${folder.name}: Failed to upload ${imgFile.name}`);
        }
      }

      await newsApi.create({
        headline: { en: titleEn.trim(), ar: titleAr.trim() },
        body: { en: contentEn.trim(), ar: contentAr.trim() },
        date: date || undefined,
        images: imageUrls,
        status: 'published',
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

async function findAllImageFiles(dir: FileSystemDirectoryHandle): Promise<File[]> {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const files: File[] = [];

  // Look inside images/ subdirectory
  let imagesDir: FileSystemDirectoryHandle | null = null;
  try {
    imagesDir = await dir.getDirectoryHandle('images');
  } catch {
    // No images/ subfolder — fall back to root
    imagesDir = dir;
  }

  for await (const [name, entry] of imagesDir as unknown as AsyncIterable<[string, FileSystemHandle]>) {
    if (entry.kind === 'file') {
      const lower = name.toLowerCase();
      if (imageExtensions.some((ext) => lower.endsWith(ext))) {
        const fileHandle = entry as FileSystemFileHandle;
        files.push(await fileHandle.getFile());
      }
    }
  }
  return files;
}
