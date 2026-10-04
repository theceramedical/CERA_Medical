CREATE TABLE "commerce_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_code" varchar(48) NOT NULL,
	"customer_email" varchar(254) NOT NULL,
	"customer_subject_id" varchar(255),
	"payment_method" varchar(32) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"total_minor" integer NOT NULL,
	"lines" jsonb NOT NULL,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "commerce_orders_order_code_key" ON "commerce_orders" USING btree ("order_code");--> statement-breakpoint
CREATE INDEX "commerce_orders_customer_subject_idx" ON "commerce_orders" USING btree ("customer_subject_id","placed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "commerce_orders_customer_email_idx" ON "commerce_orders" USING btree ("customer_email","placed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "commerce_orders_email_lower_idx" ON "commerce_orders" USING btree (lower("customer_email"));