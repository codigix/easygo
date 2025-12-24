/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("shipment_exceptions", (table) => {
    table.increments("id").primary();
    table.integer("shipment_id").unsigned().notNullable();
    table.integer("franchise_id").unsigned().notNullable();

    table.enum("exception_type", [
      "WEIGHT_MISMATCH",
      "RATE_MISMATCH",
      "DAMAGED_PARCEL",
      "LOST_PARCEL",
      "DUPLICATE_CN",
      "FRAUD_DETECTION",
    ]).notNullable();

    table.text("description");
    table.text("resolution_notes");

    table
      .enum("status", ["PENDING", "RESOLVED", "ESCALATED"])
      .defaultTo("PENDING");

    table.dateTime("resolved_at");
    table.timestamps(true, true);

    // Foreign Keys & Indexes
    table
      .foreign("shipment_id")
      .references("shipments.id")
      .onDelete("CASCADE");
    table
      .foreign("franchise_id")
      .references("franchises.id")
      .onDelete("CASCADE");

    table.index(["franchise_id", "status"]);
    table.index(["shipment_id", "status"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("shipment_exceptions");
};
