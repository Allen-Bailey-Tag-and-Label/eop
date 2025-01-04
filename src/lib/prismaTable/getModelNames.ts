import { getModels } from './';

export const getModelNames = () => getModels().map(({ name }) => name);
