import { app } from "../../../firebase/server";
import { getAuth } from "firebase-admin/auth";

export async function onRequest(req: Request): Promise<Response> {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    const { email } = await req.json();

    if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }

    try {
        const auth = getAuth(app);
        const link = await auth.generatePasswordResetLink(email);
        
        // Optionnel : Envoyer l'email via ton propre système d'emailing
        await sendEmail({
            to: email,
            subject: "Password Reset Request",
            text: `Click the following link to reset your password: ${link}`
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error("Error sending reset link:", error);
        return new Response(JSON.stringify({ error: "Failed to send reset link" }), { status: 500 });
    }
}

// Exemple de fonction d'envoi d'email (à adapter selon ton service)
async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string; }) {
    // Intégrer ton service d'email ici (SendGrid, Nodemailer, etc.)
    console.log(`Email sent to ${to}: ${text}`);
}
