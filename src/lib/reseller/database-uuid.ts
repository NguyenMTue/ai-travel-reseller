import { z } from "zod";

// PostgreSQL UUID output is 8-4-4-4-12 hex. It does not require RFC variant
// bits: the checked-in seed intentionally uses IDs that z.uuid() rejects.
// Keep format validation; authorization still requires the verified user's row.
export const databaseUuidSchema = z.guid();
