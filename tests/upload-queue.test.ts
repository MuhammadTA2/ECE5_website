import { describe, expect, it } from 'vitest';
import { retryableUploadIndexes, uploadFileIdentity } from '@/lib/upload-queue';

describe('upload retry queue', () => {
  it('retries only ready and failed uploads', () => {
    expect(retryableUploadIndexes([
      { status: 'done' },
      { status: 'error' },
      { status: 'ready' },
      { status: 'uploading' },
    ])).toEqual([1, 2]);
  });

  it('uses stable file properties to identify duplicates', () => {
    const file = { name: 'board.jpg', size: 1234, lastModified: 5678 };
    expect(uploadFileIdentity(file)).toBe(uploadFileIdentity({ ...file }));
    expect(uploadFileIdentity(file)).not.toBe(uploadFileIdentity({ ...file, size: 1235 }));
  });
});
