/// <reference path="./deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="npm:@supabase/supabase-js"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="npm:web-push"
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VAPID_PUBLIC_KEY =
  Deno.env.get("VAPID_PUBLIC_KEY") ||
  "BLeZkB_jnCznQoe_RdVJWS3_GUNrB05Tof5-4HXrYndpK1Xzldu4D6cehCGHG_9KJdtLPCHvXOv7ZjCVC0OKaZc";

const VAPID_PRIVATE_KEY =
  Deno.env.get("VAPID_PRIVATE_KEY") ||
  "cxy7Ecm4rnw7RcR1nKIP2Mm67NrbVLQHQQSfXy6WkNk";

const VAPID_SUBJECT =
  Deno.env.get("VAPID_SUBJECT") || "mailto:admin@venapictures.com";

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.error("[send-web-push] Failed to initialize VAPID details:", err);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured in Edge Function" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const { vendor_id, user_id, title, message, url, icon, tag } = body;

    // Strict multi-tenant validation: vendor_id is required
    if (!vendor_id) {
      return new Response(
        JSON.stringify({ error: "vendor_id is required for multi-tenant isolation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query active push subscriptions only for this vendor
    let query = supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, user_id")
      .eq("vendor_id", vendor_id)
      .eq("is_active", true);

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    const { data: subscriptions, error: dbError } = await query;
    if (dbError) throw dbError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active push subscriptions found for this vendor.",
          deliveredCount: 0,
          totalSubscriptions: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pushPayload = JSON.stringify({
      title: title || "Vena Pictures",
      body: message || "Ada pembaruan baru di aplikasi.",
      icon: icon || "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      url: url || "/",
      tag: tag || `vena-${Date.now()}`,
      timestamp: Date.now(),
    });

    let deliveredCount = 0;
    let failedCount = 0;
    const staleSubscriptionIds: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string; }) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, pushPayload);
          deliveredCount++;
        } catch (pushErr: any) {
          failedCount++;
          console.warn("[send-web-push] Delivery failed for endpoint:", sub.endpoint, pushErr?.statusCode);
          // If 404 or 410 Gone, the subscription is expired or cancelled by browser
          if (pushErr?.statusCode === 404 || pushErr?.statusCode === 410) {
            staleSubscriptionIds.push(sub.id);
          }
        }
      })
    );

    // Deactivate stale subscriptions
    if (staleSubscriptionIds.length > 0) {
      await supabase
        .from("push_subscriptions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("id", staleSubscriptionIds)
        .catch((cleanErr: any) => console.warn("[send-web-push] Stale cleanup error:", cleanErr));
    }

    return new Response(
      JSON.stringify({
        success: true,
        deliveredCount,
        failedCount,
        totalSubscriptions: subscriptions.length,
        cleanedStaleCount: staleSubscriptionIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-web-push] Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message || "Push dispatch failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
