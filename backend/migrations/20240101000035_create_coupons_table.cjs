exports.up = function (knex) {
  return knex.schema
    .createTable("coupons", (table) => {
      table.increments("id").primary();
      table.integer("franchise_id").unsigned().notNullable();
      table.string("code", 50).notNullable();
      table.string("title", 120).notNullable();
      table.text("description");
      table.enum("discount_type", ["FLAT", "PERCENT", "BONUS"]).notNullable();
      table.decimal("value", 10, 2).notNullable();
      table.decimal("max_discount", 10, 2).notNullable().defaultTo(0);
      table.decimal("min_order_value", 10, 2).notNullable().defaultTo(0);
      table.integer("usage_limit").unsigned();
      table.integer("per_user_limit").unsigned();
      table.enum("applicable_on", ["SHIPMENT", "RECHARGE", "BOTH"]).notNullable().defaultTo("SHIPMENT");
      table.enum("status", ["ACTIVE", "INACTIVE", "EXPIRED", "SCHEDULED"]).notNullable().defaultTo("ACTIVE");
      table.dateTime("valid_from");
      table.dateTime("valid_to");
      table.text("metadata");
      table.timestamps(true, true);
      table
        .foreign("franchise_id")
        .references("franchises.id")
        .onDelete("CASCADE");
      table.unique(["franchise_id", "code"]);
      table.index(["status", "valid_to"]);
    })
    .then(() =>
      knex.schema.createTable("coupon_usage", (table) => {
        table.increments("id").primary();
        table.integer("coupon_id").unsigned().notNullable();
        table.integer("franchise_id").unsigned().notNullable();
        table.string("customer_id", 50).notNullable();
        table.integer("shipment_id").unsigned();
        table.integer("recharge_id").unsigned();
        table.enum("context", ["SHIPMENT", "RECHARGE"]).notNullable();
        table.decimal("discount_amount", 10, 2).notNullable().defaultTo(0);
        table.dateTime("used_at").notNullable().defaultTo(knex.fn.now());
        table
          .foreign("coupon_id")
          .references("coupons.id")
          .onDelete("CASCADE");
        table
          .foreign("franchise_id")
          .references("franchises.id")
          .onDelete("CASCADE");
        table
          .foreign("shipment_id")
          .references("shipments.id")
          .onDelete("SET NULL");
        table
          .foreign("recharge_id")
          .references("wallet_recharges.id")
          .onDelete("SET NULL");
        table.index(["coupon_id", "customer_id"]);
        table.index(["context", "used_at"]);
      })
    );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("coupon_usage")
    .then(() => knex.schema.dropTableIfExists("coupons"));
};
