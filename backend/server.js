require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "WARN: STRIPE_SECRET_KEY is not set. Stripe endpoints will fail until you configure it."
  );
}

app.use(cors());
app.use(express.json());

// In-memory store just for local testing/demo.
// In a real app you should persist this in a database.
const customerByEmail = new Map();
const subscriptionByEmail = new Map();

const STRIPE_API_VERSION = "2022-11-15";

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Stripe backend running" });
});

// Helper to find or create a customer for an email.
async function getOrCreateCustomer(email) {
  if (!email) {
    throw new Error("email is required");
  }

  if (customerByEmail.has(email)) {
    return customerByEmail.get(email);
  }

  const customer = await stripe.customers.create({ email });
  customerByEmail.set(email, customer);
  return customer;
}

// Create a new subscription and return PaymentSheet params.
app.post("/stripe/create-subscription", async (req, res) => {
  try {
    const { priceId, email } = req.body;
    if (!priceId || !email) {
      return res.status(400).json({ error: "priceId and email are required" });
    }

    const customer = await getOrCreateCustomer(email);

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: STRIPE_API_VERSION }
    );

    const paymentIntent = subscription.latest_invoice.payment_intent;

    subscriptionByEmail.set(email, {
      subscriptionId: subscription.id,
      priceId,
      customerId: customer.id,
    });

    res.json({
      customerId: customer.id,
      ephemeralKeySecret: ephemeralKey.secret,
      paymentIntentClientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      currentPriceId: priceId,
    });
  } catch (err) {
    console.error("create-subscription error", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Update an existing subscription's price and return new PaymentSheet params.
app.post("/stripe/update-subscription", async (req, res) => {
  try {
    const { email, newPriceId } = req.body;
    if (!email || !newPriceId) {
      return res
        .status(400)
        .json({ error: "email and newPriceId are required" });
    }

    const existing = subscriptionByEmail.get(email);
    if (!existing) {
      return res.status(400).json({ error: "No existing subscription" });
    }

    const subscription = await stripe.subscriptions.retrieve(
      existing.subscriptionId
    );

    const currentItemId = subscription.items.data[0].id;

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        cancel_at_period_end: false,
        proration_behavior: "create_prorations",
        items: [
          {
            id: currentItemId,
            price: newPriceId,
          },
        ],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      }
    );

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: existing.customerId },
      { apiVersion: STRIPE_API_VERSION }
    );

    const paymentIntent = updatedSubscription.latest_invoice.payment_intent;

    subscriptionByEmail.set(email, {
      subscriptionId: updatedSubscription.id,
      priceId: newPriceId,
      customerId: existing.customerId,
    });

    res.json({
      customerId: existing.customerId,
      ephemeralKeySecret: ephemeralKey.secret,
      paymentIntentClientSecret: paymentIntent.client_secret,
      subscriptionId: updatedSubscription.id,
      currentPriceId: newPriceId,
    });
  } catch (err) {
    console.error("update-subscription error", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Cancel the user's subscription.
app.post("/stripe/cancel-subscription", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const existing = subscriptionByEmail.get(email);
    if (!existing) {
      return res.status(400).json({ error: "No existing subscription" });
    }

    // For subscriptions, use .cancel() instead of .del()
    await stripe.subscriptions.cancel(existing.subscriptionId);

    subscriptionByEmail.delete(email);

    res.json({ ok: true });
  } catch (err) {
    console.error("cancel-subscription error", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Get the current subscription info for this email.
app.get("/stripe/subscription", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }
    // First, check our in-memory cache (for subscriptions created via this backend).
    let existing = subscriptionByEmail.get(email);

    // Helper: treat only truly active subscriptions as valid.
    // (Canceled, incomplete, unpaid etc. should not appear as current.)
    const isActiveStatus = (status) => status === "active";

    // If we have a cached subscription, verify its current status with Stripe.
    if (existing) {
      try {
        const sub = await stripe.subscriptions.retrieve(
          existing.subscriptionId
        );
        if (!isActiveStatus(sub.status)) {
          // Subscription is canceled, incomplete, or otherwise inactive.
          subscriptionByEmail.delete(email);
          existing = null;
        }
      } catch (innerErr) {
        console.warn("Unable to retrieve cached subscription", innerErr);
        subscriptionByEmail.delete(email);
        existing = null;
      }
    }

    // If not in cache (or cache is stale), try to discover an active Stripe subscription for this email.
    if (!existing) {
      // Try to find a customer by email.
      const customers = await stripe.customers.list({ email, limit: 1 });
      const customer = customers.data[0];

      if (!customer) {
        return res.json({ subscription: null });
      }

      // Look for any active subscription for this customer.
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 10,
      });

      const activeSub = subs.data.find((s) => isActiveStatus(s.status));
      if (!activeSub) {
        return res.json({ subscription: null });
      }

      const priceId = activeSub.items.data[0]?.price?.id;
      existing = {
        subscriptionId: activeSub.id,
        priceId,
        customerId: customer.id,
      };

      // Cache it for later calls.
      subscriptionByEmail.set(email, existing);
      customerByEmail.set(email, customer);
    }

    res.json({ subscription: existing });
  } catch (err) {
    console.error("get-subscription error", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Stripe backend listening on port ${PORT}`);
});
