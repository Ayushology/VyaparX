const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { MongoMemoryServer } = require("mongodb-memory-server");

const orderRoutes = require("../src/routes/order.routes");
const OrderModel = require("../models/order.model");

process.env.JWT_SECRET = "test-secret";

let mongoServer;
let app;

beforeAll(async () => {
  // 1. Spin up an in-memory MongoDB instance so we don't pollute Atlas
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 2. Build Express app with real routes, cookie-parser, & real controller
  app = express();
  app.use(express.json());
  app.use(cookieParser()); // Required to parse incoming cookies
  app.use("/api/orders", orderRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up database documents after each test case
  await OrderModel.deleteMany({});
});

describe("POST /api/orders (Full Integration Suite with Cookies)", () => {
  const buyerToken = jwt.sign(
    { id: "buyer-101", role: "buyer" },
    process.env.JWT_SECRET
  );

  const validAddress = {
    street: "123 Market Road",
    city: "Delhi",
    state: "Delhi",
    zip: "110001",
    country: "India",
  };

  it("successfully creates a multi-seller order and saves it to MongoDB", async () => {
    const payload = {
      items: [
        {
          product: "prod-1",
          seller: "seller-A",
          quantity: 2,
          price: { amount: 500, currency: "INR" },
        },
        {
          product: "prod-2",
          seller: "seller-B",
          quantity: 1,
          price: { amount: 1500, currency: "INR" },
        },
      ],
      shippingAddress: validAddress,
    };

    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", [`token=${buyerToken}`]) // Send JWT in cookie
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.order.user).toBe("buyer-101");
    // Verifies defensive math: (2 * 500) + (1 * 1500) = 2500
    expect(response.body.order.totalPrice.amount).toBe(2500);

    // Verify document was actually persisted in MongoDB
    const dbOrder = await OrderModel.findById(response.body.order._id);
    expect(dbOrder).not.toBeNull();
    expect(dbOrder.items).toHaveLength(2);
    expect(dbOrder.items[0].seller).toBe("seller-A");
  });

  it("returns 400 Bad Request when items array is empty", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", [`token=${buyerToken}`])
      .send({
        items: [],
        shippingAddress: validAddress,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/at least one item/i);
  });

  it("returns 400 Bad Request when shippingAddress is missing", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", [`token=${buyerToken}`])
      .send({
        items: [
          {
            product: "prod-1",
            seller: "seller-A",
            quantity: 1,
            price: { amount: 500, currency: "INR" },
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/shipping address is required/i);
  });

  it("returns 400 Bad Request when an item is missing the seller ID", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", [`token=${buyerToken}`])
      .send({
        items: [
          {
            product: "prod-1",
            // seller missing
            quantity: 1,
            price: { amount: 500, currency: "INR" },
          },
        ],
        shippingAddress: validAddress,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/product, seller, and price/i);
  });
});