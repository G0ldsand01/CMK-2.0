import { ordersTable } from '@/db/schema';
import db from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from 'astro:env/server';
import Stripe from 'stripe';

export const POST: APIRoute = async ({ request }) => {
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const endpointSecret = STRIPE_WEBHOOK_SECRET;

    const sig = request.headers.get('stripe-signature');

    if (!sig) {
        return new Response(JSON.stringify({ error: 'No signature provided' }), { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(await request.text(), sig, endpointSecret);
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), { status: 400 });
    }

    console.log(event);

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;

            if (!session.id || !session.customer_email) {
                console.error('Missing session id or customer email');
                break;
            }

            await db
                .update(ordersTable)
                .set({ status: 'paid' })
                .where(eq(ordersTable.stripeSessionId, session.id));

            break;
        }

        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            if (!paymentIntent.metadata?.sessionId) {
                console.error('Missing session id in payment intent metadata');
                break;
            }

            await db
                .update(ordersTable)
                .set({ status: 'paid' })
                .where(eq(ordersTable.stripeSessionId, paymentIntent.metadata.sessionId));

            break;
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            if (!paymentIntent.metadata?.sessionId) {
                console.error('Missing session id in payment intent metadata');
                break;
            }

            await db
                .update(ordersTable)
                .set({ status: 'payment_failed' })
                .where(eq(ordersTable.stripeSessionId, paymentIntent.metadata.sessionId));

            break;
        }

        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session;

            if (!session.id) {
                console.error('Missing session id');
                break;
            }

            await db
                .update(ordersTable)
                .set({ status: 'expired' })
                .where(eq(ordersTable.stripeSessionId, session.id));

            break;
        }

        case 'charge.refunded': {
            const charge = event.data.object as Stripe.Charge;

            if (!charge.payment_intent) {
                console.error('Missing payment intent in charge');
                break;
            }

            const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent as string);

            if (!paymentIntent.metadata?.sessionId) {
                console.error('Missing session id in payment intent metadata');
                break;
            }

            await db
                .update(ordersTable)
                .set({ status: 'refunded' })
                .where(eq(ordersTable.stripeSessionId, paymentIntent.metadata.sessionId));

            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
}
