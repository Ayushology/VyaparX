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
