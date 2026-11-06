SET local check_function_bodies = off;

DROP TRIGGER "N8N_WEBHOOK_URL" ON "public"."campaigns";

DROP TRIGGER "notify-n8n-on-affiliate-click" ON "public"."clicks";

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

CREATE TRIGGER "N8N_WEBHOOK_URL"
  AFTER INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION
    supabase_functions.http_request('https://provision-cornell-doctors-gone.trycloudflare.com/webhook/supabase-campaign-created-content-test', 'POST',
    '{"Content-type":"application/json","x-webhook-token":"X-Webhook-Token-Supabase Campaign Webhook"}', '{}', '5000');

CREATE TRIGGER "notify-n8n-on-affiliate-click"
  AFTER INSERT ON public.clicks
  FOR EACH ROW
  EXECUTE FUNCTION
    supabase_functions.http_request('https://provision-cornell-doctors-gone.trycloudflare.com/webhook/affiliate-click-notification', 'POST',
    '{"Content-type":"application/json","X-Webhook-Token":"Database Webhooks-N8N_WEBHOOK_URL"}', '{}', '5000');

