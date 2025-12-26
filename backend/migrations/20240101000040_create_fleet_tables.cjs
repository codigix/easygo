/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("fleet_vehicles", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.string("vehicle_number", 50).notNullable();
    table
      .enum("vehicle_type", ["BIKE", "VAN", "TRUCK", "TEMPO", "LTL"])
      .defaultTo("TRUCK");
    table.decimal("capacity_kg", 10, 2).defaultTo(0);
    table.decimal("volume_cuft", 10, 2).defaultTo(0);
    table.enum("fuel_type", ["DIESEL", "PETROL", "EV", "CNG"]).defaultTo("DIESEL");
    table.string("gps_device_id", 100);
    table
      .enum("status", ["AVAILABLE", "IN_TRANSIT", "MAINTENANCE", "INACTIVE"])
      .defaultTo("AVAILABLE");
    table.string("current_hub", 100);
    table.decimal("last_lat", 10, 7);
    table.decimal("last_lng", 10, 7);
    table.dateTime("last_ping_at");
    table.timestamps(true, true);

    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");
    table.unique(["franchise_id", "vehicle_number"], "uq_vehicle_number_franchise");
    table.index(["franchise_id", "status"], "idx_vehicle_status");
  });

  await knex.schema.createTable("fleet_drivers", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.string("driver_code", 50);
    table.string("name", 150).notNullable();
    table.string("phone", 30).notNullable();
    table.string("license_number", 100).notNullable();
    table.date("license_expiry").notNullable();
    table.integer("assigned_vehicle_id").unsigned();
    table.string("current_hub", 100);
    table
      .enum("status", ["AVAILABLE", "ON_ROUTE", "INACTIVE"])
      .defaultTo("AVAILABLE");
    table.timestamps(true, true);

    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");
    table
      .foreign("assigned_vehicle_id")
      .references("fleet_vehicles.id")
      .onDelete("SET NULL");
    table.unique(["franchise_id", "phone"], "uq_driver_phone_franchise");
    table.index(["franchise_id", "status"], "idx_driver_status");
  });

  await knex.schema.createTable("fleet_routes", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.string("route_code", 50).notNullable();
    table.string("origin_hub", 100).notNullable();
    table.string("destination_hub", 100).notNullable();
    table.json("via_hubs");
    table.decimal("distance_km", 10, 2).defaultTo(0);
    table.integer("expected_time_hours").defaultTo(0);
    table.text("encoded_polyline");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);

    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");
    table.unique(["franchise_id", "route_code"], "uq_route_code_franchise");
    table.index(["franchise_id", "is_active"], "idx_route_active");
  });

  await knex.schema.createTable("load_plans", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.string("load_number", 60).notNullable().unique();
    table.integer("route_id").unsigned().notNullable();
    table.integer("vehicle_id").unsigned().notNullable();
    table.integer("driver_id").unsigned().notNullable();
    table
      .enum("status", ["PLANNED", "DISPATCHED", "COMPLETED", "CANCELLED"])
      .defaultTo("PLANNED");
    table.integer("total_shipments").defaultTo(0);
    table.decimal("total_weight", 10, 2).defaultTo(0);
    table.decimal("total_volume", 10, 2).defaultTo(0);
    table.decimal("utilization_percent", 5, 2).defaultTo(0);
    table.dateTime("scheduled_at");
    table.dateTime("dispatched_at");
    table.dateTime("completed_at");
    table.dateTime("eta");
    table.decimal("current_lat", 10, 7);
    table.decimal("current_lng", 10, 7);
    table.dateTime("last_telemetry_at");
    table.string("current_leg", 150);
    table.text("notes");
    table.timestamps(true, true);

    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");
    table.foreign("route_id").references("fleet_routes.id").onDelete("RESTRICT");
    table.foreign("vehicle_id").references("fleet_vehicles.id").onDelete("RESTRICT");
    table.foreign("driver_id").references("fleet_drivers.id").onDelete("RESTRICT");
    table.index(["franchise_id", "status"], "idx_load_plan_status");
    table.index(["vehicle_id", "status"], "idx_load_vehicle_status");
  });

  await knex.schema.createTable("load_plan_shipments", (table) => {
    table.increments("id").primary();
    table.integer("load_plan_id").unsigned().notNullable();
    table.integer("shipment_id").unsigned().notNullable();
    table.decimal("weight", 10, 2).defaultTo(0);
    table
      .enum("status", ["ADDED", "REMOVED"])
      .defaultTo("ADDED");
    table.timestamps(true, true);

    table
      .foreign("load_plan_id")
      .references("load_plans.id")
      .onDelete("CASCADE");
    table.foreign("shipment_id").references("shipments.id").onDelete("CASCADE");
    table.unique(["load_plan_id", "shipment_id"], "uq_load_plan_shipment");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("load_plan_shipments");
  await knex.schema.dropTableIfExists("load_plans");
  await knex.schema.dropTableIfExists("fleet_routes");
  await knex.schema.dropTableIfExists("fleet_drivers");
  await knex.schema.dropTableIfExists("fleet_vehicles");
};
