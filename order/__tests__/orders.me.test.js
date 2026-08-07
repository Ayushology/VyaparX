const request = require("supertest");

describe("GET /api/orders/me", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("returns 200 and orders for authenticated buyer", async () => {
    jest.resetModules();

    const mockGetMyOrders = jest.fn((req, res) => {
      return res.status(200).json({
        success: true,
        message: "Orders fetched successfully.",
        pagination: {
          totalOrders: 0,
          totalPages: 1,
          currentPage: 2,
          pageSize: 5,
          count: 0,
        },
        orders: [],
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
      getMyOrders: mockGetMyOrders,
    }));

    const app = require("../src/app");

    const res = await request(app)
      .get("/api/orders/me?page=2&limit=5")
      .set("Authorization", "Bearer faketoken");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination.currentPage).toBe(2);
    expect(mockGetMyOrders).toHaveBeenCalled();
  });

  test("responds 401 when auth middleware denies access", async () => {
    jest.resetModules();

    jest.doMock("../src/routes/auth.middleware", () => ({
      createAuthMiddleware: () => (req, res) =>
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        }),
    }));

    const mockGetMyOrders = jest.fn((req, res) =>
      res.status(200).json({
        success: true,
      })
    );

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: mockGetMyOrders,
    }));

    const app = require("../src/app");

    const res = await request(app).get("/api/orders/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(mockGetMyOrders).not.toHaveBeenCalled();
  });

  test("passes query params to controller", async () => {
    jest.resetModules();

    let capturedQuery = null;

    const mockGetMyOrders = jest.fn((req, res) => {
      capturedQuery = req.query;

      return res.status(200).json({
        success: true,
        pagination: {
          currentPage: Number(req.query.page || 1),
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
      getMyOrders: mockGetMyOrders,
    }));

    const app = require("../src/app");

    const res = await request(app).get("/api/orders/me?page=3&limit=2");

    expect(res.status).toBe(200);
    expect(capturedQuery).not.toBeNull();
    expect(capturedQuery.page).toBe("3");
    expect(capturedQuery.limit).toBe("2");
  });
});