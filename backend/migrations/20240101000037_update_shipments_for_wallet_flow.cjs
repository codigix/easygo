exports.up = function (knex) {
  return knex.schema
    .alterTable("shipments", (table) => {
      table.string("customer_id", 50).after("pickup_id");
      table.integer("discount_rule_id").unsigned().after("total_charge");
      table.decimal("discount_amount", 10, 2).notNullable().defaultTo(0).after("discount_rule_id");
      table.string("discount_source", 100).after("discount_amount");
      table.integer("coupon_id").unsigned().after("discount_source");
      table.string("coupon_code", 50).after("coupon_id");
      table.decimal("coupon_discount", 10, 2).notNullable().defaultTo(0).after("coupon_code");
      table.decimal("final_payable", 10, 2).notNullable().defaultTo(0).after("coupon_discount");
      table.decimal("wallet_debit", 10, 2).notNullable().defaultTo(0).after("final_payable");
      table.string("payment_source", 30).notNullable().defaultTo("INVOICE").after("wallet_debit");
      table.integer("wallet_transaction_id").unsigned().after("payment_source");
      table.text("pricing_breakup").after("wallet_transaction_id");
      table.index("customer_id");
      table.index("coupon_code");
    })
    .then(() =>
      knex.schema.alterTable("shipments", (table) => {
        table
          .foreign("discount_rule_id")
          .references("discount_rules.id")
          .onDelete("SET NULL");
        table
          .foreign("coupon_id")
          .references("coupons.id")
          .onDelete("SET NULL");
        table
          .foreign("wallet_transaction_id")
          .references("wallet_transactions.id")
          .onDelete("SET NULL");
      })
    );
};

exports.down = function (knex) {
  return knex.schema
    .alterTable("shipments", (table) => {
      table.dropForeign(["discount_rule_id"]);
      table.dropForeign(["coupon_id"]);
      table.dropForeign(["wallet_transaction_id"]);
      table.dropIndex(["customer_id"]);
      table.dropIndex(["coupon_code"]);
    })
    .then(() =>
      knex.schema.alterTable("shipments", (table) => {
        table.dropColumn("pricing_breakup");
        table.dropColumn("wallet_transaction_id");
        table.dropColumn("payment_source");
        table.dropColumn("wallet_debit");
        table.dropColumn("final_payable");
        table.dropColumn("coupon_discount");
        table.dropColumn("coupon_code");
        table.dropColumn("coupon_id");
        table.dropColumn("discount_source");
        table.dropColumn("discount_amount");
        table.dropColumn("discount_rule_id");
        table.dropColumn("customer_id");
      })
    );
};
