// Type declarations for Deno runtime and remote HTTP / npm imports in Supabase Edge Functions

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response, options?: any): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): any;
}

declare module "npm:web-push@3.6.7" {
  const webpush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(subscription: any, payload: string, options?: any): Promise<any>;
  };
  export default webpush;
}
