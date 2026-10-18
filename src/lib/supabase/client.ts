import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../database.types";

import { supabaseUrl, supabasePublicKey as supabaseKey } from "./config";

export const createClient = () =>
  createBrowserClient<Database>(
    supabaseUrl!,
    supabaseKey!,
  );