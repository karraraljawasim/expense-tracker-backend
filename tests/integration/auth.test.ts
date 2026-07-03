import { it, describe, expect } from "vitest";
import request from "supertest";
import { app } from "../helpers/testApp.js";
import { jwtUtils } from "../../src/utils/jwt.js";

describe("Test refresh functionality", () => {
  const refreshEndpoint = "/api/auth/refresh";

  it("Should return access token", async () => {
    const resRegister = await request(app)
      .post("/api/auth/register")
      .send({
        name: "test",
        email: "test@exmpile.com",
        password: "password123",
        role: "admin",
      })
      .expect(201);

    const cookies = Array.isArray(resRegister.header["set-cookie"])
      ? resRegister.header["set-cookie"]
      : [];
    const refreshTokenCookies = cookies.find((cookie: string) =>
      cookie.startsWith("refreshToken="),
    );
    expect(refreshTokenCookies).toBeDefined();
    const refreshToken = refreshTokenCookies
      ?.split(";")[0]
      .split("=")[1] as string;
    expect(refreshToken).toBeDefined();

    const res = await request(app)
      .post(refreshEndpoint)
      .send({ refreshToken: refreshToken });
    expect(res.status).toBe(200);
    expect(res.body?.data?.accessToken).toBeDefined();
  });
});

describe("Test registration functionality", () => {
  const registerEndpoint = "/api/auth/register";
  const registerPayload = {
    name: "test",
    email: "test@exmpile.com",
    password: "password123",
    role: "admin",
  };

  it("Should return refresh and access tokens", async () => {
    const res = await request(app).post(registerEndpoint).send(registerPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("Disallows duplicated email", async () => {
    await request(app).post(registerEndpoint).send(registerPayload).expect(201);

    await request(app).post(registerEndpoint).send(registerPayload).expect(409);
  });

  it("Should set refresh token in cookies on successful registration", async () => {
    const res = await request(app)
      .post(registerEndpoint)
      .send(registerPayload)
      .expect(201);

    expect(res.header["set-cookie"]).toBeDefined();
    const cookies = Array.isArray(res.header["set-cookie"])
      ? res.header["set-cookie"]
      : [];
    expect(
      cookies.some((cookie: string) => cookie.startsWith("refreshToken=")),
    ).toBe(true);
  });

  it("Should generate tokens with correct payload", async () => {
    const res = await request(app)
      .post(registerEndpoint)
      .send(registerPayload)
      .expect(201);

    const cookies = Array.isArray(res.header["set-cookie"])
      ? res.header["set-cookie"]
      : [];
    const refreshTokenCookies = cookies.find((cookie: string) =>
      cookie.startsWith("refreshToken="),
    ) as string;

    const accessToken = res.body.data.accessToken;

    expect(refreshTokenCookies).toBeDefined();
    expect(accessToken).toBeDefined();

    const refreshToken = refreshTokenCookies?.split(";")[0]?.split("=")[1];

    const verifyRefreshToken = jwtUtils.verifyRefreshToken(refreshToken!);
    const verifyAccessToken = jwtUtils.verifyAccessToken(accessToken);

    expect(verifyAccessToken.sub).toBeDefined();
    expect(verifyAccessToken.type).toBe("access");
    expect(verifyAccessToken.sub.role).toBe("admin");

    expect(verifyRefreshToken.sub).toBeDefined();
    expect(verifyRefreshToken.type).toBe("refresh");
    expect(verifyRefreshToken.sub.role).toBe("admin");
  });
});

describe("Test login functionality", () => {
  const loginEndpoint = "/api/auth/login";
  const loginPayload = {
    email: "test@exmpile.com",
    password: "password123",
  };

  it("Should return (refresh, access) token on successful login", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "test",
        email: "test@exmpile.com",
        password: "password123",
        role: "admin",
      })
      .expect(201);

    const res = await request(app).post(loginEndpoint).send(loginPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("Should set refresh token in cookies on successful login", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "test",
        email: "test@exmpile.com",
        password: "password123",
        role: "admin",
      })
      .expect(201);

    const res = await request(app)
      .post(loginEndpoint)
      .send(loginPayload)
      .expect(200);

    const cookies = Array.isArray(res.header["set-cookie"])
      ? res.header["set-cookie"]
      : [];
    const refreshTokenCookies = cookies.find((cookie: string) =>
      cookie.startsWith("refreshToken="),
    );
    const refreshToken = refreshTokenCookies?.split(";")[0]?.split("=")[1];

    expect(refreshToken).toBeDefined();
  });

  it("Should generate tokens with correct payload on successful login", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "test",
        email: "test@exmpile.com",
        password: "password123",
        role: "admin",
      })
      .expect(201);

    const res = await request(app)
      .post(loginEndpoint)
      .send(loginPayload)
      .expect(200);

    const cookies = Array.isArray(res.header["set-cookie"])
      ? res.header["set-cookie"]
      : [];
    const refreshTokenCookies = cookies.find((cookie: string) =>
      cookie.startsWith("refreshToken="),
    );

    expect(refreshTokenCookies).toBeDefined();
    const refreshToken = refreshTokenCookies?.split(";")[0].split("=")[1];
    expect(refreshToken).toBeDefined();

    const accessToken = res.body.data.accessToken;
    expect(accessToken).toBeDefined();

    const verifyRefreshToken = jwtUtils.verifyRefreshToken(refreshToken);
    const verifyAccessToken = jwtUtils.verifyAccessToken(accessToken);

    expect(verifyAccessToken.sub).toBeDefined();
    expect(verifyAccessToken.type).toBe("access");
    expect(verifyAccessToken.sub.role).toBe("admin");

    expect(verifyRefreshToken.sub).toBeDefined();
    expect(verifyRefreshToken.type).toBe("refresh");
    expect(verifyRefreshToken.sub.role).toBe("admin");
  });
});
