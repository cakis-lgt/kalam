/** Map PostgREST / Supabase errors to actionable setup messages. */
export function friendlyDbError(message: string): string {
  if (
    message.includes("Could not find the table") ||
    message.includes("PGRST205")
  ) {
    return (
      "ALIKHTIBAR database is not set up on this Supabase project. " +
      "Open Supabase Dashboard → SQL Editor, run scripts/kalam-bootstrap.sql, " +
      "then npm run seed:demo and reload the page."
    );
  }
  if (
    message.includes("schema cache") ||
    message.includes("PGRST204")
  ) {
    return (
      "Database schema is out of date. Run supabase/migrations on your project " +
      "(or scripts/kalam-bootstrap.sql), then Supabase Dashboard → Settings → API → Reload schema."
    );
  }
  return message;
}

export function isSchemaMissingError(message: string): boolean {
  return (
    message.includes("Could not find the table") ||
    message.includes("PGRST205")
  );
}
