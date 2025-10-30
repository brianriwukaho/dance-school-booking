import { z } from 'zod';

export const errorResponseDTOSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    correlationId: z.string().optional(),
  }),
});

export type ErrorResponseDTO = z.infer<typeof errorResponseDTOSchema>;
