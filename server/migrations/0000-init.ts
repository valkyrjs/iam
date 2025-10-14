import { createPrincipal, PrincipalType } from "@modules/principal";
import { createUser } from "@modules/user";
import { getEnvironmentVariable } from "@platform/config";
import { type MigrateOperation, schema, type TransactionSql } from "@platform/database";
import z from "zod";

export default {
  idx: 0,
  timestamp: 1759160813,
  async up(tx) {
    await createUserTable(tx);
    await createAccountTable(tx);
    await createSessionTable(tx);
    await createVerificationTable(tx);
    await createPrincipalTable(tx);
    await createSuperPrincipal(tx);
  },
  async down(tx) {
    await tx`DROP TABLE IF EXISTS ${schema()}."user" CASCADE`;
    await tx`DROP TABLE IF EXISTS ${schema()}."strategy" CASCADE`;
    await tx`DROP TABLE IF EXISTS ${schema()}."account" CASCADE`;
    await tx`DROP TABLE IF EXISTS ${schema()}."session" CASCADE`;
    await tx`DROP TABLE IF EXISTS ${schema()}."verification" CASCADE`;
    await tx`DROP TABLE IF EXISTS ${schema()}."principal" CASCADE`;
  },
} satisfies MigrateOperation;

/*
 |--------------------------------------------------------------------------------
 | Tables
 |--------------------------------------------------------------------------------
 */

async function createUserTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS ${schema()}."user" (
      id              TEXT NOT NULL PRIMARY KEY,
      name            JSONB NOT NULL,
      email           TEXT NOT NULL,
      "emailVerified" BOOLEAN NOT NULL,
      contacts        JSONB NOT NULL DEFAULT '[]',
      meta            JSONB NOT NULL DEFAULT '{}',
      "createdAt"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_user_contacts_gin
    ON ${schema()}."user" USING GIN(contacts)
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_user_contacts_email
    ON ${schema()}."user" USING GIN(contacts jsonb_path_ops)
    WHERE contacts @? '$[*] ? (@.type == "email")'
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_user_contacts_phone
    ON ${schema()}."user" USING GIN(contacts jsonb_path_ops)
    WHERE contacts @? '$[*] ? (@.type == "phone")'
  `;
}

async function createAccountTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS ${schema()}."account" (
      id                      TEXT NOT NULL PRIMARY KEY,
      "userId"                TEXT NOT NULL REFERENCES ${schema()}."user"(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS idx_account_userId
    ON ${schema()}."account"("userId")
  `;
}

async function createSessionTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS ${schema()}."session" (
      id          TEXT NOT NULL PRIMARY KEY,
      "userId"    TEXT NOT NULL REFERENCES ${schema()}."user"(id) ON DELETE CASCADE,
      token       TEXT NOT NULL UNIQUE,
      meta        JSONB NOT NULL DEFAULT '{}',
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL
    )
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_session_userId
    ON ${schema()}."session"("userId")
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_session_token
    ON ${schema()}."session"("token")
  `;
}

async function createVerificationTable(tx: TransactionSql): Promise<void> {
  await tx`
    CREATE TABLE IF NOT EXISTS ${schema()}."verification" (
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
    CREATE TABLE IF NOT EXISTS ${schema()}."principal" (
      id    TEXT PRIMARY KEY,
      type  INTEGER NOT NULL,
      roles JSONB NOT NULL DEFAULT '[]',
      attr  JSONB NOT NULL DEFAULT '{}',
      meta  JSONB NOT NULL DEFAULT '{}'
    )
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_principal_type
    ON ${schema()}."principal" (type)
  `;
  await tx`
    CREATE INDEX IF NOT EXISTS idx_principal_roles
    ON ${schema()}."principal" USING GIN (roles)
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
