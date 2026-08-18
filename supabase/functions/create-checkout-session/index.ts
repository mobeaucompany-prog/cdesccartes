import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") throw new Error("Method not allowed");

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!stripeSecret || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Stripe/Supabase server secrets are not configured");
    }

    const { clientName, pickupTime, restaurantId, items } = await req.json();
    if (!clientName?.trim() || !pickupTime || !restaurantId || !Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid checkout payload");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Reuse the existing server-side order function. It is the source of truth for menu prices.
    const { data: createdOrder, error: createError } = await supabase.rpc("create_order_secure", {
      p_client_name: clientName.trim(),
      p_items: items,
      p_pickup_time: pickupTime,
      p_restaurant_id: restaurantId,
    });
    if (createError || !createdOrder?.id) throw createError || new Error("Order creation failed");

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,total_price,tracking_token,restaurant_id")
      .eq("id", createdOrder.id)
      .single();
    if (orderError || !order) throw orderError || new Error("Order not found");

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("nom,stripe_account_id")
      .eq("id", restaurantId)
      .single();
    if (restaurantError || !restaurant) throw restaurantError || new Error("Restaurant not found");

    if (!restaurant.stripe_account_id) {
      await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      throw new Error("Ce restaurant n'est pas encore configuré pour les paiements en ligne.");
    }

    await supabase.from("orders").update({ payment_status: "pending" }).eq("id", order.id);

    const totalCents = Math.round(Number(order.total_price) * 100);
    if (!Number.isFinite(totalCents) || totalCents < 50) throw new Error("Invalid order total");

    const feePercent = Math.max(0, Number(Deno.env.get("MOBEAU_PLATFORM_FEE_PERCENT") || "0"));
    const applicationFee = Math.min(totalCents, Math.round(totalCents * feePercent / 100));
    const appUrl = Deno.env.get("APP_URL") || req.headers.get("origin") || "http://localhost:5173";

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${appUrl}/order/${order.id}?token=${order.tracking_token}&paid=1&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${appUrl}/cart?payment=cancelled`);
    params.set("line_items[0][price_data][currency]", "eur");
    params.set("line_items[0][price_data][product_data][name]", `Commande ${restaurant.nom}`);
    params.set("line_items[0][price_data][unit_amount]", String(totalCents));
    params.set("line_items[0][quantity]", "1");
    params.set("payment_intent_data[transfer_data][destination]", restaurant.stripe_account_id);
    if (applicationFee > 0) {
      params.set("payment_intent_data[application_fee_amount]", String(applicationFee));
    }
    params.set("metadata[order_id]", order.id);
    params.set("metadata[restaurant_id]", restaurantId);
    params.set("payment_intent_data[metadata][order_id]", order.id);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeResponse.json();
    if (!stripeResponse.ok || !session?.url) {
      await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      throw new Error(session?.error?.message || "Stripe Checkout creation failed");
    }

    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Checkout error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
