'use server';

import { auth } from "@clerk/nextjs/server";
import {adminDb} from "@/firebaseAdmin";
import getBaseUrl from "@/lib/getBaseUrl";
import stripe from "@/lib/stripe";

export async function createStripePortal() {
    auth.protect();
    const {userId} = await auth();
    if(!userId)
        throw new Error("User does not exist");

    const user = await adminDb.collection("users").doc(userId).get();
    const stripeCustomerId = user.data()?.stripeCustomerId;

    if(!stripeCustomerId){
        throw new Error("Stripe Customer Not Found");
    }

    const session = await stripe.billingPortal.sessions.create({
        customer:  stripeCustomerId,
        return_url: `${getBaseUrl()}/dashboard`,
    });

    return session.url;
}


