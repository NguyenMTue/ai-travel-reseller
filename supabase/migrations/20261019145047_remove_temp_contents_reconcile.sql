-- Remove the temporary contents trigger that forced review rows to approved.
-- Keep RESTRICT semantics: if another database object still depends on this
-- function, fail the migration so that dependency can be reviewed explicitly.
DROP TRIGGER IF EXISTS trg_temp_contents_reconcile ON public.contents;
DROP FUNCTION IF EXISTS public.fn_temp_contents_reconcile();
