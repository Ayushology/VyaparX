const express = require("express");
const request = require("supertest");
const { validationResult } = require("express-validator");
const { updateItemInCart } = require("../src/controllers/cart.controller");
const {
  validateUpdateItemInCart,
} = require("../src/validators/items.validator");

jest.mock("../src/models/cart.model", () => {
  const cartModelMock = jest.fn(function (data) {
    this.user = data.user;
    this.items = data.items || [];
    this.save = jest.fn().mockResolvedValue(this);
  });

  cartModelMock.findOne = jest.fn();
  return cartModelMock;
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

  app.patch(
    "/api/cart/items/:productId",
    validateUpdateItemInCart,
    ensureValidation,
    updateItemInCart,
  );

  return app;
}

describe("PATCH /api/cart/items/:productId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates item quantity for an authenticated buyer", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const existingCart = {
      user: "buyer-123",
      items: [{ productId: "prod_001", quantity: 1 }],
      save: saveMock,
    };

    cartModel.findOne.mockResolvedValue(existingCart);

    const response = await request(buildApp())
      .patch("/api/cart/items/prod_001")
      .send({ quantity: 4 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Item quantity updated successfully");
    expect(existingCart.items[0].quantity).toBe(4);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the cart does not exist for the authenticated buyer", async () => {
    cartModel.findOne.mockResolvedValue(null);

    const response = await request(buildApp())
      .patch("/api/cart/items/prod_404")
      .send({ quantity: 2 });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Cart not found");
  });

  it("returns 404 when the item is missing from the cart", async () => {
    const existingCart = {
      user: "buyer-123",
      items: [{ productId: "prod_002", quantity: 1 }],
      save: jest.fn(),
    };

    cartModel.findOne.mockResolvedValue(existingCart);

    const response = await request(buildApp())
      .patch("/api/cart/items/prod_001")
      .send({ quantity: 2 });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Item not found in cart");
  });

  it("returns 400 when quantity is missing", async () => {
    const response = await request(buildApp())
      .patch("/api/cart/items/prod_001")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "quantity",
          message: "Quantity is required.",
        }),
      ]),
    );
  });
});
