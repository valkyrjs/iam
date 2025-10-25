import { logger } from "@platform/logger";
import { exists } from "@std/fs";
import type { Sql, TransactionSql } from "postgres";

/**
 * Creates a migration runner function that applies pending migrations.
 *
 * Each migration is executed in a separate transaction to ensure atomicity.
 * Only migrations that have not already been applied (tracked in the migrations table)
 * will be executed. After successful execution, the migration ID is recorded.
 *
 * @example
 * ```ts
 * import { client, makeMigration } from "@platform/database";
 *
 * const migrations = [
 *   {
 *     idx: 0,
 *     timestamp: 1758889035,
 *     async up(tx) {
 *       await tx`CREATE TABLE IF NOT EXISTS auth.principal (
 *         id TEXT PRIMARY KEY,
 *         type JSONB NOT NULL,
 *         roles JSONB NOT NULL,
 *         attr JSONB NOT NULL
 *       )`;
 *     },
 *     async down(tx) {
 *       await tx`DROP TABLE IF EXISTS auth.principal`;
 *     }
 *   }
 * ];
 *
 * const migrate = makeMigration({ sql: client, schema: "auth" }, migrations);
 *
 * await migrate();
 * ```
 *
 * @param options        - Migration options
 * @param options.sql    - PostgresJS client instance
 * @param options.schema - Schema where the migrations table resides (default: "public")
 * @param options.table  - Table name to record applied migrations (default: "migration")
 * @param migrationsPath - Folder in which the individual migration files are located.
 *
 * @throws Will throw if any migration fails; pending migrations will not be executed.
 */
export function makeMigration(options: MigrateOptions, migrationsPath: string): () => Promise<void> {
  return async () => {
    const { sql, table = "migration" } = options;

    // ### Migration Table
    // Ensure migrations table exists

    await sql.begin(async (tx) => {
      // await tx`CREATE SCHEMA IF NOT EXISTS ${schema()}`;
      await tx`
        CREATE TABLE IF NOT EXISTS ${sql(table)} (
          idx        INT NOT NULL UNIQUE,                -- migration order
          name       TEXT NOT NULL UNIQUE,               -- migration filename
          created_at BIGINT NOT NULL,                    -- unix timestamp when migration was created
          run_at     TIMESTAMPTZ NOT NULL DEFAULT now(), -- time the migration was executed
          PRIMARY KEY (idx)
        );
      `;
    });

    // ### Migrations
    // Fetch migrations from the given migrations path.

    const migrations = await getMigrationOperations(migrationsPath);

    // ### Filter
    // Get already applied migrations

    const appliedRows = await sql<{ idx: number }[]>`SELECT idx FROM ${sql(table)}`;
    const applied = new Set(appliedRows.map((r) => r.idx));

    // ### Sort
    // Ensure migrations are running in the correct order.

    migrations.sort((a, b) => a.idx - b.idx);

    // ### Execute
    // Execute pending migrations.

    for (const migration of migrations) {
      if (applied.has(migration.idx)) {
        logger.info(`Skipping already applied migration: ${migration.name}`);
        continue;
      }

      logger.info(`Running migration: ${migration.name}`);

      try {
        await sql.begin(async (tx) => {
          await migration.up(tx);
          await tx`INSERT INTO ${sql(table)} (idx, name, created_at) VALUES (${migration.idx}, ${migration.name}, ${migration.timestamp})`;
        });
        logger.info(`Migration '${migration.name}' applied`);
      } catch (error) {
        logger.error(`Migration '${migration.name}' failed:`, {
          error,
        });
        throw error;
      }
    }
  };
}

/**
 * Rolls back previously applied migrations in reverse order.
 *
 * Each rollback is executed in a separate transaction to ensure atomicity.
 * Only migrations that have been applied (tracked in the migrations table)
 * will be rolled back. After successful rollback, the migration ID is removed
 * from the tracking table.
 *
 * @param options        - Migration options
 * @param options.sql    - PostgresJS client instance
 * @param options.schema - Schema where the migrations table resides (default: "public")
 * @param options.table  - Table name that tracks applied migrations (default: "migration")
 * @param migrationsPath - Folder in which the individual migration files are located.
 *
 * @throws Will throw if any rollback fails; remaining rollbacks will not be executed.
 */
export function makeRollback(options: MigrateOptions, toIdx: number, migrationsPath: string): () => Promise<void> {
  return async () => {
    const { sql, table = "migration" } = options;

    // ### Migrations
    // Fetch migrations from the given migrations path.

    const migrations = await getMigrationOperations(migrationsPath);

    // ### Filter
    // Get already applied migrations

    const appliedRows = await sql<{ idx: number }[]>`SELECT idx FROM ${sql(table)} WHERE idx >= ${toIdx}`;
    const appliedSet = new Set(appliedRows.map((r) => r.idx));

    // ### Sort
    // Ensure migrations are running in the correct order.

    migrations.sort((a, b) => b.idx - a.idx);

    // ### Execute
    // Execute pending migrations.

    for (const migration of migrations) {
      if (!appliedSet.has(migration.idx)) {
        logger.info(`Skipping migration not applied: ${migration.name}`);
        continue;
      }

      logger.info(`Rolling back migration: ${migration.name}`);

      try {
        await sql.begin(async (tx) => {
          await migration.down(tx);
          await tx`DELETE FROM ${sql(table)} WHERE idx = ${migration.idx}`;
        });
        logger.info(`Migration rolled back: ${migration.name}`);
      } catch (err) {
        logger.error(`Rollback failed: ${migration.name}`, err);
        throw err; // stop further rollbacks
      }
    }
  };
}

/*
 |--------------------------------------------------------------------------------
 | Utilities
 |--------------------------------------------------------------------------------
 */

async function getMigrationOperations(
  path: string,
  migrations: ResolveMigrationOperation[] = [],
): Promise<ResolveMigrationOperation[]> {
  for await (const entry of Deno.readDir(path)) {
    const migrationPath = `${path}/${entry.name}`;
    if (entry.isDirectory === true) {
      return getMigrationOperations(migrationPath, migrations);
    }
    if (await exists(migrationPath)) {
      const { default: migration } = (await import(migrationPath)) as { default: ResolveMigrationOperation };
      migrations.push({
        ...migration,
        name: entry.name,
      });
    }
  }
  return migrations;
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

/**
 * Options for database migrations.
 */
type MigrateOptions = {
  /**
   * PostgresJS client instance used to execute migrations.
   */
  sql: Sql;

  /**
   * Table used to record successfully applied migrations.
   * Default: "migration"
   */
  table?: string;
};

/**
 * Represents a single migration operation.
 */
export type MigrateOperation = {
  /**
   * Order the migration should execute in.
   * Migrations are applied in ascending order of `idx` and rolled back in descending order.
   */
  idx: number;

  /**
   * Timestamp for when the migration was created.
   */
  timestamp: number;

  /**
   * Migration function to apply changes.
   *
   * @param tx - Transaction object provided by PostgresJS
   */
  up: (tx: TransactionSql) => Promise<void>;

  /**
   * Migration rollback function to undo changes.
   *
   * @param tx - Transaction object provided by PostgresJS
   */
  down: (tx: TransactionSql) => Promise<void>;
};

type ResolveMigrationOperation = MigrateOperation & {
  name: string;
};
