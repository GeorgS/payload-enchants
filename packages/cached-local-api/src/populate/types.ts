import type { CollectionConfig, CollectionSlug, PopulateType } from 'payload';
import { FindArgs } from '../types.js';

export type PopulationItem = {
  accessor: number | string;
  collection: CollectionConfig;
  id: number | string;
  select?: NonNullable<FindArgs<CollectionSlug>['populate']>[number];
  populated?: {
    id: number | string;
  } & Record<string, unknown>;
  ref: Record<string, unknown>;
};

export type PopulatedPromises = Promise<{
  collection: string;
  id: number | string;
  value: unknown;
}>[];
