const request = require("supertest");
const app = require("../src/app");

require("./setup");

describe("POST /auth/login", () => {
  it("logs in a registered user using email", async () => {
    const payload = {
      username: "loginuser",
      email: "login@example.com",
      password: "Password123",
      fullName: {
        firstName: "Login",
        lastName: "User",
      },
    };

    await request(app).post("/auth/register").send(payload);

    const res = await request(app)
      .post("/auth/login")
      .send({
        email: payload.email,
        password: payload.password,
      });

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.username).toBe(payload.username);
    expect(res.body.user).not.toHaveProperty("password");

    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toContain("token=");
  });

  it("logs in a registered user using username", async () => {
    const payload = {
      username: "usernameLogin",
      email: "username@example.com",
      password: "Password123",
      fullName: {
        firstName: "User",
        lastName: "Name",
      },
    };

    await request(app).post("/auth/register").send(payload);

    const res = await request(app)
      .post("/auth/login")
      .send({
        username: payload.username,
        password: payload.password,
      });

    expect(res.status).toBe(200);

    expect(res.body.user.username).toBe(payload.username);
    expect(res.body.user).not.toHaveProperty("password");

    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toContain("token=");
  });

  it("rejects invalid password", async () => {
    const payload = {
      username: "badlogin",
      email: "bad@example.com",
      password: "GoodPass123",
      fullName: {
        firstName: "Bad",
        lastName: "Login",
      },
    };

    await request(app).post("/auth/register").send(payload);

    const res = await request(app)
      .post("/auth/login")
      .send({
        email: payload.email,
        password: "WrongPassword",
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("rejects non-existent user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "nouser@example.com",
        password: "Password123",
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("rejects request without email or username", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        password: "Password123",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("rejects request without password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "login@example.com",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("rejects invalid email format", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "invalid-email",
        password: "Password123",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
});