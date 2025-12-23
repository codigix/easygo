/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("pickup_requests", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.string("pickup_request_id", 50).notNullable().unique();
    table.date("pickup_date").notNullable();
    table.string("time_slot", 50).notNullable(); // Morning, Afternoon, Evening
    table.string("pickup_type", 50).notNullable(); // Door Pickup, Walk-in
    table.string("priority", 50).defaultTo("Normal"); // Normal, Express

    // Sender Details
    table.string("customer_name", 255).notNullable();
    table.string("mobile_number", 20).notNullable();
    table.string("email", 100);
    table.string("company_name", 255);

    // Pickup Address
    table.text("address_line").notNullable();
    table.string("city", 100).notNullable();
    table.string("pincode", 10).notNullable();
    table.string("zone", 100); // Auto/Manual zone assignment

    // Shipment Summary
    table.integer("no_of_parcels").notNullable();
    table.decimal("approx_weight", 10, 2);
    table.string("service_type", 50); // DOX, NON-DOX
    table.string("payment_mode", 50); // Prepaid, COD

    // Special Instructions
    table.text("special_instructions");
    table.boolean("is_fragile").defaultTo(false);

    // Status
    table
      .enum("status", [
        "REQUESTED",
        "SCHEDULED",
        "ASSIGNED",
        "PICKED_UP",
        "FAILED",
      ])
      .defaultTo("REQUESTED");

    // Assignment Details
    table.string("driver_name", 255);
    table.string("vehicle_no", 50);
    table.string("route_area", 100);
    table.time("expected_pickup_time");

    // Tracking
    table.text("failure_reason");
    table.text("remarks");
    table.dateTime("last_updated");

    table.timestamps(true, true);

    table
      .foreign("franchise_id")
      .references("franchises.id")
      .onDelete("CASCADE");
    table.index(["franchise_id", "pickup_date"]);
    table.index("pickup_request_id");
    table.index("status");
    table.index("customer_name");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("pickup_requests");
};
