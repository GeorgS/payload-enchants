import type { Plugin } from 'payload';

import type { SanitizedArgsContext } from '../types.js';
import { extendCollectionConfig } from './extendCollectionConfig.js';
import { extendGlobalConfig } from './extendGlobalConfig.js';

export const buildPlugin = (ctx: SanitizedArgsContext): Plugin => {
  return (config) => {
    return {
      ...config,
      collections: (config.collections ?? []).map((collection) => {
        const cachedCollectionConfig = ctx.collections.find(
          (each) => each.slug === collection.slug,
        );

        if (!cachedCollectionConfig) return collection;

        return extendCollectionConfig({ cachedCollectionConfig, collection, ctx });
      }),
      globals: (config.globals ?? []).map((global) => {
        const cachedCollectionConfig = ctx.globals.find((each) => each.slug === global.slug);

        if (!cachedCollectionConfig) return global;

        return extendGlobalConfig({ ctx, global });
      }),
    };
  };
};
