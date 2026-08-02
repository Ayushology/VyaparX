const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/models/product.model", () => ({
  __esModule: true,
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

const Product = require("../src/models/product.model");

describe("GET /api/products/seller", () => {
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

  it("returns the authenticated seller's products with pagination metadata", async () => {
    const products = [
      {
        _id: "prod_1",
        title: "Phone",
        category: "Electronics",
        seller: "seller_1",
      },
    ];

    const query = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(products),
    };

    Product.find.mockReturnValue(query);
    Product.countDocuments.mockResolvedValue(2);

    const response = await request(app)
      .get("/api/products/seller")
      .set("Authorization", `Bearer ${sellerToken}`)
      .query({ skip: 0, limit: 1 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.pagination).toEqual({
      totalProducts: 2,
      totalPages: 2,
      currentPage: 1,
      count: 1,
    });
    expect(response.body.products).toEqual(products);

    expect(Product.find).toHaveBeenCalledWith({ seller: "seller_1" });
    expect(query.skip).toHaveBeenCalledWith(0);
    expect(query.limit).toHaveBeenCalledWith(1);
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("returns 403 for non-seller users", async () => {
    const response = await request(app)
      .get("/api/products/seller")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Forbidden: Insufficient permissions.");
    expect(Product.find).not.toHaveBeenCalled();
  });

  it("returns 401 when the seller token is missing", async () => {
    const response = await request(app).get("/api/products/seller");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Unauthorized: No token provided.");
    expect(Product.find).not.toHaveBeenCalled();
  });
});
