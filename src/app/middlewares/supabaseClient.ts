import { createClient } from "@supabase/supabase-js";
import config from "../config";

const supabase = createClient(
  config.supabase.url as string,
  config.supabase.key as string,
);

export default supabase;
