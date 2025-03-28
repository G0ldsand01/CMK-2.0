interface ImportMetaEnv {
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

interface Window {
  SnipcartSettings: any;
  Snipcart: any;
}
