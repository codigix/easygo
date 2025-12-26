exports.up = function (knex) {
  return knex.schema.createTable("discount_rules", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.string("rule_name", 120).notNullable();
    table.enum("rule_type", ["VOLUME", "ROUTE", "CUSTOMER", "SLA", "TIER", "PROMO"]).notNullable();
    table.enum("applies_to", ["SHIPMENT", "RECHARGE"]).notNullable().defaultTo("SHIPMENT");
    table.enum("discount_type", ["FLAT", "PERCENT"]).notNullable();
    table.decimal("value", 10, 2).notNullable();
    table.decimal("max_discount", 10, 2).notNullable().defaultTo(0);
    table.integer("priority").notNullable().defaultTo(100);
    table.enum("status", ["ACTIVE", "INACTIVE"]).notNullable().defaultTo("ACTIVE");
    table.text("condition_json").notNullable();
    table.text("description");
    table.timestamps(true, true);
    table
      .foreign("franchise_id")
      .references("franchises.id")
      .onDelete("CASCADE");
    table.index(["franchise_id", "status", "priority"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("discount_rules");
};
