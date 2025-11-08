const knex = require("knex");
const config = require("./knexfile.cjs");

(async () => {
  try {
    const db = knex(config);

    console.log("🔄 Applying migrations 21 and 22...");

    // Migration 21: Create courier_company_rates table
    console.log("\n📦 Applying migration 21 (courier_company_rates table)...");
    try {
      const [existing21] = await db("knex_migrations").where(
        "name",
        "20240101000021_create_courier_company_rates_table.cjs"
      );

      if (!existing21) {
        await db.schema.createTable("courier_company_rates", (table) => {
          table.increments("id").primary();
          table.integer("franchise_id").unsigned().notNullable();
          table.integer("company_id").unsigned().notNullable();
          table.string("courier_type", 50).notNullable();
          table.string("row_name", 100).notNullable();
          table.string("sub_type", 50).nullable();
          table.enum("slab_type", ["Slab 2", "Slab 3", "Slab 4"]).notNullable();
          table.json("rates").notNullable();
          table.enum("status", ["active", "inactive"]).defaultTo("active");
          table.timestamps(true, true);

          table
            .foreign("franchise_id")
            .references("franchises.id")
            .onDelete("CASCADE");
          table
            .foreign("company_id")
            .references("company_rate_master.id")
            .onDelete("CASCADE");

          table.index(["franchise_id", "company_id", "courier_type"]);
          table.index(["courier_type", "row_name"]);
        });

        await db("knex_migrations").insert({
          name: "20240101000021_create_courier_company_rates_table.cjs",
          batch: 9,
          migration_time: new Date(),
        });
        console.log("✅ Migration 21 applied");
      } else {
        console.log("⚠️  Migration 21 already applied");
      }
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("⚠️  Migration 21 already applied (table exists)");
        const [existing] = await db("knex_migrations").where(
          "name",
          "20240101000021_create_courier_company_rates_table.cjs"
        );
        if (!existing) {
          await db("knex_migrations").insert({
            name: "20240101000021_create_courier_company_rates_table.cjs",
            batch: 9,
            migration_time: new Date(),
          });
        }
      } else {
        throw e;
      }
    }

    // Migration 22: Add columns to franchises
    console.log("\n📦 Applying migration 22 (franchises columns)...");
    try {
      const [existing22] = await db("knex_migrations").where(
        "name",
        "20240101000022_add_invoice_and_details_to_franchises.cjs"
      );

      if (!existing22) {
        await db.schema.alterTable("franchises", (table) => {
          table.string("invoice_prefix", 50);
          table.string("arn", 50);
          table.string("service_area", 100);
          table.string("account_name", 100);
        });

        await db("knex_migrations").insert({
          name: "20240101000022_add_invoice_and_details_to_franchises.cjs",
          batch: 9,
          migration_time: new Date(),
        });
        console.log("✅ Migration 22 applied");
      } else {
        console.log("⚠️  Migration 22 already applied");
      }
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("⚠️  Migration 22 already applied (columns exist)");
        const [existing] = await db("knex_migrations").where(
          "name",
          "20240101000022_add_invoice_and_details_to_franchises.cjs"
        );
        if (!existing) {
          await db("knex_migrations").insert({
            name: "20240101000022_add_invoice_and_details_to_franchises.cjs",
            batch: 9,
            migration_time: new Date(),
          });
        }
      } else {
        throw e;
      }
    }

    console.log("\n✅ All pending migrations processed!");
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
