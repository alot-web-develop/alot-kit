import { createUploadService, validateUpload } from '@alot-web-develop/server/upload';
import type { TPresignedUpload, TUploadRules } from '@alot-web-develop/server/upload';
import { expect, expectTypeOf, test } from 'vitest';

test('loads the packed upload subpath and signs locally without contacting storage', async () => {
  const rules = { maxFileSize: 1024, allowedMimeTypes: ['image/png'] } satisfies TUploadRules;
  const request = { scope: 'avatars', ownerId: 'user-1', fileName: 'photo.png', mimeType: 'image/png', size: 42 };
  expect(validateUpload(request, rules)).toBeNull();
  const service = createUploadService({ accountId: 'fixture', accessKeyId: 'fixture-key', secretAccessKey: 'fixture-secret', bucket: 'uploads' }, rules);
  const upload = await service.presignPut(request);
  expectTypeOf(upload).toEqualTypeOf<TPresignedUpload>();
  expect(upload.key).toMatch(/^avatars\/user-1\//);
  expect(upload.method).toBe('PUT');
  expect(upload.headers).toEqual({ 'content-type': 'image/png', 'content-length': '42' });
  expect(new URL(upload.url).searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
  await expect(service.presignPut({ ...request, size: 1025 })).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' });
});
