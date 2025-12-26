exports.up = function (knex) {
  return knex.schema
    .createTable("wallets", (table) => {
      table.increments("id").primary();
      table.integer("franchise_id").unsigned().notNullable();
      table.string("customer_id", 50).notNullable();
      table.decimal("balance", 12, 2).notNullable().defaultTo(0);
      table.decimal("credit_limit", 12, 2).notNullable().defaultTo(0);
      table.boolean("allow_negative").notNullable().defaultTo(false);
      table.enum("status", ["active", "blocked"]).notNullable().defaultTo("active");
      table.timestamp("last_recharged_at");
      table.timestamps(true, true);
      table
        .foreign("franchise_id")
        .references("franchises.id")
        .onDelete("CASCADE");
      table.unique(["franchise_id", "customer_id"]);
    })
    .then(() =>
      knex.schema.createTable("wallet_transactions", (table) => {
        table.increments("id").primary();
        table.integer("wallet_id").unsigned().notNullable();
        table.integer("franchise_id").unsigned().notNullable();
        table.string("customer_id", 50).notNullable();
        table.enum("type", ["CREDIT", "DEBIT"]).notNullable();
        table.string("source", 50).notNullable();
        table.string("reference_id", 100);
        table.decimal("amount", 12, 2).notNullable();
        table.decimal("opening_balance", 12, 2).notNullable();
        table.decimal("closing_balance", 12, 2).notNullable();
        table.text("metadata");
        table.timestamps(true, true);
        table
          .foreign("wallet_id")
          .references("wallets.id")
          .onDelete("CASCADE");
        table
          .foreign("franchise_id")
          .references("franchises.id")
          .onDelete("CASCADE");
        table.index(["franchise_id", "customer_id"]);
        table.index(["reference_id", "source"]);
      })
    )
    .then(() =>
      knex.schema.createTable("wallet_recharges", (table) => {
        table.increments("id").primary();
        table.integer("wallet_id").unsigned().notNullable();
        table.integer("franchise_id").unsigned().notNullable();
        table.string("customer_id", 50).notNullable();
        table.string("payment_id", 100);
        table.decimal("amount", 12, 2).notNullable();
        table.decimal("gst_amount", 12, 2).notNullable().defaultTo(0);
        table.decimal("net_amount", 12, 2).notNullable();
        table.decimal("tax_percent", 5, 2).notNullable().defaultTo(18);
        table
          .enum("status", ["PENDING", "SUCCESS", "FAILED"])
          .notNullable()
          .defaultTo("PENDING");
        table.string("payment_method", 30);
        table.string("gateway", 50);
        table.string("order_reference", 100).notNullable();
        table.integer("wallet_transaction_id").unsigned();
        table.text("payload");
        table.timestamps(true, true);
        table
          .foreign("wallet_id")
          .references("wallets.id")
          .onDelete("CASCADE");
        table
          .foreign("franchise_id")
          .references("franchises.id")
          .onDelete("CASCADE");
        table
          .foreign("wallet_transaction_id")
          .references("wallet_transactions.id")
          .onDelete("SET NULL");
        table.unique(["order_reference"]);
        table.index(["payment_id"]);
      })
    );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("wallet_recharges")
    .then(() => knex.schema.dropTableIfExists("wallet_transactions"))
    .then(() => knex.schema.dropTableIfExists("wallets"));
};
