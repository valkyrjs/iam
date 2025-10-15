import { createUser } from "@modules/auth";
import { createPrincipal, PrincipalType } from "@modules/principal";
import { createTenant } from "@modules/tenant";
import { getEnvironmentVariable } from "@platform/config";
import type { MigrateOperation, TransactionSql } from "@platform/database";
import z from "zod";

export default {
  idx: 0,
  timestamp: 1759160813,
  async up(tx) {
    await createTenantTable(tx);
    await createUserTable(tx);
    await createAccountTable(tx);
    await createSessionTable(tx);
    await createVerificationTable(tx);
    await createPrincipalTable(tx);
    await createSuperPrincipal(tx);
  },
  async down(tx) {
    await tx`DROP TABLE IF EXISTS "tenant" CASCADE`;
    await tx`DROP TABLE IF EXISTS "user" CASCADE`;
    await tx`DROP TABLE IF EXISTS "strategy" CASCADE`;
    await tx`DROP TABLE IF EXISTS "account" CASCADE`;
    await tx`DROP TABLE IF EXISTS "session" CASCADE`;
    await tx`DROP TABLE IF EXISTS "verification" CASCADE`;
    await tx`DROP TABLE IF EXISTS "principal" CASCADE`;
  },
} satisfies MigrateOperation;

/*
 |--------------------------------------------------------------------------------
 | Tables
 |--------------------------------------------------------------------------------
 */

async function createTenantTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS "tenant" (
      id          TEXT NOT NULL PRIMARY KEY,
      name        TEXT NOT NULL,
      slug        TEXT NOT NULL,
      meta        JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;
}

async function createUserTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS "user" (
      id              TEXT NOT NULL PRIMARY KEY,
      "tenantId"      TEXT NOT NULL REFERENCES "tenant"(id) ON DELETE CASCADE,
      name            JSONB NOT NULL,
      email           TEXT NOT NULL,
      "emailVerified" BOOLEAN NOT NULL,
      image           TEXT,
      "createdAt"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_user_tenantId ON "user"("tenantId")
  `;
}

async function createAccountTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS "account" (
      id                      TEXT NOT NULL PRIMARY KEY,
      "userId"                TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accountId"             TEXT NOT NULL,
      "providerId"            TEXT NOT NULL,
      "accessToken"           TEXT,
      "refreshToken"          TEXT,
      "scope"                 TEXT,
      "idToken"               TEXT,
      password                TEXT,
      "accessTokenExpiresAt"  TIMESTAMPTZ,
      "refreshTokenExpiresAt" TIMESTAMPTZ,
      "createdAt"             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt"             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_account_userId ON "account"("userId")
  `;
}

async function createSessionTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS "session" (
      id          TEXT NOT NULL PRIMARY KEY,
      "tenantId"  TEXT NOT NULL REFERENCES "tenant"(id) ON DELETE CASCADE,
      "userId"    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      token       TEXT NOT NULL UNIQUE,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL
    )
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_session_tenantId ON "session"("tenantId")
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_session_userId ON "session"("userId")
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_session_token ON "session"("token")
  `;
}

async function createVerificationTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS "verification" (
      id          TEXT NOT NULL PRIMARY KEY,
      identifier  TEXT NOT NULL,
      value       TEXT NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;
}

async function createPrincipalTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS "principal" (
      id    TEXT PRIMARY KEY,
      type  INTEGER NOT NULL,
      roles JSONB NOT NULL DEFAULT '[]',
      attr  JSONB NOT NULL DEFAULT '{}',
      meta  JSONB NOT NULL DEFAULT '{}'
    )
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_principal_type ON "principal" (type)
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_principal_roles ON "principal" USING GIN (roles)
  `;
}

/*
 |--------------------------------------------------------------------------------
 | Seeds
 |--------------------------------------------------------------------------------
 */

async function createSuperPrincipal(tx: TransactionSql): Promise<void> {
  const tenant = await createTenant(
    {
      name: "Super",
      slug: "super",
    },
    { tx },
  );
  const user = await createUser(
    {
      tenantId: tenant.id,
      name: {
        given: "John",
        family: "Doe",
      },
      email: getEnvironmentVariable({
        key: "IAM_SUPER_EMAIL",
        type: z.email(),
        fallback: "john.doe@fixture.none",
      }),
    },
    { tx },
  );
  await createPrincipal(
    {
      id: user.id,
      type: PrincipalType.User,
      roles: ["super"],
      attr: {},
      meta: {},
    },
    { tx },
  );
}
