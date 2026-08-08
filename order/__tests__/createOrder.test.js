const request = require("supertest");

describe("POST /api/orders/", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("returns 201 and creates an order for authenticated buyer", async () => {
    const mockCreateOrder = jest.fn((req, res) => {
      return res.status(201).json({
        success: true,
        message: "Order created successfully.",
        order: {
          _id: "643b9ef10000000000000010",
          user: req.user.id,
          status: "PENDING",
        },
      });
    });

    jest.doMock("../src/middlewares/auth.middleware", () => ({
      createAuthMiddleware: jest.fn(() => {
        return (req, res, next) => {
          req.user = {
            id: "user1",
            role: "buyer",
          };

          next();
        };
      }),
    }));

    jest.doMock("../src/validators/order.validator", () => ({
      createOrderValidation: (req, res, next) => {
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: mockCreateOrder,
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
      updateShippingAddress: jest.fn(),
    }));

    const app = require("../src/app");

    const payload = {
      shippingAddress: {
        name: "Test Buyer",
        line1: "123 Market Street",
        city: "Mumbai",
      },
    };

    const res = await request(app)
      .post("/api/orders/")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Order created successfully.");

    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    expect(mockCreateOrder.mock.calls[0][0].user.id).toBe("user1");
  });

  test("returns 401 when authentication fails", async () => {
    const mockCreateOrder = jest.fn((req, res) => {
      return res.status(201).json({
        success: true,
      });
    });

    jest.doMock("../src/middlewares/auth.middleware", () => ({
      createAuthMiddleware: jest.fn(() => {
        return (req, res) => {
          return res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided.",
          });
        };
      }),
    }));

    jest.doMock("../src/validators/order.validator", () => ({
      createOrderValidation: (req, res, next) => {
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: mockCreateOrder,
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
      updateShippingAddress: jest.fn(),
    }));

    const app = require("../src/app");

    const res = await request(app)
      .post("/api/orders/");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Unauthorized: No token provided."
    );

    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  test("returns 403 when buyer is not allowed", async () => {
    const mockCreateOrder = jest.fn((req, res) => {
      return res.status(201).json({
        success: true,
      });
    });

    jest.doMock("../src/middlewares/auth.middleware", () => ({
      createAuthMiddleware: jest.fn(() => {
        return (req, res) => {
          return res.status(403).json({
            success: false,
            message: "Forbidden: Insufficient permissions.",
          });
        };
      }),
    }));

    jest.doMock("../src/validators/order.validator", () => ({
      createOrderValidation: (req, res, next) => {
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: mockCreateOrder,
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
      updateShippingAddress: jest.fn(),
    }));

    const app = require("../src/app");

    const res = await request(app)
      .post("/api/orders/");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Forbidden: Insufficient permissions."
    );

    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  test("passes shipping payload to controller", async () => {
    let capturedBody = null;

    const mockCreateOrder = jest.fn((req, res) => {
      capturedBody = req.body;

      return res.status(201).json({
        success: true,
        order: {},
      });
    });

    jest.doMock("../src/middlewares/auth.middleware", () => ({
      createAuthMiddleware: jest.fn(() => {
        return (req, res, next) => {
          req.user = {
            id: "user1",
            role: "buyer",
          };

          next();
        };
      }),
    }));

    jest.doMock("../src/validators/order.validator", () => ({
      createOrderValidation: (req, res, next) => {
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: mockCreateOrder,
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
      updateShippingAddress: jest.fn(),
    }));

    const app = require("../src/app");

    const payload = {
      shippingAddress: {
        line1: "420 Market Road",
        city: "Delhi",
      },
    };

    const res = await request(app)
      .post("/api/orders/")
      .send(payload);

    expect(res.status).toBe(201);
    expect(capturedBody).not.toBeNull();
    expect(capturedBody.shippingAddress).toEqual(
      payload.shippingAddress
    );

    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
  });
});