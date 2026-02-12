/**
 * Supabase Edge Function: notify-new-tour
 * 
 * Yeni tur eklendiğinde admin'e bildirim gönderir.
 * Database Webhook ile tetiklenir.
 * 
 * Deploy:
 *   supabase functions deploy notify-new-tour
 * 
 * Webhook kurulumu (Supabase Dashboard):
 *   Database > Webhooks > Create
 *   Table: tours
 *   Events: INSERT
 *   URL: https://YOUR_PROJECT.supabase.co/functions/v1/notify-new-tour
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_NOTIFICATION_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@hacveumreturlari.net";

serve(async (req) => {
    try {
        const payload = await req.json();
        const { record } = payload; // inserted row

        if (!record) {
            return new Response(JSON.stringify({ error: "No record in payload" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Admin kullanıcıları al
        const { data: admins } = await supabase
            .from("profiles")
            .select("email")
            .in("role", ["admin", "super_admin"]);

        // Bildirim kaydı oluştur (notifications tablosu varsa)
        const notifications = (admins || []).map((admin: any) => ({
            user_email: admin.email,
            type: "new_tour",
            title: `Yeni tur eklendi: ${record.title || "Bilinmeyen"}`,
            message: `${record.operator || "Bilinmeyen operatör"} yeni bir tur ekledi. Onay bekleniyor.`,
            read: false,
        }));

        if (notifications.length > 0) {
            await supabase.from("notifications").insert(notifications);
        }

        // Log
        console.log(`[notify-new-tour] Tour "${record.title}" - ${notifications.length} admin bilgilendirildi`);

        return new Response(
            JSON.stringify({
                success: true,
                tour: record.title,
                notified_admins: notifications.length,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("[notify-new-tour] Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
});
