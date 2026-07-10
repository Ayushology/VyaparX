const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user.model");

require("./setup");

describe("GET /auth/me", () => {
  it("returns the authenticated user's profile", async () => {
    const unique = Date.now();

    const payload = {
      username: `meuser_${unique}`,
      email: `me_${unique}@example.com`,
      password: "Password123",
      fullName: {
        firstName: "Me",
        lastName: "User",
      },
    };

    await request(app).post("/auth/register").send(payload);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: payload.email,
        password: payload.password,
      });

    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers["set-cookie"];

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.username).toBe(payload.username);
    expect(res.body.user.fullName.firstName).toBe(payload.fullName.firstName);
    expect(res.body.user.fullName.lastName).toBe(payload.fullName.lastName);
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("returns 401 when no auth token is provided", async () => {
    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("returns 401 for an invalid token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", ["token=invalid"]);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("returns 401 when the user from the token no longer exists", async () => {
    const unique = Date.now();

    const payload = {
      username: `deleted_${unique}`,
      email: `deleted_${unique}@example.com`,
      password: "Password123",
      fullName: {
        firstName: "Deleted",
        lastName: "User",
      },
    };

    await request(app).post("/auth/register").send(payload);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: payload.email,
        password: payload.password,
      });

    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers["set-cookie"];

    await User.deleteOne({
      email: payload.email,
    });

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", cookies);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("returns 401 when the token cookie is empty", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", ["token="]);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });
});