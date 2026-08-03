const express = require("express");
const request = require("supertest");
const { validationResult } = require("express-validator");
const { addItemToCart } = require("../src/controllers/cart.controller");
const { validateItemToCart } = require("../src/validators/items.validator");

jest.mock("../src/models/cart.model", () => {
  const Cart = jest.fn(function (data) {
    this.user = data.user;
    this.items = data.items || [];
    this.save = jest.fn().mockResolvedValue(this);
  });

  Cart.findOne = jest.fn();

  return Cart;
});

const cartModel = require("../src/models/cart.model");

function ensureValidation(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
}

function buildApp({ authenticated = true } = {}) {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    if (!authenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided.",
      });
    }

    req.user = { id: "buyer-123", role: "buyer" };
    next();
  });

  app.post(
    "/api/cart/items",
    validateItemToCart,
    ensureValidation,
    addItemToCart,
  );

  return app;
}

describe("POST /api/cart/items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cartModel.findOne.mockResolvedValue(null);
  });

  it("adds an item to cart for an authenticated buyer", async () => {
    const response = await request(buildApp())
      .post("/api/cart/items")
      .send({ productId: "prod_001", quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Item added to cart successfully");
    expect(response.body.cart).toBeDefined();
    expect(response.body.cart.user).toBe("buyer-123");
    expect(response.body.cart.items).toEqual([
      { productId: "prod_001", quantity: 2 },
    ]);
    expect(cartModel.findOne).toHaveBeenCalledWith({ user: "buyer-123" });
  });

  it("returns 400 when productId is missing", async () => {
    const response = await request(buildApp())
      .post("/api/cart/items")
      .send({ quantity: 1 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "productId",
          message: "Product ID is required.",
        }),
      ]),
    );
  });

  it("returns 400 when quantity is less than 1", async () => {
    const response = await request(buildApp())
      .post("/api/cart/items")
      .send({ productId: "prod_001", quantity: 0 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "quantity",
          message: "Quantity must be an integer of at least 1.",
        }),
      ]),
    );
  });

  it("returns 401 for unauthenticated requests", async () => {
    const response = await request(buildApp({ authenticated: false }))
      .post("/api/cart/items")
      .send({ productId: "prod_001", quantity: 1 });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Unauthorized: No token provided.");
  });
});
