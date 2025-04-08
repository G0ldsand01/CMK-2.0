import { ordersTable } from '@/db/schema';
import db from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { STRIPE_WEBHOOK_SECRET } from 'astro:env/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

export const POST: APIRoute = async ({ request }) => {
    console.log('Stripe webhook received');
    const endpointSecret = STRIPE_WEBHOOK_SECRET;

    const sig = request.headers.get('stripe-signature');

    if (!sig) {
        console.error('No Stripe signature found in request headers');
        return new Response(JSON.stringify({ error: 'No signature provided' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    let event: Stripe.Event;
    const rawBody = await request.text();

    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
        console.error('Error verifying webhook signature:', err);
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    console.log('Processing webhook event:', event.type);

    try {
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

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
