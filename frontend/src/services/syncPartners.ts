import { partnersApi } from '../api/partners';
import { mediaApi } from '../api/media';

interface SyncProgress {
  total: number;
  current: number;
  currentName: string;
  errors: string[];
}

/**
 * Sync partners from a local folder selected via File System Access API.
 * Each subfolder should contain: name.txt and a logo image file.
 */
export async function syncPartnersFromFolder(
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
      const name = (await readTextFile(folder, 'name.txt')).trim();

      if (!name) {
        progress.errors.push(`${folder.name}: No name found, skipping`);
        continue;
      }

      let imgUrl = '';
      const imageFile = await findImageFile(folder);
      if (imageFile) {
        try {
          const res = await mediaApi.upload(imageFile, 'partners');
          imgUrl = res.data.url;
        } catch {
          progress.errors.push(`${folder.name}: Image upload failed`);
        }
      }

      await partnersApi.create({
        name: { en: name, ar: name },
        img: imgUrl,
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
