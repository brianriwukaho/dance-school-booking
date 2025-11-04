import { z } from "zod";

export const bookClassRequestDTOSchema = z.object({
  email: z.string().email(),
});

export type BookClassRequestDTO = z.infer<typeof bookClassRequestDTOSchema>;

export const bookClassResponseDTOSchema = z.object({
  classId: z.string(),
  email: z.string().email(),
  bookedAt: z.string(), // ISO date-time string
});

export type BookClassResponseDTO = z.infer<typeof bookClassResponseDTOSchema>;
