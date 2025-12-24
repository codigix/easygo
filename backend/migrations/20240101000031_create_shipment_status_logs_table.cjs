/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("shipment_status_logs", (table) => {
    table.increments("id").primary();
    table.integer("shipment_id").unsigned().notNullable();
    table.integer("franchise_id").unsigned().notNullable();

    table.enum("from_status", [
      "CREATED",
      "MANIFESTED",
      "HUB_IN_SCAN",
      "HUB_OUT_SCAN",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "RTO",
      "EXCEPTION",
    ]).notNullable();

    table.enum("to_status", [
      "CREATED",
      "MANIFESTED",
      "HUB_IN_SCAN",
      "HUB_OUT_SCAN",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "RTO",
      "EXCEPTION",
    ]).notNullable();

    table.string("reason", 100);
    table.integer("updated_by").unsigned();
    table.string("location", 255);
    table.text("notes");

    table.timestamps(true, true);

    table.foreign("shipment_id").references("shipments.id").onDelete("CASCADE");
    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");
    table.foreign("updated_by").references("users.id").onDelete("SET NULL");

    table.index(["shipment_id", "created_at"]);
    table.index(["franchise_id", "created_at"]);
    table.index(["from_status", "to_status"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("shipment_status_logs");
};
