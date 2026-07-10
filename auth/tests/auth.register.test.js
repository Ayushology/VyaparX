const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user.model");

require("./setup");

describe("POST /auth/register", () => {
  it("registers a new user and returns created user with token cookie", async () => {
    const unique = Date.now();

    const payload = {
      username: `newuser_${unique}`,
      email: `new_${unique}@example.com`,
      password: "Password123",
      fullName: {
        firstName: "New",
        lastName: "User",
      },
    };

    const res = await request(app)
      .post("/auth/register")
      .send(payload);

    expect(res.status).toBe(201);

    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.username).toBe(payload.username);
    expect(res.body.user).not.toHaveProperty("password");

    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toContain("token=");

    const user = await User.findOne({ email: payload.email });

    expect(user).not.toBeNull();
    expect(user.password).not.toBe(payload.password);
  });

  it("rejects duplicate email registration", async () => {
    const unique = Date.now();

    const payload = {
      username: `dupemail_${unique}`,
      email: `dup_${unique}@example.com`,
      password: "Password123",
      fullName: {
        firstName: "Dup",
        lastName: "Email",
      },
    };

    await request(app).post("/auth/register").send(payload);

    const res = await request(app)
      .post("/auth/register")
      .send({
        ...payload,
        username: `anotheruser_${unique}`,
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("message");
  });

  it("rejects duplicate username registration", async () => {
    const unique = Date.now();

    const payload = {
      username: `dupuser_${unique}`,
      email: `dupuser_${unique}@example.com`,
      password: "Password123",
      fullName: {
        firstName: "Dup",
        lastName: "User",
      },
    };

    await request(app).post("/auth/register").send(payload);

    const res = await request(app)
      .post("/auth/register")
      .send({
        ...payload,
        email: `another_${unique}@example.com`,
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("message");
  });

  it("rejects registration with missing fields", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("rejects registration with short password", async () => {
    const payload = {
      username: "shortpass",
      email: "shortpass@example.com",
      password: "123",
      fullName: {
        firstName: "Short",
        lastName: "Pass",
      },
    };

    const res = await request(app)
      .post("/auth/register")
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("rejects registration with invalid email", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        username: "invalidemail",
        email: "not-an-email",
        password: "Password123",
        fullName: {
          firstName: "Invalid",
          lastName: "Email",
        },
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
});