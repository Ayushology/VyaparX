const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/models/product.model", () => ({
  __esModule: true,
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));

const Product = require("../src/models/product.model");
const { uploadImage } = require("../src/services/imagekit.service");

describe("POST /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const authToken = jwt.sign(
    { id: "seller_1", role: "seller" },
    process.env.JWT_SECRET,
  );

  it("creates a product when valid data and an image upload succeed", async () => {
    uploadImage.mockResolvedValue({
      url: "https://ik.imagekit.io/demo/product.jpg",
      thumbnail: "https://ik.imagekit.io/demo/product-thumb.jpg",
      fileId: "img_123",
    });

    Product.create.mockResolvedValue({
      _id: "prod_123",
      title: "Test Product",
      price: { amount: 100, currency: "INR" },
      category: "Electronics",
      stock: 10,
      seller: "seller_1",
      images: [
        {
          url: "https://ik.imagekit.io/demo/product.jpg",
          thumbnail: "https://ik.imagekit.io/demo/product-thumb.jpg",
          id: "img_123",
        },
      ],
    });

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Test Product")
      .field("description", "A sample product")
      .field("price", "100")
      .field("currency", "INR")
      .field("category", "Electronics")
      .field("stock", "10")
      .attach("images", Buffer.from("fake-image-data"), {
        filename: "product.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(uploadImage).toHaveBeenCalled();
    expect(Product.create).toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Test Product");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("returns 400 when price is negative", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Test Product")
      .field("price", "-10")
      .field("category", "Electronics")
      .attach("images", Buffer.from("fake-image-data"), {
        filename: "product.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe("GET /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns products with pagination metadata", async () => {
    const products = [
      {
        _id: "prod_1",
        title: "Phone",
        category: "Electronics",
        price: { amount: 100, currency: "INR" },
      },
    ];

    const query = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(products),
    };

    Product.find.mockReturnValue(query);
    Product.countDocuments.mockResolvedValue(1);

    const response = await request(app)
      .get("/api/products")
      .query({ skip: 0, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.pagination).toEqual({
      totalProducts: 1,
      totalPages: 1,
      currentPage: 1,
      count: 1,
    });
    expect(response.body.products).toEqual(products);
    expect(Product.find).toHaveBeenCalledWith({});
    expect(query.skip).toHaveBeenCalledWith(0);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("filters products by query, category, and price range", async () => {
    const products = [
      {
        _id: "prod_2",
        title: "iPhone 15",
        category: "Electronics",
        price: { amount: 999, currency: "INR" },
      },
    ];

    const query = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(products),
    };

    Product.find.mockReturnValue(query);
    Product.countDocuments.mockResolvedValue(1);

    const response = await request(app)
      .get("/api/products")
      .query({
        q: "iphone",
        category: "Electronics",
        minPrice: 100,
        maxPrice: 1000,
        skip: 1,
        limit: 2,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.products).toEqual(products);

    expect(Product.find).toHaveBeenCalledWith({
      title: { $regex: "iphone", $options: "i" },
      category: "Electronics",
      "price.amount": { $gte: 100, $lte: 1000 },
    });
  });
});
