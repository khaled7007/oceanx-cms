import { auth } from '../lib/firebase';

const WORKER_URL = import.meta.env.VITE_R2_WORKER_URL;

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

/**
 * Upload a file to Cloudflare R2 via Worker and return its public URL.
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const idToken = await getIdToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${WORKER_URL}/${encodeURIComponent(path)}`);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const { url } = JSON.parse(xhr.responseText) as { url: string };
          resolve(url);
        } catch {
          reject(new Error(`Upload failed: unexpected response (status ${xhr.status})`));
        }
      } else {
        let message = `Upload failed: ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          if (body.error) message = `Upload failed: ${body.error}`;
        } catch { /* ignore parse errors */ }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

/**
 * Delete a file from R2 via Worker.
 */
export async function deleteFile(urlOrPath: string): Promise<void> {
  const idToken = await getIdToken();
  const key = urlOrPath.startsWith('http')
    ? new URL(urlOrPath).pathname.slice(1)
    : urlOrPath;

  const response = await fetch(`${WORKER_URL}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!response.ok) {
    let message = `Delete failed: ${response.status}`;
    try {
      const body = await response.json() as { error?: string };
      if (body.error) message = `Delete failed: ${body.error}`;
    } catch { /* ignore parse errors */ }
    throw new Error(message);
  }
}
