SET local check_function_bodies = off;

ALTER TABLE "public"."campaigns"
  ADD COLUMN "description" text;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_campaign_to_n8n()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
DECLARE
  webhook_url text := coalesce(
    current_setting('app.settings.n8n_campaign_webhook_url', true),
    'http://127.0.0.1:5678/webhook/campaign-created'
  );
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'campaigns',
    'schema', 'public',
    'record', jsonb_build_object(
      'id', NEW.id,
      'merchant_id', NEW.merchant_id,
      'product_id', NEW.product_id,
      'name', NEW.name,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date,
      'target_audience', NEW.target_audience,
      'target_location', NEW.target_location,
      'commission_rate', NEW.commission_rate,
      'status', NEW.status
    )
  );

  -- Gọi HTTP POST bất đồng bộ qua pg_net trong khối exception để không làm nghẽn transaction tạo campaign
  BEGIN
    PERFORM net.http_post(
      url := webhook_url,
      body := payload,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'n8n campaign webhook notification failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

CREATE VIEW "public"."merchant_public_profiles" WITH (security_invoker=false) AS  SELECT id,
    name
   FROM public.merchants;

CREATE TRIGGER "N8N_WEBHOOK_URL"
  AFTER INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION
    supabase_functions.http_request('https://administrative-clubs-cos-everybody.trycloudflare.com/webhook/supabase-campaign-created-content-test', 'POST',
    '{"Content-type":"application/json","x-webhook-token":"X-Webhook-Token-Supabase Campaign Webhook"}', '{}', '5000');

CREATE TRIGGER "notify-n8n-on-affiliate-click"
  AFTER INSERT ON public.clicks
  FOR EACH ROW
  EXECUTE FUNCTION
    supabase_functions.http_request('https://monetary-midnight-tan-discovery.trycloudflare.com/webhook/affiliate-click-notification', 'POST',
    '{"Content-type":"application/json","X-Webhook-Token":"Database Webhooks-N8N_WEBHOOK_URL"}', '{}', '5000');

REVOKE ALL ON FUNCTION "extensions"."avg"(extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."avg"(extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."avg"(extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."avg"(extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."avg"(extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."avg"(extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."avg"(extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."avg"(extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."avg"(extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."avg"(extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."avg"(extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."avg"(extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sum"(extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sum"(extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sum"(extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sum"(extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sum"(extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sum"(extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sum"(extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sum"(extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sum"(extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sum"(extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sum"(extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sum"(extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(double precision[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(double precision[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(double precision[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(integer[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(integer[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(integer[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(integer[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(numeric[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(numeric[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(numeric[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(real[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(real[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(real[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_halfvec"(real[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_halfvec"(real[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(double precision[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(double precision[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(double precision[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(integer[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(integer[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(integer[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(numeric[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(numeric[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(numeric[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(real[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(real[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(real[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_sparsevec"(real[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(double precision[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(double precision[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(double precision[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(double precision[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(double precision[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(integer[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(integer[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(integer[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(integer[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(integer[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(integer[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(numeric[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(numeric[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(numeric[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(numeric[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(numeric[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(real[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(real[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(real[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(real[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."array_to_vector"(real[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."array_to_vector"(real[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."binary_quantize"(extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."binary_quantize"(extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."binary_quantize"(extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."binary_quantize"(extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."binary_quantize"(extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."binary_quantize"(extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."binary_quantize"(extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."binary_quantize"(extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."binary_quantize"(extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."binary_quantize"(extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."binary_quantize"(extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."binary_quantize"(extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."cosine_distance"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."cosine_distance"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."cosine_distance"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."cosine_distance"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."cosine_distance"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."cosine_distance"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."cosine_distance"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."cosine_distance"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."cosine_distance"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."cosine_distance"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."cosine_distance"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."cosine_distance"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."cosine_distance"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."cosine_distance"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."cosine_distance"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."cosine_distance"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."cosine_distance"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."cosine_distance"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec"(extensions.halfvec, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec"(extensions.halfvec, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec"(extensions.halfvec, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec"(extensions.halfvec, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec"(extensions.halfvec, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec"(extensions.halfvec, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_accum"(double precision[], extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_accum"(double precision[], extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_accum"(double precision[], extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_accum"(double precision[], extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_accum"(double precision[], extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_accum"(double precision[], extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_add"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_add"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_add"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_add"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_add"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_add"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_avg"(double precision[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_avg"(double precision[]) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_avg"(double precision[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_avg"(double precision[]) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_avg"(double precision[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_avg"(double precision[]) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_cmp"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_cmp"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_cmp"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_cmp"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_cmp"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_cmp"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_combine"(double precision[], double precision[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_combine"(double precision[], double precision[]) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_combine"(double precision[], double precision[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_combine"(double precision[], double precision[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_combine"(double precision[], double precision[]) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_concat"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_concat"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_concat"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_concat"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_concat"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_concat"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_eq"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_eq"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_eq"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_eq"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_eq"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_eq"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_ge"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_ge"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_ge"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_ge"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_ge"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_ge"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_gt"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_gt"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_gt"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_gt"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_gt"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_gt"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_in"(cstring, oid, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_in"(cstring, oid, integer) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_in"(cstring, oid, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_in"(cstring, oid, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_in"(cstring, oid, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_in"(cstring, oid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_l2_squared_distance"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_l2_squared_distance"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_l2_squared_distance"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_l2_squared_distance"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_l2_squared_distance"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_l2_squared_distance"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_le"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_le"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_le"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_le"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_le"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_le"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_lt"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_lt"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_lt"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_lt"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_lt"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_lt"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_mul"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_mul"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_mul"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_mul"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_mul"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_mul"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_ne"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_ne"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_ne"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_ne"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_ne"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_ne"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_negative_inner_product"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_negative_inner_product"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_negative_inner_product"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_negative_inner_product"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_negative_inner_product"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_negative_inner_product"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_out"(extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_out"(extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_out"(extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_out"(extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_out"(extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_out"(extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_recv"(internal, oid, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_recv"(internal, oid, integer) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_recv"(internal, oid, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_recv"(internal, oid, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_recv"(internal, oid, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_recv"(internal, oid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_send"(extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_send"(extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_send"(extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_send"(extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_send"(extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_send"(extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_spherical_distance"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_spherical_distance"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_spherical_distance"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_spherical_distance"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_spherical_distance"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_spherical_distance"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_sub"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_sub"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_sub"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_sub"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_sub"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_sub"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_to_float4"(extensions.halfvec, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_to_float4"(extensions.halfvec, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_to_float4"(extensions.halfvec, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_to_float4"(extensions.halfvec, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_to_float4"(extensions.halfvec, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_to_float4"(extensions.halfvec, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_to_sparsevec"(extensions.halfvec, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_to_sparsevec"(extensions.halfvec, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_to_sparsevec"(extensions.halfvec, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_to_sparsevec"(extensions.halfvec, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_to_sparsevec"(extensions.halfvec, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_to_sparsevec"(extensions.halfvec, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_to_vector"(extensions.halfvec, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_to_vector"(extensions.halfvec, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_to_vector"(extensions.halfvec, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_to_vector"(extensions.halfvec, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_to_vector"(extensions.halfvec, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_to_vector"(extensions.halfvec, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."halfvec_typmod_in"(cstring[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_typmod_in"(cstring[]) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."halfvec_typmod_in"(cstring[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_typmod_in"(cstring[]) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."halfvec_typmod_in"(cstring[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."halfvec_typmod_in"(cstring[]) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."hamming_distance"(bit, bit) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."hamming_distance"(bit, bit) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."hamming_distance"(bit, bit) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."hamming_distance"(bit, bit) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."hamming_distance"(bit, bit) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."hamming_distance"(bit, bit) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."hnsw_bit_support"(internal) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."hnsw_bit_support"(internal) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."hnsw_bit_support"(internal) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."hnsw_bit_support"(internal) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."hnsw_bit_support"(internal) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."hnsw_bit_support"(internal) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."hnsw_halfvec_support"(internal) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."hnsw_halfvec_support"(internal) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."hnsw_halfvec_support"(internal) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."hnsw_halfvec_support"(internal) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."hnsw_halfvec_support"(internal) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."hnsw_halfvec_support"(internal) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."hnsw_sparsevec_support"(internal) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."hnsw_sparsevec_support"(internal) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."hnsw_sparsevec_support"(internal) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."hnsw_sparsevec_support"(internal) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."hnsw_sparsevec_support"(internal) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."hnsw_sparsevec_support"(internal) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."hnswhandler"(internal) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."hnswhandler"(internal) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."hnswhandler"(internal) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."hnswhandler"(internal) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."hnswhandler"(internal) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."hnswhandler"(internal) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."inner_product"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."inner_product"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."inner_product"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."inner_product"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."inner_product"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."inner_product"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."inner_product"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."inner_product"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."inner_product"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."inner_product"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."inner_product"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."inner_product"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."inner_product"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."inner_product"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."inner_product"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."inner_product"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."inner_product"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."inner_product"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."ivfflat_bit_support"(internal) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."ivfflat_bit_support"(internal) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."ivfflat_bit_support"(internal) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."ivfflat_bit_support"(internal) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."ivfflat_bit_support"(internal) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."ivfflat_bit_support"(internal) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."ivfflat_halfvec_support"(internal) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."ivfflat_halfvec_support"(internal) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."ivfflat_halfvec_support"(internal) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."ivfflat_halfvec_support"(internal) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."ivfflat_halfvec_support"(internal) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."ivfflat_halfvec_support"(internal) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."ivfflathandler"(internal) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."ivfflathandler"(internal) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."ivfflathandler"(internal) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."ivfflathandler"(internal) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."ivfflathandler"(internal) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."ivfflathandler"(internal) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."jaccard_distance"(bit, bit) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."jaccard_distance"(bit, bit) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."jaccard_distance"(bit, bit) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."jaccard_distance"(bit, bit) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."jaccard_distance"(bit, bit) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."jaccard_distance"(bit, bit) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l1_distance"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l1_distance"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l1_distance"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l1_distance"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l1_distance"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l1_distance"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l1_distance"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l1_distance"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l1_distance"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l1_distance"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l1_distance"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l1_distance"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l1_distance"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l1_distance"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l1_distance"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l1_distance"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l1_distance"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l1_distance"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l2_distance"(extensions.halfvec, extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l2_distance"(extensions.halfvec, extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l2_distance"(extensions.halfvec, extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l2_distance"(extensions.halfvec, extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l2_distance"(extensions.halfvec, extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l2_distance"(extensions.halfvec, extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l2_distance"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l2_distance"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l2_distance"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l2_distance"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l2_distance"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l2_distance"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l2_distance"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l2_distance"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l2_distance"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l2_distance"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l2_distance"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l2_distance"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l2_norm"(extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l2_norm"(extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l2_norm"(extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l2_norm"(extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l2_norm"(extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l2_norm"(extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l2_norm"(extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l2_norm"(extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l2_norm"(extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l2_norm"(extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l2_norm"(extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l2_norm"(extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l2_normalize"(extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l2_normalize"(extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l2_normalize"(extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l2_normalize"(extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l2_normalize"(extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l2_normalize"(extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l2_normalize"(extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l2_normalize"(extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l2_normalize"(extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l2_normalize"(extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l2_normalize"(extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l2_normalize"(extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."l2_normalize"(extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."l2_normalize"(extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."l2_normalize"(extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."l2_normalize"(extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."l2_normalize"(extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."l2_normalize"(extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec"(extensions.sparsevec, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec"(extensions.sparsevec, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec"(extensions.sparsevec, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec"(extensions.sparsevec, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec"(extensions.sparsevec, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec"(extensions.sparsevec, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_cmp"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_cmp"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_cmp"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_cmp"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_cmp"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_cmp"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_eq"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_eq"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_eq"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_eq"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_eq"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_eq"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_ge"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_ge"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_ge"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_ge"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_ge"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_ge"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_gt"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_gt"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_gt"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_gt"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_gt"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_gt"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_in"(cstring, oid, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_in"(cstring, oid, integer) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_in"(cstring, oid, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_in"(cstring, oid, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_in"(cstring, oid, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_in"(cstring, oid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_l2_squared_distance"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_l2_squared_distance"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_l2_squared_distance"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_l2_squared_distance"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_l2_squared_distance"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_l2_squared_distance"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_le"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_le"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_le"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_le"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_le"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_le"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_lt"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_lt"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_lt"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_lt"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_lt"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_lt"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_ne"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_ne"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_ne"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_ne"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_ne"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_ne"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_negative_inner_product"(extensions.sparsevec, extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_negative_inner_product"(extensions.sparsevec, extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_negative_inner_product"(extensions.sparsevec, extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_negative_inner_product"(extensions.sparsevec, extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_negative_inner_product"(extensions.sparsevec, extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_negative_inner_product"(extensions.sparsevec, extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_out"(extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_out"(extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_out"(extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_out"(extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_out"(extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_out"(extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_recv"(internal, oid, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_recv"(internal, oid, integer) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_recv"(internal, oid, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_recv"(internal, oid, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_recv"(internal, oid, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_recv"(internal, oid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_send"(extensions.sparsevec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_send"(extensions.sparsevec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_send"(extensions.sparsevec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_send"(extensions.sparsevec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_send"(extensions.sparsevec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_send"(extensions.sparsevec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_to_halfvec"(extensions.sparsevec, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_to_halfvec"(extensions.sparsevec, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_to_halfvec"(extensions.sparsevec, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_to_halfvec"(extensions.sparsevec, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_to_halfvec"(extensions.sparsevec, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_to_halfvec"(extensions.sparsevec, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_to_vector"(extensions.sparsevec, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_to_vector"(extensions.sparsevec, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_to_vector"(extensions.sparsevec, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_to_vector"(extensions.sparsevec, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_to_vector"(extensions.sparsevec, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_to_vector"(extensions.sparsevec, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_typmod_in"(cstring[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_typmod_in"(cstring[]) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_typmod_in"(cstring[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_typmod_in"(cstring[]) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."sparsevec_typmod_in"(cstring[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."sparsevec_typmod_in"(cstring[]) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."subvector"(extensions.halfvec, integer, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."subvector"(extensions.halfvec, integer, integer) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."subvector"(extensions.halfvec, integer, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."subvector"(extensions.halfvec, integer, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."subvector"(extensions.halfvec, integer, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."subvector"(extensions.halfvec, integer, integer) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."subvector"(extensions.vector, integer, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."subvector"(extensions.vector, integer, integer) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."subvector"(extensions.vector, integer, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."subvector"(extensions.vector, integer, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."subvector"(extensions.vector, integer, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."subvector"(extensions.vector, integer, integer) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector"(extensions.vector, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector"(extensions.vector, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector"(extensions.vector, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector"(extensions.vector, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector"(extensions.vector, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector"(extensions.vector, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_accum"(double precision[], extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_accum"(double precision[], extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_accum"(double precision[], extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_accum"(double precision[], extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_accum"(double precision[], extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_accum"(double precision[], extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_add"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_add"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_add"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_add"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_add"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_add"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_avg"(double precision[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_avg"(double precision[]) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_avg"(double precision[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_avg"(double precision[]) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_avg"(double precision[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_avg"(double precision[]) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_cmp"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_cmp"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_cmp"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_cmp"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_cmp"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_cmp"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_combine"(double precision[], double precision[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_combine"(double precision[], double precision[]) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_combine"(double precision[], double precision[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_combine"(double precision[], double precision[]) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_combine"(double precision[], double precision[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_combine"(double precision[], double precision[]) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_concat"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_concat"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_concat"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_concat"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_concat"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_concat"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_dims"(extensions.halfvec) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_dims"(extensions.halfvec) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_dims"(extensions.halfvec) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_dims"(extensions.halfvec) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_dims"(extensions.halfvec) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_dims"(extensions.halfvec) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_dims"(extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_dims"(extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_dims"(extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_dims"(extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_dims"(extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_dims"(extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_eq"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_eq"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_eq"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_eq"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_eq"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_eq"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_ge"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_ge"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_ge"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_ge"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_ge"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_ge"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_gt"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_gt"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_gt"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_gt"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_gt"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_gt"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_in"(cstring, oid, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_in"(cstring, oid, integer) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_in"(cstring, oid, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_in"(cstring, oid, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_in"(cstring, oid, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_in"(cstring, oid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_l2_squared_distance"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_l2_squared_distance"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_l2_squared_distance"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_l2_squared_distance"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_l2_squared_distance"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_l2_squared_distance"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_le"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_le"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_le"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_le"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_le"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_le"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_lt"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_lt"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_lt"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_lt"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_lt"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_lt"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_mul"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_mul"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_mul"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_mul"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_mul"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_mul"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_ne"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_ne"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_ne"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_ne"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_ne"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_ne"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_negative_inner_product"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_negative_inner_product"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_negative_inner_product"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_negative_inner_product"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_negative_inner_product"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_negative_inner_product"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_norm"(extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_norm"(extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_norm"(extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_norm"(extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_norm"(extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_norm"(extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_out"(extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_out"(extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_out"(extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_out"(extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_out"(extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_out"(extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_recv"(internal, oid, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_recv"(internal, oid, integer) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_recv"(internal, oid, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_recv"(internal, oid, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_recv"(internal, oid, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_recv"(internal, oid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_send"(extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_send"(extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_send"(extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_send"(extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_send"(extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_send"(extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_spherical_distance"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_spherical_distance"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_spherical_distance"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_spherical_distance"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_spherical_distance"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_spherical_distance"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_sub"(extensions.vector, extensions.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_sub"(extensions.vector, extensions.vector) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_sub"(extensions.vector, extensions.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_sub"(extensions.vector, extensions.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_sub"(extensions.vector, extensions.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_sub"(extensions.vector, extensions.vector) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_to_float4"(extensions.vector, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_to_float4"(extensions.vector, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_to_float4"(extensions.vector, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_to_float4"(extensions.vector, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_to_float4"(extensions.vector, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_to_float4"(extensions.vector, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_to_halfvec"(extensions.vector, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_to_halfvec"(extensions.vector, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_to_halfvec"(extensions.vector, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_to_halfvec"(extensions.vector, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_to_halfvec"(extensions.vector, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_to_halfvec"(extensions.vector, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_to_sparsevec"(extensions.vector, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_to_sparsevec"(extensions.vector, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_to_sparsevec"(extensions.vector, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_to_sparsevec"(extensions.vector, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_to_sparsevec"(extensions.vector, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_to_sparsevec"(extensions.vector, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "extensions"."vector_typmod_in"(cstring[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "extensions"."vector_typmod_in"(cstring[]) TO "anon";

REVOKE ALL ON FUNCTION "extensions"."vector_typmod_in"(cstring[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "extensions"."vector_typmod_in"(cstring[]) TO "authenticated";

REVOKE ALL ON FUNCTION "extensions"."vector_typmod_in"(cstring[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "extensions"."vector_typmod_in"(cstring[]) TO "service_role";

REVOKE ALL ON TABLE "public"."merchant_public_profiles" FROM "anon";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."merchant_public_profiles" TO "anon";

REVOKE ALL ON TABLE "public"."merchant_public_profiles" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."merchant_public_profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."merchant_public_profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."merchant_public_profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."merchant_public_profiles" TO "service_role";

