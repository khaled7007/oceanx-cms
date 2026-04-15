import { reportsApi } from '../api/reports';
import { mediaApi } from '../api/media';
import { ReportStatus } from '../types';
import { uploadFile } from './storage.service';
import { galleryApi } from '../api/gallery';

interface SyncProgress {
  total: number;
  current: number;
  currentName: string;
  errors: string[];
}

/**
 * Sync reports from a local folder selected via File System Access API.
 * Each subfolder should contain: title_ar.txt, title_en.txt, date.txt,
 * description_en.txt, description_ar.txt, cover image, and optionally report.pdf.
 */
export async function syncReportsFromFolder(
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
      const date = (await readTextFile(folder, 'date.txt')).trim();
      const descEn = await readTextFile(folder, 'description_en.txt');
      const descAr = await readTextFile(folder, 'description_ar.txt');

      if (!titleEn.trim() && !titleAr.trim()) {
        progress.errors.push(`${folder.name}: No title found, skipping`);
        continue;
      }

      // Upload cover image
      let coverImageUrl = '';
      const imageFile = await findImageFile(folder);
      if (imageFile) {
        try {
          const res = await mediaApi.upload(imageFile, 'reports');
          coverImageUrl = res.data.url;
        } catch {
          progress.errors.push(`${folder.name}: Cover image upload failed`);
        }
      }

      // Upload PDF if present
      let fileUrl = '';
      const pdfFile = await findPdfFile(folder);
      if (pdfFile) {
        try {
          const path = `reports/${Date.now()}_${pdfFile.name}`;
          fileUrl = await uploadFile(pdfFile, path);
          await galleryApi.addToGallery(fileUrl, 'reports');
        } catch {
          progress.errors.push(`${folder.name}: PDF upload failed`);
        }
      }

      await reportsApi.create({
        title: { en: titleEn.trim(), ar: titleAr.trim() },
        description: { en: descEn.trim(), ar: descAr.trim() },
        categories: [],
        date: date || undefined,
        cover_image: coverImageUrl,
        file_url: fileUrl,
        status: ReportStatus.Published,
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
        return (entry as FileSystemFileHandle).getFile();
      }
    }
  }
  return null;
}

async function findPdfFile(dir: FileSystemDirectoryHandle): Promise<File | null> {
  for await (const [name, entry] of dir as unknown as AsyncIterable<[string, FileSystemHandle]>) {
    if (entry.kind === 'file' && name.toLowerCase().endsWith('.pdf')) {
      return (entry as FileSystemFileHandle).getFile();
    }
  }
  return null;
}
