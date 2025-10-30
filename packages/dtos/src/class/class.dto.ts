import { z } from 'zod';

export const classTypeDTOSchema = z.enum(['salsa', 'bachata', 'reggaeton', 'any']);
export type ClassTypeDTO = z.infer<typeof classTypeDTOSchema>;

export const classLevelDTOSchema = z.number().min(1).max(3);
export type ClassLevelDTO = z.infer<typeof classLevelDTOSchema>;

export const classDTOSchema = z.object({
  id: z.string(),
  type: classTypeDTOSchema.exclude(['any']),
  level: classLevelDTOSchema.optional(),
  date: z.string(), // ISO date string (YYYY-MM-DD)
  startTime: z.string(), // Time string (HH:mm)
  maxSpots: z.number().positive(),
  spotsRemaining: z.number().min(0),
});

export type ClassDTO = z.infer<typeof classDTOSchema>;

// Search Classes
export const searchClassesRequestDTOSchema = z.object({
  type: classTypeDTOSchema.default('any'),
});

export type SearchClassesRequestDTO = z.infer<typeof searchClassesRequestDTOSchema>;

export const searchClassesResponseDTOSchema = z.object({
  classes: z.array(classDTOSchema),
});

export type SearchClassesResponseDTO = z.infer<typeof searchClassesResponseDTOSchema>;

// Get Class
export const getClassResponseDTOSchema = classDTOSchema;
export type GetClassResponseDTO = z.infer<typeof getClassResponseDTOSchema>;
