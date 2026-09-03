import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { SuccessResponseDTO } from '../dto/success-response.dto';

type ApiDataType =
  | Type<unknown>
  | 'string'
  | 'boolean'
  | 'number'
  | [Type<unknown>]
  | Record<
      string,
      Type<unknown> | [Type<unknown>] | 'string' | 'boolean' | 'number'
    >;

export const ApiSuccessResponse = (
  typeOrDto: ApiDataType,
  options: { status?: number; description?: string; message?: string } = {},
) => {
  const isPrimitive = typeof typeOrDto === 'string';
  const isArray = Array.isArray(typeOrDto);
  const isObjectMap =
    !isPrimitive &&
    !isArray &&
    typeof typeOrDto === 'object' &&
    typeOrDto !== null &&
    Object.getPrototypeOf(typeOrDto) === Object.prototype;

  let dtoClass: Type<unknown> | null = null;
  const extraModels = new Set<Type<unknown>>();
  extraModels.add(SuccessResponseDTO);

  if (isArray) {
    dtoClass = typeOrDto[0];
    if (dtoClass) extraModels.add(dtoClass);
  } else if (!isPrimitive && !isObjectMap) {
    dtoClass = typeOrDto as Type<unknown>;
    if (dtoClass) extraModels.add(dtoClass);
  }

  let dataPropertySchema: any = {};

  if (isPrimitive) {
    dataPropertySchema = { type: typeOrDto as string };
  } else if (isArray) {
    dataPropertySchema = {
      type: 'array',
      items: { $ref: getSchemaPath(dtoClass) },
    };
  } else if (isObjectMap) {
    const properties: Record<string, any> = {};
    for (const [key, value] of Object.entries(
      typeOrDto as Record<string, any>,
    )) {
      if (typeof value === 'string') {
        properties[key] = { type: value };
      } else if (Array.isArray(value)) {
        const itemClass = value[0];
        if (itemClass) extraModels.add(itemClass);
        properties[key] = {
          type: 'array',
          items: { $ref: getSchemaPath(itemClass) },
        };
      } else {
        extraModels.add(value);
        properties[key] = { $ref: getSchemaPath(value) };
      }
    }
    dataPropertySchema = {
      type: 'object',
      properties,
    };
  } else {
    dataPropertySchema = { $ref: getSchemaPath(dtoClass) };
  }

  const decoratorsToApply = [
    ApiResponse({
      status: options.status || 200,
      description: options.description || 'Operation successful',
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResponseDTO) },
          {
            properties: {
              ...(options.message
                ? { message: { type: 'string', example: options.message } }
                : {}),
              ...(options.status
                ? { statusCode: { type: 'number', example: options.status } }
                : {}),
              data: dataPropertySchema,
            },
          },
        ],
      },
    }),
    ApiExtraModels(...Array.from(extraModels)),
  ];

  return applyDecorators(...decoratorsToApply);
};
