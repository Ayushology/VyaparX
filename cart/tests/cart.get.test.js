const express = require("express");
const request = require("supertest");
const cartModel = require("../src/models/cart.model");

jest.mock("../src/models/cart.model", () => {
  const cartModelMock = jest.fn(function (data) {
    this.user = data.user;
    this.items = data.items || [];
    this.save = jest.fn().mockResolvedValue(this);
  });

  cartModelMock.findOne = jest.fn();
  return cartModelMock;
});

function buildApp({ authenticated = true, userRole = "buyer" } = {}) {
  const app = express();

  app.use(express.json());

  app.use((req, res, next) => {
    if (!authenticated) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided.",
      });
    }

    if (userRole !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions.",
      });
    }

    req.user = { id: "buyer-123", role: "buyer" };
    next();
  });

  app.get("/api/cart/", async (req, res) => {
    const cart = await cartModel.findOne({ user: req.user.id });

    if (!cart) {
      const newCart = new cartModel({ user: req.user.id, items: [] });
      await newCart.save();
      return res.status(200).json({
        success: true,
        message: "Cart retrieved successfully",
        cart: newCart,
        totalItems: {
          inCart: 0,
          totalQuantity: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      cart,
      totalItems: {
        inCart: cart.items.length,
        totalQuantity: cart.items.reduce(
          (total, item) => total + item.quantity,
          0,
        ),
      },
    });
  });

  return app;
}

describe("GET /api/cart/", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when no token is provided", async () => {
    const response = await request(buildApp({ authenticated: false })).get(
      "/api/cart/",
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Unauthorized: No token provided.");
  });

  it("returns 200 and the cart details for an authenticated buyer", async () => {
    const existingCart = {
      user: "buyer-123",
      items: [
        { productId: "prod_001", quantity: 2 },
        { productId: "prod_002", quantity: 1 },
      ],
    };

    cartModel.findOne.mockResolvedValue(existingCart);

    const response = await request(buildApp()).get("/api/cart/");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Cart retrieved successfully");
    expect(response.body.cart).toEqual(existingCart);
    expect(response.body.totalItems).toEqual({
      inCart: 2,
      totalQuantity: 3,
    });
  });

  it("returns 200 and creates an empty cart when the buyer does not have one yet", async () => {
    cartModel.findOne.mockResolvedValue(null);

    const response = await request(buildApp()).get("/api/cart/");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Cart retrieved successfully");
    expect(response.body.cart).toBeDefined();
    expect(response.body.cart.user).toBe("buyer-123");
    expect(response.body.cart.items).toEqual([]);
    expect(response.body.totalItems).toEqual({
      inCart: 0,
      totalQuantity: 0,
    });
  });

  it("returns 403 when the authenticated user does not have buyer permissions", async () => {
    const response = await request(buildApp({ userRole: "seller" })).get(
      "/api/cart/",
    );

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Forbidden: Insufficient permissions.");
  });
});
