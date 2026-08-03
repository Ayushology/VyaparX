const express = require("express");
const request = require("supertest");
const cartController = require("../src/controllers/cart.controller");
const cartModel = require("../src/models/cart.model");

jest.mock("../src/models/cart.model", () => {
  const Cart = jest.fn(function (data) {
    this.user = data.user;
    this.items = data.items || [];
    this.save = jest.fn().mockResolvedValue(this);
    this.remove = jest.fn().mockResolvedValue(true);
  });

  Cart.findOne = jest.fn();

  return Cart;
});

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

  app.delete("/api/cart", cartController.deleteCart);
  app.delete("/api/cart/items/:productId", cartController.removeItemFromCart);

  return app;
}

describe("DELETE /api/cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no token is provided", async () => {
    const response = await request(buildApp({ authenticated: false })).delete(
      "/api/cart",
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Unauthorized: No token provided.");
  });

  it("deletes the current buyer's cart successfully", async () => {
    const existingCart = {
      user: "buyer-123",
      items: [{ productId: "prod_001", quantity: 2 }],
      remove: jest.fn().mockResolvedValue(true),
    };

    cartModel.findOne.mockResolvedValue(existingCart);

    const response = await request(buildApp()).delete("/api/cart");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Cart deleted successfully");
    expect(existingCart.remove).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the cart does not exist for the authenticated buyer", async () => {
    cartModel.findOne.mockResolvedValue(null);

    const response = await request(buildApp()).delete("/api/cart");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Cart not found");
  });
});

describe("DELETE /api/cart/items/:productId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes an item from the current buyer's cart successfully", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const existingCart = {
      user: "buyer-123",
      items: [
        { productId: "prod_001", quantity: 1 },
        { productId: "prod_002", quantity: 3 },
      ],
      save: saveMock,
    };

    cartModel.findOne.mockResolvedValue(existingCart);

    const response = await request(buildApp()).delete(
      "/api/cart/items/prod_001",
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Item removed from cart successfully");
    expect(response.body.cart.items).toEqual([
      { productId: "prod_002", quantity: 3 },
    ]);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the cart does not exist for the authenticated buyer", async () => {
    cartModel.findOne.mockResolvedValue(null);

    const response = await request(buildApp()).delete(
      "/api/cart/items/prod_001",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Cart not found");
  });
});
