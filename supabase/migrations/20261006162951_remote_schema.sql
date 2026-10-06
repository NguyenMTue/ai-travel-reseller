SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

CREATE TABLE "public"."campaigns" (
  "id"              uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "merchant_id"     uuid,
  "product_id"      uuid,
  "name"            character varying           NOT NULL,
  "start_date"      timestamp without time zone,
  "end_date"        timestamp without time zone,
  "target_audience" character varying,
  "target_location" character varying,
  "commission_rate" numeric,
  "status"          character varying,
  CONSTRAINT "campaigns_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."campaigns"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."contents" (
  "id"           uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "campaign_id"  uuid,
  "reseller_id"  uuid,
  "persona"      character varying,
  "hook"         text,
  "script"       text,
  "caption"      text,
  "video_url"    text,
  "tracking_url" text,
  "status"       character varying,
  "created_at"   timestamp without time zone DEFAULT now(),
  CONSTRAINT "contents_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."contents"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."merchants" (
  "id"          uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "name"        character varying           NOT NULL,
  "logo"        text,
  "description" text,
  "phone"       character varying,
  "website"     text,
  "address"     text,
  "status"      character varying,
  "created_at"  timestamp without time zone DEFAULT now(),
  CONSTRAINT "merchants_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."merchants"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."orders" (
  "id"                uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "merchant_id"       uuid,
  "reseller_id"       uuid,
  "product_id"        uuid,
  "amount"            numeric,
  "commission_amount" numeric,
  "status"            character varying,
  "booking_reference" character varying,
  "created_at"        timestamp without time zone DEFAULT now(),
  CONSTRAINT "orders_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."orders"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."products" (
  "id"              uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "merchant_id"     uuid,
  "name"            character varying           NOT NULL,
  "description"     text,
  "category"        character varying,
  "original_price"  numeric,
  "sale_price"      numeric,
  "commission_rate" numeric,
  "valid_from"      timestamp without time zone,
  "valid_to"        timestamp without time zone,
  "booking_url"     text,
  "payment_url"     text,
  "status"          character varying,
  "created_at"      timestamp without time zone DEFAULT now(),
  CONSTRAINT "products_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."products"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."resellers" (
  "id"              uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "name"            character varying           NOT NULL,
  "email"           character varying,
  "phone"           character varying,
  "status"          character varying,
  "commission_rate" numeric,
  "created_at"      timestamp without time zone DEFAULT now(),
  CONSTRAINT "resellers_email_key" UNIQUE (email),
  CONSTRAINT "resellers_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."resellers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."social_accounts" (
  "id"            uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "reseller_id"   uuid,
  "platform"      character varying,
  "username"      character varying,
  "url"           text,
  "followers"     integer,
  "average_views" integer,
  "status"        character varying,
  "created_at"    timestamp without time zone DEFAULT now(),
  CONSTRAINT "social_accounts_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."social_accounts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tracking_events" (
  "id"          uuid                        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "reseller_id" uuid,
  "campaign_id" uuid,
  "product_id"  uuid,
  "event_type"  character varying,
  "timestamp"   timestamp without time zone DEFAULT now(),
  "metadata"    jsonb,
  CONSTRAINT "tracking_events_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."tracking_events"
  ENABLE ROW LEVEL SECURITY;

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

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "anon", "authenticated", "service_role";

ALTER TABLE "public"."contents"
  ADD CONSTRAINT "contents_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;

ALTER TABLE "public"."campaigns"
  ADD CONSTRAINT "campaigns_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE "public"."products"
  ADD CONSTRAINT "products_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;

ALTER TABLE "public"."campaigns"
  ADD CONSTRAINT "campaigns_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."contents"
  ADD CONSTRAINT "contents_reseller_id_fkey" FOREIGN KEY (reseller_id) REFERENCES public.resellers(id) ON DELETE CASCADE;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_reseller_id_fkey" FOREIGN KEY (reseller_id) REFERENCES public.resellers(id) ON DELETE CASCADE;

ALTER TABLE "public"."social_accounts"
  ADD CONSTRAINT "social_accounts_reseller_id_fkey" FOREIGN KEY (reseller_id) REFERENCES public.resellers(id) ON DELETE CASCADE;

ALTER TABLE "public"."tracking_events"
  ADD CONSTRAINT "tracking_events_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;

ALTER TABLE "public"."tracking_events"
  ADD CONSTRAINT "tracking_events_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."tracking_events"
  ADD CONSTRAINT "tracking_events_reseller_id_fkey" FOREIGN KEY (reseller_id) REFERENCES public.resellers(id) ON DELETE CASCADE;

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

REVOKE ALL ON TABLE "public"."campaigns" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."campaigns" TO "anon";

REVOKE ALL ON TABLE "public"."campaigns" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."campaigns" TO "authenticated";

REVOKE ALL ON TABLE "public"."campaigns" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."campaigns" TO "postgres";

REVOKE ALL ON TABLE "public"."campaigns" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."campaigns" TO "service_role";

REVOKE ALL ON TABLE "public"."contents" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."contents" TO "anon";

REVOKE ALL ON TABLE "public"."contents" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."contents" TO "authenticated";

REVOKE ALL ON TABLE "public"."contents" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contents" TO "postgres";

REVOKE ALL ON TABLE "public"."contents" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."contents" TO "service_role";

REVOKE ALL ON TABLE "public"."merchants" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."merchants" TO "anon";

REVOKE ALL ON TABLE "public"."merchants" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."merchants" TO "authenticated";

REVOKE ALL ON TABLE "public"."merchants" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."merchants" TO "postgres";

REVOKE ALL ON TABLE "public"."merchants" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."merchants" TO "service_role";

REVOKE ALL ON TABLE "public"."orders" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."orders" TO "anon";

REVOKE ALL ON TABLE "public"."orders" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."orders" TO "authenticated";

REVOKE ALL ON TABLE "public"."orders" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "postgres";

REVOKE ALL ON TABLE "public"."orders" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."orders" TO "service_role";

REVOKE ALL ON TABLE "public"."products" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."products" TO "anon";

REVOKE ALL ON TABLE "public"."products" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."products" TO "authenticated";

REVOKE ALL ON TABLE "public"."products" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "postgres";

REVOKE ALL ON TABLE "public"."products" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."products" TO "service_role";

REVOKE ALL ON TABLE "public"."resellers" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."resellers" TO "anon";

REVOKE ALL ON TABLE "public"."resellers" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."resellers" TO "authenticated";

REVOKE ALL ON TABLE "public"."resellers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."resellers" TO "postgres";

REVOKE ALL ON TABLE "public"."resellers" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."resellers" TO "service_role";

REVOKE ALL ON TABLE "public"."social_accounts" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."social_accounts" TO "anon";

REVOKE ALL ON TABLE "public"."social_accounts" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."social_accounts" TO "authenticated";

REVOKE ALL ON TABLE "public"."social_accounts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."social_accounts" TO "postgres";

REVOKE ALL ON TABLE "public"."social_accounts" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."social_accounts" TO "service_role";

REVOKE ALL ON TABLE "public"."tracking_events" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tracking_events" TO "anon";

REVOKE ALL ON TABLE "public"."tracking_events" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tracking_events" TO "authenticated";

REVOKE ALL ON TABLE "public"."tracking_events" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tracking_events" TO "postgres";

REVOKE ALL ON TABLE "public"."tracking_events" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tracking_events" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";

