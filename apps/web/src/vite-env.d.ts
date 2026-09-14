/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STATIC_ONLY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
