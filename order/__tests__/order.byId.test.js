const request = require("supertest");

describe("GET /api/orders/:id", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("returns 200 and the order for an authorized buyer", async () => {
    const mockGetOrderById = jest.fn((req, res) =>
      res.status(200).json({
        success: true,
        order: {
          _id: req.params.id,
          user: "user1",
          items: [],
        },
      }),
    );

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res, next) => {
        req.user = { id: "user1", role: "buyer" };
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: mockGetOrderById,
      cancelOrder: jest.fn(),
    }));

    const app = require("../src/app");

    const res = await request(app).get("/api/orders/643b9ef10000000000000001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order._id).toBe("643b9ef10000000000000001");
    expect(mockGetOrderById).toHaveBeenCalledTimes(1);
    expect(mockGetOrderById.mock.calls[0][0].params.id).toBe(
      "643b9ef10000000000000001",
    );
  });

  test("returns 404 when the controller reports order not found", async () => {
    const mockGetOrderById = jest.fn((req, res) =>
      res.status(404).json({
        success: false,
        message: "Order Not Found",
      }),
    );

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res, next) => {
        req.user = { id: "user1", role: "buyer" };
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: mockGetOrderById,
      cancelOrder: jest.fn(),
    }));

    const app = require("../src/app");

    const res = await request(app).get("/api/orders/643b9ef10000000000000002");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Order Not Found");
    expect(mockGetOrderById).toHaveBeenCalled();
  });

  test("returns 403 when authenticated user does not have the required role", async () => {
    const mockGetOrderById = jest.fn((req, res) =>
      res.status(200).json({ success: true }),
    );

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res) =>
        res.status(403).json({
          success: false,
          message: "Forbidden: Insufficient permissions.",
        }),
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: mockGetOrderById,
      cancelOrder: jest.fn(),
    }));

    const app = require("../src/app");

    const res = await request(app).get("/api/orders/643b9ef10000000000000003");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(mockGetOrderById).not.toHaveBeenCalled();
  });

  test("passes the route id parameter into the controller", async () => {
    let capturedId = null;

    const mockGetOrderById = jest.fn((req, res) => {
      capturedId = req.params.id;
      return res.status(200).json({ success: true });
    });

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res, next) => {
        req.user = { id: "user1", role: "buyer" };
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: mockGetOrderById,
      cancelOrder: jest.fn(),
    }));

    const app = require("../src/app");

    await request(app).get("/api/orders/abc123");

    expect(capturedId).toBe("abc123");
    expect(mockGetOrderById).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/orders/", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("returns 201 and creates an order for an authenticated buyer", async () => {
    const mockCreateOrder = jest.fn((req, res) =>
      res.status(201).json({
        success: true,
        message: "Order created successfully.",
        order: {
          _id: "643b9ef10000000000000010",
          user: req.user.id,
          status: "PENDING",
        },
      }),
    );

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res, next) => {
        req.user = { id: "user1", role: "buyer" };
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: mockCreateOrder,
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
    }));

    const app = require("../src/app");

    const payload = {
      shippingAddress: {
        name: "Test Buyer",
        line1: "123 Market Street",
        city: "Mumbai",
      },
    };

    const res = await request(app).post("/api/orders/").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Order created successfully.");
    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    expect(mockCreateOrder.mock.calls[0][0].user.id).toBe("user1");
  });

  test("returns 401 when auth middleware rejects the request", async () => {
    const mockCreateOrder = jest.fn((req, res) =>
      res.status(201).json({ success: true }),
    );

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res) =>
        res.status(401).json({
          success: false,
          message: "Unauthorized: No token provided.",
        }),
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: mockCreateOrder,
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
    }));

    const app = require("../src/app");

    const res = await request(app).post("/api/orders/");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unauthorized: No token provided.");
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  test("returns 403 when the user role is not allowed to create an order", async () => {
    const mockCreateOrder = jest.fn((req, res) =>
      res.status(201).json({ success: true }),
    );

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res) =>
        res.status(403).json({
          success: false,
          message: "Forbidden: Insufficient permissions.",
        }),
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: mockCreateOrder,
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
    }));

    const app = require("../src/app");

    const res = await request(app).post("/api/orders/");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Forbidden: Insufficient permissions.");
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  test("passes the shipping payload to the create controller", async () => {
    let capturedBody = null;

    const mockCreateOrder = jest.fn((req, res) => {
      capturedBody = req.body;
      return res.status(201).json({ success: true, order: {} });
    });

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res, next) => {
        req.user = { id: "user1", role: "buyer" };
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: mockCreateOrder,
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
    }));

    const app = require("../src/app");

    const payload = {
      shippingAddress: {
        line1: "420 Market Road",
        city: "Delhi",
      },
    };

    const res = await request(app).post("/api/orders/").send(payload);

    expect(res.status).toBe(201);
    expect(capturedBody).not.toBeNull();
    expect(capturedBody.shippingAddress).toEqual(payload.shippingAddress);
    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/orders/:id/cancel", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("returns 200 and cancels the order for an authorized buyer", async () => {
    const mockCancelOrder = jest.fn((req, res) => {
      return res.status(200).json({
        success: true,
        message: "Order cancelled successfully.",
        order: {
          _id: req.params.id,
          user: "user1",
          status: "CANCELLED",
        },
      });
    });

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res, next) => {
        req.user = { id: "user1", role: "buyer" };
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: mockCancelOrder,
    }));

    const app = require("../src/app");

    const res = await request(app).post(
      "/api/orders/643b9ef10000000000000001/cancel",
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Order cancelled successfully.");
    expect(mockCancelOrder).toHaveBeenCalledTimes(1);
    expect(mockCancelOrder.mock.calls[0][0].params.id).toBe(
      "643b9ef10000000000000001",
    );
  });

  test("returns 403 when the auth middleware blocks buyer cancellation", async () => {
    const mockCancelOrder = jest.fn((req, res) =>
      res.status(200).json({ success: true }),
    );

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res) =>
        res.status(403).json({
          success: false,
          message: "Forbidden: Insufficient permissions.",
        }),
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: mockCancelOrder,
    }));

    const app = require("../src/app");

    const res = await request(app).post(
      "/api/orders/643b9ef10000000000000002/cancel",
    );

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Forbidden: Insufficient permissions.");
    expect(mockCancelOrder).not.toHaveBeenCalled();
  });
});
