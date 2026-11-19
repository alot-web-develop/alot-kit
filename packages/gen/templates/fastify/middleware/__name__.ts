import { createHash, timingSafeEqual } from 'node:crypto';
import { unauthorized } from '@alot-web-develop/server';
import type { FastifyRequest } from 'fastify';

const HEADER = 'x-__name-kebab__';

const digest = (value: string) => createHash('sha256').update(value).digest();

const require__Name__ = (secret: string) => {
  const expected = digest(secret);

  return async (request: FastifyRequest) => {
    const provided = request.headers[HEADER];
    if (typeof provided !== 'string' || !timingSafeEqual(digest(provided), expected)) {
      throw unauthorized(`Invalid ${HEADER} header`);
    }
  };
};

export { require__Name__ };
