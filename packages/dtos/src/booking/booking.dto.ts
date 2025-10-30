import { z } from 'zod';

// Book Class
export const bookClassRequestDTOSchema = z.object({
  email: z.string().email(),
});

export type BookClassRequestDTO = z.infer<typeof bookClassRequestDTOSchema>;

export const bookClassResponseDTOSchema = z.object({
  bookingId: z.string(),
  classId: z.string(),
  email: z.string().email(),
  createdAt: z.string(), // ISO date-time string
});

export type BookClassResponseDTO = z.infer<typeof bookClassResponseDTOSchema>;
