const request = require("supertest");

describe("PATCH /api/orders/:id/updateAddress", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("returns 200 and updates shipping address for authorized buyer", async () => {
    const mockUpdateShippingAddress = jest.fn((req, res) => {
      return res.status(200).json({
        success: true,
        message: "Shipping address updated successfully.",
        order: {
          _id: req.params.id,
          user: req.user.id,
          shippingAddress: req.body.shippingAddress,
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

    jest.doMock("../src/validators/updateAddress.validator", () => ({
      updateAddressValidation: (req, res, next) => {
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
      updateShippingAddress: mockUpdateShippingAddress,
    }));

    const app = require("../src/app");

    const orderId = "643b9ef10000000000000001";

    const payload = {
      shippingAddress: {
        street: "24 Market Street",
        city: "Mumbai",
        state: "Maharashtra",
        zip: "400001",
        country: "India",
      },
    };

    const res = await request(app)
      .patch(`/api/orders/${orderId}/updateAddress`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      "Shipping address updated successfully."
    );

    expect(mockUpdateShippingAddress).toHaveBeenCalledTimes(1);

    expect(
      mockUpdateShippingAddress.mock.calls[0][0].params.id
    ).toBe(orderId);

    expect(
      mockUpdateShippingAddress.mock.calls[0][0].body.shippingAddress
    ).toEqual(payload.shippingAddress);
  });

  test("returns 403 when authentication denies access", async () => {
    const mockUpdateShippingAddress = jest.fn((req, res) => {
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

    jest.doMock("../src/validators/updateAddress.validator", () => ({
      updateAddressValidation: (req, res, next) => {
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
      updateShippingAddress: mockUpdateShippingAddress,
    }));

    const app = require("../src/app");

    const res = await request(app)
      .patch("/api/orders/643b9ef10000000000000002/updateAddress")
      .send({
        shippingAddress: {
          street: "11 Main Road",
          city: "Delhi",
          state: "Delhi",
          zip: "110001",
          country: "India",
        },
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Forbidden: Insufficient permissions."
    );

    expect(mockUpdateShippingAddress).not.toHaveBeenCalled();
  });

  test("passes route params and request body to controller", async () => {
    let capturedParams = null;
    let capturedBody = null;

    const mockUpdateShippingAddress = jest.fn((req, res) => {
      capturedParams = req.params;
      capturedBody = req.body;

      return res.status(200).json({
        success: true,
        message: "Shipping address updated successfully.",
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

    jest.doMock("../src/validators/updateAddress.validator", () => ({
      updateAddressValidation: (req, res, next) => {
        next();
      },
    }));

    jest.doMock("../src/controllers/order.controller", () => ({
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      cancelOrder: jest.fn(),
      updateShippingAddress: mockUpdateShippingAddress,
    }));

    const app = require("../src/app");

    const payload = {
      shippingAddress: {
        street: "Lane 1",
        city: "Pune",
        state: "Maharashtra",
        zip: "411001",
        country: "India",
      },
    };

    const res = await request(app)
      .patch("/api/orders/abc123/updateAddress")
      .send(payload);

    expect(res.status).toBe(200);

    expect(capturedParams.id).toBe("abc123");
    expect(capturedBody).toEqual(payload);

    expect(mockUpdateShippingAddress).toHaveBeenCalledTimes(1);
  });
});