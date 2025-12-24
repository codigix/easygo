/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("shipments", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.string("shipment_cn", 50).notNullable().unique();
    table.integer("pickup_id").unsigned();

    table.enum("shipment_source", ["PICKUP", "WALKIN", "BULK", "MANUAL"]).defaultTo("MANUAL");

    // Sender Details
    table.string("sender_name", 255).notNullable();
    table.string("sender_phone", 20).notNullable();
    table.text("sender_address").notNullable();
    table.string("sender_pincode", 10).notNullable();
    table.string("sender_city", 100);
    table.string("sender_state", 100);

    // Receiver Details
    table.string("receiver_name", 255).notNullable();
    table.string("receiver_phone", 20).notNullable();
    table.text("receiver_address").notNullable();
    table.string("receiver_pincode", 10).notNullable();
    table.string("receiver_city", 100);
    table.string("receiver_state", 100);

    // Package Details
    table.decimal("weight", 10, 2).notNullable();
    table.string("dimensions", 50);
    table.integer("pieces").defaultTo(1);
    table.text("content_description");
    table.decimal("declared_value", 10, 2).defaultTo(0);

    // Service & Rates
    table.string("service_type", 50).notNullable(); // EXPRESS, STANDARD, etc.
    table.decimal("freight_charge", 10, 2);
    table.decimal("fuel_surcharge", 10, 2).defaultTo(0);
    table.decimal("gst_amount", 10, 2).defaultTo(0);
    table.decimal("other_charges", 10, 2).defaultTo(0);
    table.decimal("total_charge", 10, 2);

    // Status
    table
      .enum("status", [
        "CREATED",
        "MANIFESTED",
        "HUB_IN_SCAN",
        "HUB_OUT_SCAN",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "RTO",
        "EXCEPTION",
      ])
      .defaultTo("CREATED");

    // Exception Handling
    table.string("exception_type", 50);
    table.text("exception_notes");

    // Timestamps
    table.dateTime("manifested_at");
    table.dateTime("delivered_at");
    table.timestamps(true, true);

    // Foreign Keys & Indexes
    table
      .foreign("franchise_id")
      .references("franchises.id")
      .onDelete("CASCADE");
    table
      .foreign("pickup_id")
      .references("pickup_requests.id")
      .onDelete("SET NULL");

    table.index(["franchise_id", "created_at"]);
    table.index("shipment_cn");
    table.index("status");
    table.index(["receiver_pincode", "status"]);
    table.index("shipment_source");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("shipments");
};
