import { convertSchemas } from './converter';
import { formatModelsAsMarkdown } from './formatter/format';
import { loadZodSchemas } from './loader/loader';
import type { Options } from './types';

export async function zod2md(options: Options): Promise<string> {
  const schemas = await loadZodSchemas(options);
  const models = convertSchemas(schemas);
  return formatModelsAsMarkdown(models, options);
}

export { convertSchemas, formatModelsAsMarkdown, loadZodSchemas };

export { findZodSchemas } from './loader/find-schemas';
export type { LoaderOptions, ImportedModules } from './loader/types';
export { groupPromiseResultsByStatus } from './loader/utils';
export type { Config, Options, ExportedSchema } from './types';
