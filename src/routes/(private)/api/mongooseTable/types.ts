import * as models from '$lib/server/mongoose/models';

export { type Model } from 'mongoose';
export type ModelName = keyof typeof models;
export type UiFilter = { key: string; operator: string; value: any };
