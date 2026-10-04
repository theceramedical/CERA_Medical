import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { commerceEnvSchema, loadEnv } from '@cera/config/env';
import {
  AssetServerPlugin,
  configureS3AssetStorage,
  PresetOnlyStrategy,
  type AssetServerOptions,
} from '@vendure/asset-server-plugin';
import { DefaultLogger, LanguageCode, LogLevel, type VendureConfig } from '@vendure/core';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { HardenPlugin } from '@vendure/harden-plugin';
import { BullMQJobQueuePlugin } from '@vendure/job-queue-plugin/package/bullmq/index.js';

import { productCustomFields } from './plugins/catalogue-fields.js';
import { ceraTestPaymentHandler } from './plugins/cera-payments.js';
import { ceraStripePaymentHandler } from './plugins/cera-stripe-payment.js';
import { RejectCheckoutInterceptor } from './plugins/checkout-neutralisation/order-interceptor.js';
import {
  denyAdminPaymentRule,
  denyShopCheckoutRule,
} from './plugins/checkout-neutralisation/validation-rule.js';

function isCheckoutEnabled(): boolean {
  return process.env.CHECKOUT_ENABLED === 'true';
}

function paymentMethodHandlers() {
  if (!isCheckoutEnabled()) return [];
  const production = (process.env.CERA_ENV ?? 'local') === 'production';
  if (
    production &&
    process.env.STRIPE_SECRET_KEY !== undefined &&
    process.env.STRIPE_SECRET_KEY.length > 0
  ) {
    return [ceraStripePaymentHandler];
  }
  return [ceraTestPaymentHandler];
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} is required and has no default. See .env.example.`);
  }
  return value;
}

function assetServerOptions(s3: boolean): AssetServerOptions {
  const options: AssetServerOptions = {
    route: 'assets',
    assetUploadDir: path.join(dirname, '../static/assets'),
    imageTransformStrategy: new PresetOnlyStrategy({
      defaultPreset: 'std',
      permittedFormats: ['jpg', 'webp', 'avif'],
      allowFocalPoint: false,
    }),
  };

  if (process.env.ASSET_URL_PREFIX !== undefined) {
    options.assetUrlPrefix = process.env.ASSET_URL_PREFIX;
  }

  if (s3) {
    const nativeS3Configuration: Record<string, unknown> = {
      region: process.env.S3_REGION ?? 'auto',
      forcePathStyle: true,
    };
    if (process.env.S3_ENDPOINT !== undefined) {
      nativeS3Configuration.endpoint = process.env.S3_ENDPOINT;
    }

    const factory = configureS3AssetStorage({
      bucket: required('S3_BUCKET'),
      credentials: {
        accessKeyId: required('S3_ACCESS_KEY_ID'),
        secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
      },
      nativeS3Configuration,
    }) as NonNullable<AssetServerOptions['storageStrategyFactory']>;
    options.storageStrategyFactory = factory;
  }

  return options;
}

/**
 * Vendure configuration. Checkout is off unless CHECKOUT_ENABLED=true (ADR-011).
 *
 * `synchronize` stays false. Custom-field changes ship as migrations, never as
 * a boot-time ALTER. Pushing schema from the running process is how two
 * containers fight over the same tables.
 */
export function getConfig(options: { seed?: boolean } = {}): VendureConfig {
  if (process.env.VITEST !== 'true') {
    loadEnv(commerceEnvSchema, process.env, 'commerce');
  }

  const local = (process.env.CERA_ENV ?? 'local') === 'local';
  const s3 = process.env.STORAGE_DRIVER === 's3';

  return {
    apiOptions: {
      port: options.seed ? 0 : Number(process.env.PORT ?? process.env.COMMERCE_PORT ?? 3002),
      adminApiPath: 'admin-api',
      shopApiPath: 'shop-api',
      shopApiValidationRules: isCheckoutEnabled() ? [] : [denyShopCheckoutRule],
      adminApiValidationRules: isCheckoutEnabled() ? [] : [denyAdminPaymentRule],
      cors: {
        origin: (process.env.CORS_ALLOWED_ORIGINS ?? '')
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0),
        credentials: false,
      },
      introspection: local,
      csrfPrevention: true,
    },
    authOptions: {
      tokenMethod: ['cookie'],
      requireVerification: true,
      cookieOptions: {
        secret: required('COOKIE_SECRET'),
      },
      superadminCredentials: {
        identifier: required('SUPERADMIN_USERNAME'),
        password: required('SUPERADMIN_PASSWORD'),
      },
    },
    dbConnectionOptions: {
      type: 'postgres',
      host: required('DB_HOST'),
      port: Number(process.env.DB_PORT ?? 5432),
      database: required('DB_NAME'),
      username: required('DB_USERNAME'),
      password: required('DB_PASSWORD'),
      synchronize: false,
      migrations: [path.join(dirname, 'migrations/*.js')],
    },
    paymentOptions: {
      paymentMethodHandlers: paymentMethodHandlers(),
    },
    orderOptions: {
      orderInterceptors: isCheckoutEnabled() ? [] : [new RejectCheckoutInterceptor()],
    },
    customFields: {
      Product: productCustomFields,
    },
    defaultLanguageCode: LanguageCode.en,
    logger: new DefaultLogger({ level: local ? LogLevel.Info : LogLevel.Warn }),
    plugins: [
      ...(options.seed ? [] : [AssetServerPlugin.init(assetServerOptions(s3))]),
      ...(options.seed
        ? []
        : [
            BullMQJobQueuePlugin.init({
              connection: {
                host: required('VALKEY_HOST'),
                port: Number(process.env.VALKEY_PORT ?? 6379),
                maxRetriesPerRequest: null,
              },
              queueOptions: { prefix: 'cera-vendure' },
              workerOptions: { prefix: 'cera-vendure', concurrency: 3 },
            }),
          ]),
      HardenPlugin.init({
        maxQueryComplexity: 500,
        apiMode: local ? 'dev' : 'prod',
      }),
      ...(options.seed
        ? []
        : [
            DashboardPlugin.init({
              route: 'dashboard',
              appDir: path.join(dirname, '../dist/dashboard'),
            }),
          ]),
    ],
  };
}
