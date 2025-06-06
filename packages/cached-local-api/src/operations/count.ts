import type { CollectionSlug, Payload } from 'payload';

import type { Count, CountArgs, SanitizedArgsContext } from '../types.js';

export const buildCount = ({
  ctx,
  payload,
}: {
  ctx: SanitizedArgsContext;
  payload: Payload;
}): Count => {
  return async function count<T extends CollectionSlug>(args: CountArgs<T>) {
    const shouldCache = (await ctx.shouldCacheCountOperation(args)) && !ctx.disableCache;

    if (!shouldCache) return payload.count(args);

    const locale = args.locale ?? args.req?.locale;

    const user = args.req?.user ?? args.user;

    let userKey = user;

    if (user && 'collection' in user && 'id' in user) {
      userKey = [user.collection, user.id];
    }

    const keys = [
      'count',
      args.collection,
      locale,
      args.where,
      args.overrideAccess,
      userKey,
      args.context,
    ];

    let cacheHit = true;

    const start = Date.now();

    const result = await ctx.unstable_cache(
      () => {
        cacheHit = false;

        return payload.count(args);
      },
      [JSON.stringify(keys)],
      {
        tags: [
          ctx.useSimpleCacheStrategy
            ? ctx.SIMPLE_CACHE_TAG
            : ctx.buildTagFind({ slug: args.collection as string }),
        ],
      },
    )();

    if (cacheHit) {
      ctx.debugLog({
        message: `Cache HIT, operation: count, collection: ${args.collection.toString()}`,
        payload,
      });
    } else {
      ctx.debugLog({
        message: `Cache SKIP, operation: cound, collection: ${args.collection.toString()}, execution time - ${Date.now() - start} MS`,
        payload,
      });
    }

    return result;
  };
};
