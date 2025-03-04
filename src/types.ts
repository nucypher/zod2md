import { z, type EnumLike, type ZodType } from 'zod';
import type { FormatterOptions } from './formatter';
import type { LoaderOptions } from './loader';

export type Options = LoaderOptions & FormatterOptions;

export type Config = Options & { output: string };

export type ExportedSchema = {
  name?: string;
  schema: ZodType<unknown>;
  path: string;
};

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type NamedModel = Model & Ref;

export type Model = (
  | ArrayModel
  | ObjectModel
  | StringModel
  | NumberModel
  | BooleanModel
  | DateModel
  | EnumModel
  | NativeEnumModel
  | UnionModel
  | IntersectionModel
  | RecordModel
  | TupleModel
  | FunctionModel
  | PromiseModel
  | LiteralModel
  | NullModel
  | UndefinedModel
  | SymbolModel
  | BigIntModel
  | UnknownModel
  | AnyModel
  | VoidModel
  | NeverModel
) &
  ModelMeta;

/**
 * The lazy model is used to defer the evaluation of a model till other modules has been processed.
 * This is needed because the lazy model typically references some another models that is not yet defined.
 * The deferred function should return the model that is being referenced.
 * At some later processgin step, the deferred function will be called and the actual model will be used instead of the lazy model.
 **/
export type LazyDeferredModel = {
  deferred?: () => Model;
};

export type Ref = {
  name?: string;
  path: string;
} & ModelMeta;

export type ModelMeta = {
  description?: string;
  default?: unknown;
  optional?: boolean;
  nullable?: boolean;
  readonly?: boolean;
};

export type ModelOrRef =
  | { kind: 'model'; model: Model }
  | { kind: 'ref'; ref: Ref };

export type ArrayModel = {
  type: 'array';
  items: ModelOrRef;
  validations?: ArrayValidation[];
};

export type ObjectModel = {
  type: 'object';
  fields: ({
    key: string;
    required: boolean;
  } & ModelOrRef)[];
};

export type StringModel = {
  type: 'string';
  validations?: StringValidation[];
};

export type NumberModel = {
  type: 'number';
  validations?: NumberValidation[];
};

export type BooleanModel = {
  type: 'boolean';
};

export type DateModel = {
  type: 'date';
};

export type EnumModel = {
  type: 'enum';
  values: string[];
};

export type NativeEnumModel = {
  type: 'native-enum';
  enum: EnumLike;
};

export type UnionModel = {
  type: 'union';
  options: ModelOrRef[];
};

export type IntersectionModel = {
  type: 'intersection';
  parts: [ModelOrRef, ModelOrRef];
};

export type RecordModel = {
  type: 'record';
  keys: ModelOrRef;
  values: ModelOrRef;
};

export type TupleModel = {
  type: 'tuple';
  items: ModelOrRef[];
  rest?: ModelOrRef;
};

export type FunctionModel = {
  type: 'function';
  parameters: ModelOrRef[];
  returnValue: ModelOrRef;
};

export type PromiseModel = {
  type: 'promise';
  resolvedValue: ModelOrRef;
};

export type LiteralModel = {
  type: 'literal';
  value: z.Primitive;
};

export type NullModel = {
  type: 'null';
};

export type UndefinedModel = {
  type: 'undefined';
};

export type SymbolModel = {
  type: 'symbol';
};

export type BigIntModel = {
  type: 'bigint';
  validations?: BigIntValidation[];
};

export type UnknownModel = {
  type: 'unknown';
};

export type AnyModel = {
  type: 'any';
};

export type VoidModel = {
  type: 'void';
};

export type NeverModel = {
  type: 'never';
};

export type ArrayValidation =
  | ['min', number]
  | ['max', number]
  | ['length', number];

export type StringValidation =
  | ['min', number]
  | ['max', number]
  | ['length', number]
  | 'email'
  | 'url'
  | 'emoji'
  | 'uuid'
  | 'cuid'
  | 'cuid2'
  | 'ulid'
  | ['regex', RegExp]
  | ['includes', string]
  | ['startsWith', string]
  | ['endsWith', string]
  | ['datetime', { offset: boolean; precision: number | null }]
  | ['ip', { version?: 'v4' | 'v6' }];

export type NumberValidation =
  | ['gt', number]
  | ['gte', number]
  | ['lt', number]
  | ['lte', number]
  | 'int'
  | ['multipleOf', number]
  | 'finite'
  | 'safe';

export type BigIntValidation =
  | ['gt', bigint]
  | ['gte', bigint]
  | ['lt', bigint]
  | ['lte', bigint]
  | ['multipleOf', bigint];
