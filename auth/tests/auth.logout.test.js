const request = require("supertest");
const app = require("../src/app");

require("./setup");

describe("GET /auth/logout", () => {
  it("logs out an authenticated user successfully", async () => {
    const unique = Date.now();

    const payload = {
      username: `logoutuser_${unique}`,
      email: `logout_${unique}@example.com`,
      password: "Password123",
      fullName: {
        firstName: "Logout",
        lastName: "User",
      },
    };

    // Register
    await request(app)
      .post("/auth/register")
      .send(payload);

    // Login
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: payload.email,
        password: payload.password,
      });

    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers["set-cookie"];

    // Logout
    const res = await request(app)
      .get("/auth/logout")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Logout successful");

    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toContain("token=");
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app)
      .get("/auth/logout");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Unauthorized");
  });

  it("returns 401 when an invalid token is provided", async () => {
    const res = await request(app)
      .get("/auth/logout")
      .set("Cookie", ["token=invalid.jwt.token"]);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Unauthorized");
  });
});