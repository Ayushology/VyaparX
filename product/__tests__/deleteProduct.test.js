const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/models/product.model", () => ({
  __esModule: true,
  findById: jest.fn(),
}));

jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
  deleteBulkImages: jest.fn(),
}));

const Product = require("../src/models/product.model");
const { deleteBulkImages } = require("../src/services/imagekit.service");

describe("DELETE /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sellerToken = jwt.sign(
    { id: "seller_1", role: "seller" },
    process.env.JWT_SECRET,
  );

  const adminToken = jwt.sign(
    { id: "admin_1", role: "admin" },
    process.env.JWT_SECRET,
  );

  it("deletes a product successfully when the seller owns it", async () => {
    const productId = "507f1f77bcf86cd799439011";
    const product = {
      _id: productId,
      seller: "seller_1",
      images: [{ id: "img_123" }],
      deleteOne: jest.fn().mockResolvedValue(true),
    };

    Product.findById.mockResolvedValue(product);
    deleteBulkImages.mockResolvedValue(true);

    const response = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Product deleted successfully.");
    expect(Product.findById).toHaveBeenCalledWith(productId);
    expect(deleteBulkImages).toHaveBeenCalledWith(["img_123"]);
    expect(product.deleteOne).toHaveBeenCalled();
  });

  it("deletes a product successfully when an admin deletes any product", async () => {
    const productId = "507f1f77bcf86cd799439012";
    const product = {
      _id: productId,
      seller: "seller_2",
      images: [],
      deleteOne: jest.fn().mockResolvedValue(true),
    };

    Product.findById.mockResolvedValue(product);

    const response = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Product deleted successfully.");
    expect(Product.findById).toHaveBeenCalledWith(productId);
    expect(product.deleteOne).toHaveBeenCalled();
  });

  it("returns 400 when the product id format is invalid", async () => {
    const response = await request(app)
      .delete("/api/products/not-a-valid-id")
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid product ID format.");
    expect(Product.findById).not.toHaveBeenCalled();
  });

  it("returns 404 when the product does not exist", async () => {
    const productId = "507f1f77bcf86cd799439013";
    Product.findById.mockResolvedValue(null);

    const response = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Product not found.");
    expect(Product.findById).toHaveBeenCalledWith(productId);
  });

  it("returns 403 when a seller tries to delete another seller's product", async () => {
    const productId = "507f1f77bcf86cd799439014";
    const product = {
      _id: productId,
      seller: "seller_2",
      images: [],
      deleteOne: jest.fn(),
    };

    Product.findById.mockResolvedValue(product);

    const response = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Forbidden: You can delete only your products.",
    );
    expect(Product.findById).toHaveBeenCalledWith(productId);
    expect(product.deleteOne).not.toHaveBeenCalled();
  });
});
