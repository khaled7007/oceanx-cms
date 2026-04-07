const WORKER_URL = import.meta.env.VITE_R2_WORKER_URL;
const UPLOAD_SECRET = import.meta.env.VITE_R2_UPLOAD_SECRET;

/**
 * Upload a file to Cloudflare R2 via Worker and return its public URL.
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${WORKER_URL}/${encodeURIComponent(path)}`);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('X-Upload-Secret', UPLOAD_SECRET);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { url } = JSON.parse(xhr.responseText);
        resolve(url);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
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
  const key = urlOrPath.startsWith('http')
    ? new URL(urlOrPath).pathname.slice(1)
    : urlOrPath;

  await fetch(`${WORKER_URL}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { 'X-Upload-Secret': UPLOAD_SECRET },
  });
}
