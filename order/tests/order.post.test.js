const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/controllers/order.controller", () => ({
  createOrder: jest.fn((req, res) => {
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: req.body,
    });
  }),
}));

const orderRoutes = require("../src/routes/order.routes");
const { createOrder } = require("../src/controllers/order.controller");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/orders", orderRoutes);
  return app;
}

describe("POST /api/orders", () => {
  const buyerToken = jwt.sign(
    { id: "buyer-1", role: "buyer" },
    process.env.JWT_SECRET,
  );

  const sellerToken = jwt.sign(
    { id: "seller-1", role: "seller" },
    process.env.JWT_SECRET,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no token is provided", async () => {
    const response = await request(buildApp())
      .post("/api/orders")
      .send({
        items: [
          {
            product: "p-1",
            seller: "s-1",
            quantity: 1,
            price: { amount: 100, currency: "INR" },
          },
        ],
        totalPrice: { amount: 100, currency: "INR" },
        shippingAddress: {
          street: "Main Street",
          city: "Delhi",
          state: "Delhi",
          zip: "110001",
          country: "India",
        },
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/No token provided/i);
  });

  it("returns 401 when the token is invalid", async () => {
    const response = await request(buildApp())
      .post("/api/orders")
      .set("Authorization", "Bearer invalid-token")
      .send({
        items: [
          {
            product: "p-1",
            seller: "s-1",
            quantity: 1,
            price: { amount: 100, currency: "INR" },
          },
        ],
        totalPrice: { amount: 100, currency: "INR" },
        shippingAddress: {
          street: "Main Street",
          city: "Delhi",
          state: "Delhi",
          zip: "110001",
          country: "India",
        },
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Invalid or expired token/i);
  });

  it("returns 403 when the authenticated user is not a buyer", async () => {
    const response = await request(buildApp())
      .post("/api/orders")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        items: [
          {
            product: "p-1",
            seller: "s-1",
            quantity: 1,
            price: { amount: 100, currency: "INR" },
          },
        ],
        totalPrice: { amount: 100, currency: "INR" },
        shippingAddress: {
          street: "Main Street",
          city: "Delhi",
          state: "Delhi",
          zip: "110001",
          country: "India",
        },
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Insufficient permissions/i);
  });

  it("creates an order when a buyer sends a valid payload", async () => {
    const payload = {
      items: [
        {
          product: "p-1",
          seller: "s-1",
          quantity: 2,
          price: { amount: 100, currency: "INR" },
        },
      ],
      totalPrice: { amount: 200, currency: "INR" },
      shippingAddress: {
        street: "Main Street",
        city: "Delhi",
        state: "Delhi",
        zip: "110001",
        country: "India",
      },
    };

    const response = await request(buildApp())
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Order created successfully");
    expect(response.body.data).toEqual(payload);
    expect(createOrder).toHaveBeenCalledTimes(1);
  });
});
