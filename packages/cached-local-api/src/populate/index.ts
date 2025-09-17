// experimental

import type {
  CollectionSlug,
  Field,
  Payload,
  PayloadRequest,
  RequestContext,
  TypedLocale,
} from 'payload';

import type { Find, FindArgs, SanitizedArgsContext } from '../types.js';
import { traverseFields } from './traverseFields.js';
import type { PopulationItem } from './types.js';

export const populateDocRelationships = async ({
  context,
  ctx,
  depth,
  docs,
  draft,
  fallbackLocale,
  find,
  locale,
  overrideAccess,
  payload,
  populatedDocsMap,
  populate,
  req,
  showHiddenFields,
  user,
}: {
  context?: RequestContext;
  ctx: SanitizedArgsContext;
  currentDepth?: number;
  depth: number;
  docs: { data: any; fields: Field[] }[];
  draft?: boolean;
  fallbackLocale?: string | false;
  find: Find;
  locale?: string;
  overrideAccess?: boolean;
  payload: Payload;
  populatedDocsMap: Map<string, Record<string, any>>;
  populate?: FindArgs<CollectionSlug>['populate'];
  req?: Partial<PayloadRequest>;
  showHiddenFields?: boolean;
  user?: Record<string, any>;
}) => {
  if (!depth) return;

  const populationLists = docs.map((doc) => {
    const populationList: PopulationItem[] = [];

    traverseFields({ data: doc.data, fields: doc.fields, payload, populationList, populate });

    return { doc, populationList };
  });

  const populationList = populationLists.flatMap((each) => each.populationList);

  const populatedPromises: Promise<{
    collection: string;
    docs: unknown[];
  }>[] = [];

  const collections = new Set(populationList.map((each) => each.collection.slug));

  collections.forEach((collection) => {
    const ids = new Set(
      populationList
        .filter(
          (each) =>
            each.collection.slug === collection &&
            !populatedDocsMap.has(`${collection}-${each.id}`),
        )
        .map((each) => {
          return each.id;
        }),
    );

    const select = populationList.find((each) => each.collection.slug === collection)?.select;

    const uniqueIds = Array.from(ids);

    // in case we would generate more then the 128 tags vercel limit
    // we opt for the more general find tag that will update this when
    // any document of the collection is updated
    const tags =
      uniqueIds.length > 128
        ? [ctx.buildTagFind({ slug: collection })]
        : uniqueIds.map((each) =>
            ctx.buildTagFindByID({
              id: each,
              slug: collection,
            }),
          );

    populatedPromises.push(
      new Promise(async (resolve) => {
        const { docs } = await find({
          collection: collection as CollectionSlug,
          context,
          currentDepth: depth,
          depth: 0,
          disableErrors: true,
          draft,
          fallbackLocale: fallbackLocale as TypedLocale,
          locale: locale as TypedLocale,
          overrideAccess,
          pagination: false,
          select,
          populate,
          populatedDocsMap,
          req,
          showHiddenFields,
          tags,
          user,
          where: {
            id: {
              in: Array.from(ids),
            },
          },
        });

        for (const doc of docs) {
          populatedDocsMap.set(`${collection}-${doc.id}`, doc);
        }

        return resolve({ collection, docs });
      }),
    );
  });

  for (const promise of populatedPromises) {
    await promise;
  }

  const nextDepthData = [] as { data: any; fields: Field[] }[];

  for (const item of populationList) {
    const populatedDoc = populatedDocsMap.get(`${item.collection.slug}-${item.id}`);

    if (!populatedDoc || typeof populatedDoc !== 'object') {
      continue;
    }

    item.ref[item.accessor] = JSON.parse(JSON.stringify(populatedDoc));

    if (depth > 1)
      nextDepthData.push({ data: item.ref[item.accessor], fields: item.collection.fields });
  }

  if (depth > 1) {
    await populateDocRelationships({
      context,
      ctx,
      depth: depth - 1,
      docs: nextDepthData,
      draft,
      fallbackLocale,
      find,
      locale,
      populate,
      overrideAccess,
      payload,
      populatedDocsMap,
      req,
      showHiddenFields,
      user,
    });
  }
};
