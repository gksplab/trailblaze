/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Google Identity Services types
declare namespace google.accounts.oauth2 {
  interface TokenClient {
    requestAccessToken(overrides?: { prompt?: string }): void;
  }
  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
  }
  interface TokenResponse {
    access_token: string;
    error?: string;
  }
  function initTokenClient(config: TokenClientConfig): TokenClient;
}
