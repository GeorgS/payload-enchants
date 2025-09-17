import type { CollectionSlug, Payload } from 'payload';

import type { PopulationItem } from './types.js';
import { FindArgs } from '../types.js';

export const traverseRichText = ({
  data,
  payload,
  populationList,
  populate,
}: {
  data: any;
  payload: Payload;
  populationList: PopulationItem[];
  populate?: FindArgs<CollectionSlug>['populate'];
}): any => {
  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (item && typeof item === 'object')
        traverseRichText({ data: item, payload, populate, populationList });
    });
  } else if (data && typeof data === 'object') {
    Object.keys(data).forEach((key) => {
      const isRelationship = key === 'value' && 'relationTo' in data;

      if (isRelationship) {
        const id = data[key] && typeof data[key] === 'object' ? data[key].id : data[key];

        const collection = payload.collections[data.relationTo]?.config;

        if (id && collection)
          populationList.push({
            accessor: 'value',
            collection,
            id,
            ref: data,
            select: populate?.[collection.slug],
          });
      } else {
        if (data[key] && typeof data[key] === 'object')
          traverseRichText({ data: data[key], payload, populate, populationList });
      }
    });
  }
};
