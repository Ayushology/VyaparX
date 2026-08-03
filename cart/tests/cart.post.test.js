const express = require('express');
const request = require('supertest');
const { validationResult } = require('express-validator');
const cartController = require('../src/controllers/cart.controller');
const { validateItemToCart } = require('../src/validators/items.validator');
const cartModel = require('../src/models/cart.model');

jest.mock('../src/models/cart.model', () => {
  const cartModelMock = jest.fn();
  cartModelMock.findOne = jest.fn();
  return cartModelMock;
});

function ensureValidation(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
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
        message: 'Unauthorized: No token provided.',
      });
    }

    req.user = { id: 'user-123', role: 'buyer' };
    next();
  });

  app.post('/api/cart/items', validateItemToCart, ensureValidation, cartController.addItemToCart);
  return app;
}

describe('POST /api/cart/items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no token is provided', async () => {
    const response = await request(buildApp({ authenticated: false }))
      .post('/api/cart/items')
      .send({ productId: 'product-1', quantity: 1 });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/No token provided/i);
  });

  it('creates a cart and adds a new item for a buyer with a valid token', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const createdCart = {
      user: 'user-123',
      items: [],
      save: saveMock,
    };

    cartModel.findOne.mockResolvedValue(null);
    cartModel.mockImplementation(() => createdCart);

    const response = await request(buildApp())
      .post('/api/cart/items')
      .send({ productId: 'product-1', quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Item added to cart successfully');
    expect(response.body.cart.items).toEqual([{ productId: 'product-1', quantity: 2 }]);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it('increments quantity when the same product already exists in the cart', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const existingCart = {
      user: 'user-123',
      items: [{ productId: 'product-1', quantity: 1 }],
      save: saveMock,
    };

    cartModel.findOne.mockResolvedValue(existingCart);

    const response = await request(buildApp())
      .post('/api/cart/items')
      .send({ productId: 'product-1', quantity: 2 });

    expect(response.status).toBe(200);
    expect(existingCart.items[0].quantity).toBe(3);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(response.body.cart.items[0]).toEqual({ productId: 'product-1', quantity: 3 });
  });

  it('returns 400 when productId is missing', async () => {
    const response = await request(buildApp())
      .post('/api/cart/items')
      .send({ quantity: 1 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'productId',
          message: 'Product ID is required.',
        }),
      ]),
    );
  });
});
