jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));
const request = require("supertest");
const app = require("../src/app");

jest.mock("../src/models/product.model", () => ({
  __esModule: true,
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const Product = require("../src/models/product.model");

describe("GET /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a product when a valid id is provided", async () => {
    const productId = "507f1f77bcf86cd799439011";

    const product = {
      _id: productId,
      title: "Wireless Mouse",
      category: "Electronics",
      price: { amount: 599, currency: "INR" },
    };

    Product.findById.mockResolvedValue(product);

    const response = await request(app).get(`/api/products/${productId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.product).toEqual(product);
    expect(Product.findById).toHaveBeenCalledWith(productId);
  });

  it("returns 400 for an invalid product id format", async () => {
    const response = await request(app).get(
      "/api/products/not-a-valid-id"
    );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Product.findById).not.toHaveBeenCalled();
  });

  it("returns 404 when no product exists for the provided id", async () => {
    const productId = "507f1f77bcf86cd799439012";

    Product.findById.mockResolvedValue(null);

    const response = await request(app).get(`/api/products/${productId}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("No product found.");
    expect(Product.findById).toHaveBeenCalledWith(productId);
  });
});