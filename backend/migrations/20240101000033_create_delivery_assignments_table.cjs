/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("delivery_assignments", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.integer("shipment_id").unsigned().notNullable();
    table.integer("delivery_executive_id").unsigned();
    table.string("delivery_executive_name", 150).notNullable();
    table.string("delivery_executive_phone", 30);
    table.string("vehicle_number", 50);
    table.integer("hub_id").unsigned();
    table.string("route_code", 50);
    table.string("route_name", 100);
    table
      .enum("status", [
        "ASSIGNED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "RTO",
      ])
      .defaultTo("ASSIGNED");
    table.boolean("is_active").defaultTo(true);
    table.integer("assigned_by").unsigned();
    table.dateTime("assigned_at").defaultTo(knex.fn.now());
    table.dateTime("started_at");
    table.dateTime("delivered_at");
    table.dateTime("failed_at");
    table.string("failure_reason", 100);
    table.text("failure_notes");
    table.string("pod_recipient_name", 150);
    table.string("pod_recipient_phone", 30);
    table.text("pod_notes");
    table.string("pod_signature_url", 255);
    table.string("pod_photo_url", 255);
    table.decimal("gps_lat", 10, 7);
    table.decimal("gps_lng", 10, 7);
    table.dateTime("gps_updated_at");
    table.timestamps(true, true);

    table
      .foreign("franchise_id")
      .references("franchises.id")
      .onDelete("CASCADE");
    table
      .foreign("shipment_id")
      .references("shipments.id")
      .onDelete("CASCADE");
    table
      .foreign("delivery_executive_id")
      .references("users.id")
      .onDelete("SET NULL");
    table.foreign("assigned_by").references("users.id").onDelete("SET NULL");

    table.index(["franchise_id", "status"]);
    table.index(["shipment_id", "is_active"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("delivery_assignments");
};
