import {
  ZodAny,
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodBranded,
  ZodDate,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodEffects,
  ZodEnum,
  ZodFunction,
  ZodIntersection,
  ZodLiteral,
  ZodNativeEnum,
  ZodNever,
  ZodNull,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodPipeline,
  ZodPromise,
  ZodReadonly,
  ZodRecord,
  ZodString,
  ZodSymbol,
  ZodTuple,
  ZodType,
  ZodUndefined,
  ZodUnion,
  ZodUnknown,
  ZodVoid,
  z,
  type AnyZodObject,
  type EnumLike,
  type ZodTypeAny,
} from 'zod';
import type {
  AnyModel,
  ArrayModel,
  ArrayValidation,
  BigIntModel,
  BigIntValidation,
  BooleanModel,
  DateModel,
  EnumModel,
  ExportedSchema,
  FunctionModel,
  IntersectionModel,
  LiteralModel,
  Model,
  ModelMeta,
  ModelOrRef,
  NamedModel,
  NativeEnumModel,
  NeverModel,
  NullModel,
  NumberModel,
  NumberValidation,
  ObjectModel,
  PromiseModel,
  RecordModel,
  StringModel,
  StringValidation,
  SymbolModel,
  TupleModel,
  UndefinedModel,
  UnionModel,
  UnknownModel,
  VoidModel,
} from '../types';

export function convertSchemas(
  exportedSchemas: ExportedSchema[]
): NamedModel[] {
  return exportedSchemas.map(({ name, path, schema }) => ({
      name,
      path,
      ...convertSchema(schema, exportedSchemas),
      ...schemaToMeta(schema),
  }));
}

function createModelOrRef(
  schema: ZodType<unknown>,
  exportedSchemas: ExportedSchema[],
  implicitOptional?: boolean
): ModelOrRef {
  const exportedSchema = exportedSchemas.find(exp =>
    isSameSchema(schema, exp.schema)
  );
  if (exportedSchema) {
    const { schema: _, ...ref } = exportedSchema;
    return {
      kind: 'ref',
      ref: {
        ...ref,
        ...schemaToMeta(schema, implicitOptional),
      },
    };
  }
  return {
    kind: 'model',
    model: {
      ...convertSchema(schema, exportedSchemas),
      ...schemaToMeta(schema, implicitOptional),
    },
  };
}

function isSameSchema(currSchema: ZodTypeAny, namedSchema: ZodTypeAny) {
  // unwrap ZodOptional, ZodNullable, ZodDefault, etc.
  const currSchemaUnwrapped: ZodTypeAny | null =
    'innerType' in currSchema._def ? currSchema._def.innerType : null;

  // unwrap .describe() - every property except for description must be identical
  const isOnlyDescriptionChanged = (schema: ZodTypeAny) =>
    Object.keys(namedSchema._def).every(
      key => namedSchema._def[key] === schema._def[key]
    ) &&
    schema.description !== namedSchema.description &&
    Object.keys(schema._def)
      .filter(key => key !== 'description')
      .map(key => namedSchema._def[key] === schema._def[key]);

  return (
    currSchema === namedSchema ||
    currSchemaUnwrapped === namedSchema ||
    isOnlyDescriptionChanged(currSchema) ||
    (currSchemaUnwrapped != null &&
      isOnlyDescriptionChanged(currSchemaUnwrapped))
  );
}

function schemaToMeta(
  schema: ZodType<unknown>,
  implicitOptional?: boolean
): Omit<ModelMeta, 'default'> {
  return {
    ...(schema.description && { description: schema.description }),
    ...(!implicitOptional && schema.isOptional() && { optional: true }),
    ...(schema.isNullable() && { nullable: true }),
  };
}

function convertSchema(
  schema: ZodType<unknown>,
  exportedSchemas: ExportedSchema[]
): Model {
  if (
    schema instanceof ZodOptional ||
    schema.constructor.name === 'ZodOptional'
  ) {
    return convertSchema(
      (schema as ZodOptional<any>)._def.innerType,
      exportedSchemas
    );
  }
  if (
    schema instanceof ZodNullable ||
    schema.constructor.name === 'ZodNullable'
  ) {
    return convertSchema(
      (schema as ZodNullable<any>)._def.innerType,
      exportedSchemas
    );
  }
  if (
    schema instanceof ZodDefault ||
    schema.constructor.name === 'ZodDefault'
  ) {
    return {
      ...convertSchema(
        (schema as ZodDefault<any>)._def.innerType,
        exportedSchemas
      ),
      default: (schema as ZodDefault<any>)._def.defaultValue(),
    };
  }
  if (
    schema instanceof ZodReadonly ||
    schema.constructor.name === 'ZodReadonly'
  ) {
    return {
      ...convertSchema(
        (schema as ZodReadonly<any>)._def.innerType,
        exportedSchemas
      ),
      readonly: true,
    };
  }
  if (
    schema instanceof ZodEffects ||
    schema.constructor.name === 'ZodEffects'
  ) {
    return convertSchema(
      (schema as ZodEffects<any>)._def.schema,
      exportedSchemas
    );
  }
  if (
    schema instanceof ZodBranded ||
    schema.constructor.name === 'ZodBranded'
  ) {
    return convertSchema(
      (schema as ZodBranded<any, any>)._def.type,
      exportedSchemas
    );
  }

  if (schema instanceof ZodArray || schema.constructor.name === 'ZodArray') {
    return convertZodArray(schema as ZodArray<any>, exportedSchemas);
  }
  if (schema instanceof ZodObject || schema.constructor.name === 'ZodObject') {
    return convertZodObject(schema as AnyZodObject, exportedSchemas);
  }
  if (schema instanceof ZodString || schema.constructor.name === 'ZodString') {
    return convertZodString(schema as ZodString);
  }
  if (schema instanceof ZodNumber || schema.constructor.name === 'ZodNumber') {
    return convertZodNumber(schema as ZodNumber);
  }
  if (
    schema instanceof ZodBoolean ||
    schema.constructor.name === 'ZodBoolean'
  ) {
    return convertZodBoolean(schema as ZodBoolean);
  }
  if (schema instanceof ZodDate || schema.constructor.name === 'ZodDate') {
    return convertZodDate(schema as ZodDate);
  }
  if (schema instanceof ZodEnum || schema.constructor.name === 'ZodEnum') {
    return convertZodEnum(schema as ZodEnum<any>);
  }
  if (
    schema instanceof ZodNativeEnum ||
    schema.constructor.name === 'ZodNativeEnum'
  ) {
    return convertZodNativeEnum(schema as ZodNativeEnum<any>);
  }
  if (schema instanceof ZodUnion || schema.constructor.name === 'ZodUnion') {
    return convertZodUnion(schema as ZodUnion<any>, exportedSchemas);
  }
  if (
    schema instanceof ZodIntersection ||
    schema.constructor.name === 'ZodIntersection'
  ) {
    return convertZodIntersection(
      schema as ZodIntersection<any, any>,
      exportedSchemas
    );
  }
  if (schema instanceof ZodRecord || schema.constructor.name === 'ZodRecord') {
    return convertZodRecord(schema as ZodRecord<any, any>, exportedSchemas);
  }
  if (schema instanceof ZodTuple || schema.constructor.name === 'ZodTuple') {
    return convertZodTuple(schema as ZodTuple, exportedSchemas);
  }
  if (
    schema instanceof ZodFunction ||
    schema.constructor.name === 'ZodFunction'
  ) {
    return convertZodFunction(schema as ZodFunction<any, any>, exportedSchemas);
  }
  if (
    schema instanceof ZodPromise ||
    schema.constructor.name === 'ZodPromise'
  ) {
    return convertZodPromise(schema as ZodPromise<any>, exportedSchemas);
  }
  if (
    schema instanceof ZodLiteral ||
    schema.constructor.name === 'ZodLiteral'
  ) {
    return convertZodLiteral(schema as ZodLiteral<any>);
  }
  if (schema instanceof ZodNull || schema.constructor.name === 'ZodNull') {
    return convertZodNull(schema as ZodNull);
  }
  if (
    schema instanceof ZodUndefined ||
    schema.constructor.name === 'ZodUndefined'
  ) {
    return convertZodUndefined(schema as ZodUndefined);
  }
  if (schema instanceof ZodSymbol || schema.constructor.name === 'ZodSymbol') {
    return convertZodSymbol(schema as ZodSymbol);
  }
  if (schema instanceof ZodBigInt || schema.constructor.name === 'ZodBigInt') {
    return convertZodBigInt(schema as ZodBigInt);
  }
  if (
    schema instanceof ZodUnknown ||
    schema.constructor.name === 'ZodUnknown'
  ) {
    return convertZodUnknown(schema as ZodUnknown);
  }
  if (schema instanceof ZodAny || schema.constructor.name === 'ZodAny') {
    return convertZodAny(schema as ZodAny);
  }
  if (schema instanceof ZodVoid || schema.constructor.name === 'ZodVoid') {
    return convertZodVoid(schema as ZodVoid);
  }
  if (schema instanceof ZodNever || schema.constructor.name === 'ZodNever') {
    return convertZodNever(schema as ZodNever);
  }
  if (
    schema instanceof ZodPipeline ||
    schema.constructor.name === 'ZodPipeline'
  ) {
    return convertSchema(
      (schema as ZodPipeline<any, any>)._def.out,
      exportedSchemas
    );
  }
  if (
    schema instanceof ZodDiscriminatedUnion ||
    schema.constructor.name === 'ZodDiscriminatedUnion'
  ) {
    return {
      type: 'union',
      options: (schema as ZodDiscriminatedUnion<any, any>)._def.options.map(
        (option: any) => createModelOrRef(option, exportedSchemas)
      ),
    };
  }

  throw new Error(
    `Zod type ${
      'typeName' in schema._def ? schema._def.typeName : '<unknown>'
    } is not supported`
  );
}

function convertZodArray(
  schema: ZodArray<ZodTypeAny>,
  exportedSchemas: ExportedSchema[]
): ArrayModel {
  const possibleValidations: (ArrayValidation | null)[] = [
    schema._def.minLength && ['min', schema._def.minLength.value],
    schema._def.maxLength && ['max', schema._def.maxLength.value],
    schema._def.exactLength && ['length', schema._def.exactLength.value],
  ];
  const validations = possibleValidations.filter(
    (value): value is ArrayValidation => value != null
  );
  return {
    type: 'array',
    items: createModelOrRef(schema.element, exportedSchemas),
    ...(validations.length > 0 && { validations }),
  };
}

function convertZodObject(
  schema: AnyZodObject,
  exportedSchemas: ExportedSchema[]
): ObjectModel {
  return {
    type: 'object',
    fields: Object.entries(schema._def.shape())
      .filter(
        (pair): pair is [string, ZodType] =>
          pair[1] instanceof ZodType ||
          pair[1]?.constructor?.name.indexOf('Zod') === 0
      )
      .map(([key, value]) => ({
        key,
        required: !value.isOptional(),
        ...createModelOrRef(value, exportedSchemas, true),
      })),
  };
}

function convertZodString(schema: ZodString): StringModel {
  return {
    type: 'string',
    ...(schema._def.checks.length > 0 && {
      validations: schema._def.checks
        .map((check): StringValidation | null => {
          switch (check.kind) {
            case 'min':
            case 'max':
            case 'length':
              return [check.kind, check.value];
            case 'email':
            case 'url':
            case 'emoji':
            case 'uuid':
            case 'cuid':
            case 'cuid2':
            case 'ulid':
              return check.kind;
            case 'regex':
              return [check.kind, check.regex];
            case 'includes':
            case 'startsWith':
            case 'endsWith':
              return [check.kind, check.value];
            case 'datetime':
              return [
                check.kind,
                { offset: check.offset, precision: check.precision },
              ];
            case 'ip':
              return [check.kind, { version: check.version }];
            case 'toLowerCase':
            case 'toUpperCase':
            case 'trim':
              return null;
          }
        })
        .filter((value): value is StringValidation => value != null),
    }),
  };
}

function convertZodNumber(schema: ZodNumber): NumberModel {
  return {
    type: 'number',
    ...(schema._def.checks.length > 0 && {
      validations: schema._def.checks.map((check): NumberValidation => {
        switch (check.kind) {
          case 'min':
            return [check.inclusive ? 'gte' : 'gt', check.value];
          case 'max':
            return [check.inclusive ? 'lte' : 'lt', check.value];
          case 'multipleOf':
            return [check.kind, check.value];
          case 'int':
          case 'finite':
            return check.kind;
        }
      }),
    }),
  };
}

function convertZodBoolean(schema: ZodBoolean): BooleanModel {
  return {
    type: 'boolean',
  };
}

function convertZodDate(schema: ZodDate): DateModel {
  return {
    type: 'date',
  };
}

function convertZodEnum(schema: ZodEnum<[string, ...string[]]>): EnumModel {
  return {
    type: 'enum',
    values: schema._def.values,
  };
}

function convertZodNativeEnum(
  schema: ZodNativeEnum<EnumLike>
): NativeEnumModel {
  return {
    type: 'native-enum',
    enum: schema.enum,
  };
}

function convertZodUnion(
  schema: ZodUnion<readonly [ZodTypeAny, ...ZodTypeAny[]]>,
  exportedSchemas: ExportedSchema[]
): UnionModel {
  return {
    type: 'union',
    options: schema._def.options.map(option =>
      createModelOrRef(option, exportedSchemas)
    ),
  };
}

function convertZodIntersection(
  schema: ZodIntersection<ZodTypeAny, ZodTypeAny>,
  exportedSchemas: ExportedSchema[]
): IntersectionModel {
  return {
    type: 'intersection',
    parts: [
      createModelOrRef(schema._def.left, exportedSchemas),
      createModelOrRef(schema._def.right, exportedSchemas),
    ],
  };
}

function convertZodRecord(
  schema: ZodRecord,
  exportedSchemas: ExportedSchema[]
): RecordModel {
  return {
    type: 'record',
    keys: createModelOrRef(schema._def.keyType, exportedSchemas),
    values: createModelOrRef(schema._def.valueType, exportedSchemas),
  };
}

function convertZodTuple(
  schema: ZodTuple,
  exportedSchemas: ExportedSchema[]
): TupleModel {
  return {
    type: 'tuple',
    items: schema._def.items.map(item =>
      createModelOrRef(item, exportedSchemas)
    ),
    ...(schema._def.rest != null && {
      rest: createModelOrRef(schema._def.rest, exportedSchemas),
    }),
  };
}

function convertZodFunction(
  schema: ZodFunction<ZodTuple<any>, ZodTypeAny>,
  exportedSchemas: ExportedSchema[]
): FunctionModel {
  return {
    type: 'function',
    // TODO: support rest args? what about implicit `...unknown[]`?
    parameters: (schema._def.args.items as ZodTypeAny[]).map(param =>
      createModelOrRef(param, exportedSchemas)
    ),
    returnValue: createModelOrRef(schema._def.returns, exportedSchemas),
  };
}

function convertZodPromise(
  schema: ZodPromise<ZodTypeAny>,
  exportedSchemas: ExportedSchema[]
): PromiseModel {
  return {
    type: 'promise',
    resolvedValue: createModelOrRef(schema._def.type, exportedSchemas),
  };
}

function convertZodLiteral(schema: ZodLiteral<z.Primitive>): LiteralModel {
  return {
    type: 'literal',
    value: schema._def.value,
  };
}

function convertZodNull(schema: ZodNull): NullModel {
  return {
    type: 'null',
  };
}

function convertZodUndefined(schema: ZodUndefined): UndefinedModel {
  return {
    type: 'undefined',
  };
}

function convertZodSymbol(schema: ZodSymbol): SymbolModel {
  return {
    type: 'symbol',
  };
}

function convertZodBigInt(schema: ZodBigInt): BigIntModel {
  return {
    type: 'bigint',
    ...(schema._def.checks.length > 0 && {
      validations: schema._def.checks.map((check): BigIntValidation => {
        switch (check.kind) {
          case 'min':
            return [check.inclusive ? 'gte' : 'gt', check.value];
          case 'max':
            return [check.inclusive ? 'lte' : 'lt', check.value];
          case 'multipleOf':
            return [check.kind, check.value];
        }
      }),
    }),
  };
}

function convertZodUnknown(schema: ZodUnknown): UnknownModel {
  return {
    type: 'unknown',
  };
}

function convertZodAny(schema: ZodAny): AnyModel {
  return {
    type: 'any',
  };
}

function convertZodVoid(schema: ZodVoid): VoidModel {
  return {
    type: 'void',
  };
}

function convertZodNever(schema: ZodNever): NeverModel {
  return {
    type: 'never',
  };
}
