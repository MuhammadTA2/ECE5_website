export type UploadQueueStatus = 'ready' | 'uploading' | 'done' | 'error';

export function retryableUploadIndexes(items: ReadonlyArray<{ status: UploadQueueStatus }>): number[] {
  return items.flatMap((item, index) => item.status === 'ready' || item.status === 'error' ? [index] : []);
}

export function uploadFileIdentity(file: Pick<File, 'name' | 'size' | 'lastModified'>): string {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}`;
}
