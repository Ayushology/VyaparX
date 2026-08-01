jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/models/product.model", () => ({
  __esModule: true,
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const Product = require("../src/models/product.model");

describe("PATCH /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const authToken = jwt.sign(
    { id: "seller_1", role: "seller" },
    process.env.JWT_SECRET
  );

  it("updates a product when a seller provides valid fields", async () => {
    const productId = "507f1f77bcf86cd799439011";

    const existingProduct = {
      _id: productId,
      title: "Old Title",
      price: { amount: 100, currency: "INR" },
      category: "Electronics",
      stock: 2,
      seller: "seller_1",
    };

    const updatedProduct = {
      ...existingProduct,
      title: "Updated Title",
      price: { amount: 150, currency: "INR" },
      stock: 5,
    };

    Product.findById.mockResolvedValue(existingProduct);
    Product.findByIdAndUpdate.mockResolvedValue(updatedProduct);

    const response = await request(app)
      .patch(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Updated Title",
        price: 150,
        stock: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.product).toEqual(updatedProduct);

    expect(Product.findById).toHaveBeenCalledWith(productId);
    expect(Product.findByIdAndUpdate).toHaveBeenCalled();
  });

  it("returns 400 for an invalid product id format", async () => {
    const response = await request(app)
      .patch("/api/products/not-a-valid-id")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Updated Title",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Product.findById).not.toHaveBeenCalled();
  });

  it("returns 404 when no product exists for the provided id", async () => {
    const productId = "507f1f77bcf86cd799439012";

    Product.findById.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Updated Title",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("No product found.");

    expect(Product.findById).toHaveBeenCalledWith(productId);
  });
});