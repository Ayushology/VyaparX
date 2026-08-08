const request = require("supertest");

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
          user: req.user.id,
          status: "CANCELLED",
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

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: mockCancelOrder,
      updateShippingAddress: jest.fn(),
    }));

    const app = require("../src/app");

    const orderId = "643b9ef10000000000000001";

    const res = await request(app).post(
      `/api/orders/${orderId}/cancel`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      "Order cancelled successfully."
    );

    expect(mockCancelOrder).toHaveBeenCalledTimes(1);

    expect(
      mockCancelOrder.mock.calls[0][0].params.id
    ).toBe(orderId);
  });

  test("returns 403 when authentication denies cancellation", async () => {
    const mockCancelOrder = jest.fn((req, res) => {
      return res.status(200).json({
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

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: mockCancelOrder,
      updateShippingAddress: jest.fn(),
    }));

    const app = require("../src/app");

    const res = await request(app).post(
      "/api/orders/643b9ef10000000000000002/cancel"
    );

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Forbidden: Insufficient permissions."
    );

    expect(mockCancelOrder).not.toHaveBeenCalled();
  });

  test("passes order id to cancel controller", async () => {
    let capturedId = null;

    const mockCancelOrder = jest.fn((req, res) => {
      capturedId = req.params.id;

      return res.status(200).json({
        success: true,
        message: "Order cancelled successfully.",
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

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: mockCancelOrder,
      updateShippingAddress: jest.fn(),
    }));

    const app = require("../src/app");

    await request(app).post(
      "/api/orders/abc123/cancel"
    );

    expect(capturedId).toBe("abc123");
    expect(mockCancelOrder).toHaveBeenCalledTimes(1);
  });
});