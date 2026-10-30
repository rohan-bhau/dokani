import { z } from '@dokani/shared';

const envSchema = z.object({
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || undefined,
});

export type Env = z.infer<typeof envSchema>;
