import type { Payload } from 'payload';

import { buildCount } from './operations/count.js';
import { buildFind } from './operations/find.js';
import { buildFindByID } from './operations/findByID.js';
import { buildFindGlobal } from './operations/findGlobal.js';
import { buildFindOne } from './operations/findOne.js';
import { buildPlugin } from './plugin/index.js';
import { sanitizedArgsContext } from './sanitizedArgsContext.js';
import type { Args, CachedPayload, CachedPayloadResult } from './types.js';

export { CachedPayload };

export const buildCachedPayload = (args: Args): CachedPayloadResult => {
  const ctx = sanitizedArgsContext(args);

  const plugin = buildPlugin(ctx);

  const getCachedPayload = function (payload: Payload): CachedPayload {
    const find = buildFind({
      ctx,
      payload,
    });

    const findByID = buildFindByID({ ctx, find, payload });

    const findGlobal = buildFindGlobal({
      ctx,
      find,
      payload,
    });

    const findOne = buildFindOne({ ctx, find, payload });

    const count = buildCount({
      ctx,
      payload,
    });

    return {
      count,
      find,
      findByID,
      findGlobal,
      findOne,
    };
  };

  return {
    cachedPayloadPlugin: plugin,
    getCachedPayload,
  };
};
