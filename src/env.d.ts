interface ImportMetaEnv {
  readonly STRIPE_SECRET_KEY: string;

  readonly ASTRO_DB_REMOTE_URL: string;
  readonly ASTRO_DB_APP_TOKEN: string;
  readonly DATABASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    SnipcartSettings: {
      publicApiKey: string;
      loadStrategy: string;
      version: string;
      addProductBehavior: string;
      modalStyle: string;
    };
  }
}
