import { createUser } from "@modules/auth";
import { createTenant, createTenantPrincipal } from "@modules/tenant";
import { getEnvironmentVariable } from "@platform/config";
import type { MigrateOperation, TransactionSql } from "@platform/database";
import z from "zod";

export default {
  idx: 0,
  timestamp: 1759160813,
  async up(tx) {
    await createUserTable(tx);

    await createTenantTable(tx);
    await createTenantPrincipalTable(tx);

    await createAccountTable(tx);
    await createVerificationTable(tx);
    await createSessionTable(tx);

    await createSuperPrincipal(tx);
  },
  async down(tx) {
    await tx`DROP TABLE IF EXISTS "user" CASCADE`;
    await tx`DROP TABLE IF EXISTS "tenant" CASCADE`;
    await tx`DROP TABLE IF EXISTS "tenant_principal" CASCADE`;
    await tx`DROP TABLE IF EXISTS "account" CASCADE`;
    await tx`DROP TABLE IF EXISTS "verification" CASCADE`;
    await tx`DROP TABLE IF EXISTS "session" CASCADE`;
  },
} satisfies MigrateOperation;

/*
 |--------------------------------------------------------------------------------
 | Tables
 |--------------------------------------------------------------------------------
 */

async function createUserTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS "user" (
      id              TEXT NOT NULL PRIMARY KEY,
      name            TEXT NOT NULL DEFAULT '',
      email           TEXT NOT NULL,
      "emailVerified" BOOLEAN NOT NULL,
      image           TEXT,
      "createdAt"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      UNIQUE (email)
    )
  `;
}

async function createTenantTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS "tenant" (
      id          TEXT NOT NULL PRIMARY KEY,
      name        TEXT NOT NULL,
      slug        TEXT NOT NULL,
      meta        JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      UNIQUE (slug)
    )
  `;
}

async function createTenantPrincipalTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS "tenant_principal" (
      id          TEXT PRIMARY KEY,
      "tenantId"  TEXT NOT NULL REFERENCES "tenant"(id) ON DELETE CASCADE,
      "userId"    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      name        JSONB NOT NULL,
      roles       JSONB NOT NULL DEFAULT '[]',
      attr        JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      UNIQUE ("tenantId", "userId")
    )
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_tenant_principal_tenantId ON "tenant_principal" ("tenantId")
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_tenant_principal_roles ON "tenant_principal" USING GIN (roles)
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
      "updatedAt"             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      UNIQUE ("providerId", "accountId")
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
    CREATE INDEX IF NOT EXISTS idx_session_user_tenant ON "session" ("userId", "tenantId");
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_session_tenantId ON "session" ("tenantId")
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_session_userId ON "session" ("userId")
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_session_token ON "session" ("token")
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
  await tx`
    CREATE INDEX IF NOT EXISTS idx_verification_identifier_value ON "verification" (identifier, value);
  `;
}

/*
 |--------------------------------------------------------------------------------
 | Seeds
 |--------------------------------------------------------------------------------
 */

async function createSuperPrincipal(tx: TransactionSql): Promise<void> {
  const user = await createUser(
    {
      email: getEnvironmentVariable({
        key: "IAM_SUPER_EMAIL",
        type: z.email(),
        fallback: "john.doe@fixture.none",
      }),
    },
    { tx },
  );
  await createTenantPrincipal(
    {
      tenantId: (
        await createTenant(
          {
            name: "Super",
            slug: "super",
          },
          { tx },
        )
      ).id,
      userId: user.id,
      name: {
        given: "John",
        family: "Doe",
      },
      roles: ["super"],
      attr: {},
    },
    { tx },
  );
}
