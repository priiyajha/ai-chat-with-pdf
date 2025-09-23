//server side stripe -- uses node.js

import Stripe from "stripe";
const stripeSecretKey = process.env.NEXT_PUBLIC_STRIPE_API_KEY;
if(!stripeSecretKey){
    throw new Error("Stripe secret key missing");
}

const stripe = new Stripe(stripeSecretKey);

export default stripe;