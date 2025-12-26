exports.up = function (knex) {
  return knex.schema
    .alterTable("shipments", (table) => {
      table.decimal("wallet_refund_amount", 10, 2).notNullable().defaultTo(0).after("wallet_debit");
      table.integer("wallet_refund_transaction_id").unsigned().after("wallet_transaction_id");
      table.dateTime("wallet_refund_processed_at").after("wallet_refund_transaction_id");
    })
    .then(() =>
      knex.schema.alterTable("shipments", (table) => {
        table
          .foreign("wallet_refund_transaction_id")
          .references("wallet_transactions.id")
          .onDelete("SET NULL");
      })
    )
    .then(() =>
      knex.schema.createTable("rto_manifest_shipments", (table) => {
        table.increments("id").primary();
        table.integer("rto_manifest_id").unsigned().notNullable();
        table.integer("shipment_id").unsigned().notNullable();
        table.decimal("refund_amount", 10, 2).notNullable().defaultTo(0);
        table.decimal("wallet_debit_snapshot", 10, 2).notNullable().defaultTo(0);
        table
          .enum("status", ["PENDING", "REFUNDED", "SKIPPED"])
          .notNullable()
          .defaultTo("PENDING");
        table.integer("refund_wallet_transaction_id").unsigned();
        table.timestamps(true, true);
        table
          .foreign("rto_manifest_id")
          .references("rto_manifests.id")
          .onDelete("CASCADE");
        table
          .foreign("shipment_id")
          .references("shipments.id")
          .onDelete("CASCADE");
        table
          .foreign("refund_wallet_transaction_id")
          .references("wallet_transactions.id")
          .onDelete("SET NULL");
        table.unique(["rto_manifest_id", "shipment_id"]);
        table.index(["status"]);
      })
    );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("rto_manifest_shipments")
    .then(() =>
      knex.schema.alterTable("shipments", (table) => {
        table.dropForeign(["wallet_refund_transaction_id"]);
      })
    )
    .then(() =>
      knex.schema.alterTable("shipments", (table) => {
        table.dropColumn("wallet_refund_processed_at");
        table.dropColumn("wallet_refund_transaction_id");
        table.dropColumn("wallet_refund_amount");
      })
    );
};
