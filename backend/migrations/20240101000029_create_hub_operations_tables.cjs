/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Create manifests table
  await knex.schema.createTable("manifests", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.string("manifest_number", 50).notNullable().unique();
    table.integer("courier_company_id").unsigned();
    table.integer("origin_hub_id").unsigned().notNullable();
    table.integer("destination_hub_id").unsigned();
    
    table.enum("status", [
      "OPEN",
      "CLOSED",
      "PICKUP_ASSIGNED",
      "CANCELLED",
    ]).defaultTo("OPEN");

    table.integer("total_shipments").defaultTo(0);
    table.decimal("total_weight", 10, 2).defaultTo(0);
    table.decimal("total_charge", 10, 2).defaultTo(0);

    table.text("notes");
    table.dateTime("closed_at");
    table.integer("closed_by").unsigned();
    
    table.dateTime("pickup_assigned_at");
    table.integer("assigned_to").unsigned();

    table.timestamps(true, true);

    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");
    table.index(["franchise_id", "created_at"]);
    table.index(["status", "origin_hub_id"]);
    table.index("manifest_number");
  });

  // 2. Create manifest_shipments table
  await knex.schema.createTable("manifest_shipments", (table) => {
    table.increments("id").primary();
    table.integer("manifest_id").unsigned().notNullable();
    table.integer("shipment_id").unsigned().notNullable();
    table.integer("franchise_id").unsigned().notNullable();

    table.enum("status", [
      "ADDED",
      "REMOVED",
      "REMANIFESTED",
    ]).defaultTo("ADDED");

    table.timestamps(true, true);

    table.foreign("manifest_id").references("manifests.id").onDelete("CASCADE");
    table.foreign("shipment_id").references("shipments.id").onDelete("CASCADE");
    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");

    table.index(["manifest_id", "shipment_id"]);
    table.unique(["manifest_id", "shipment_id"]);
  });

  // 3. Create hub_scans table
  await knex.schema.createTable("hub_scans", (table) => {
    table.increments("id").primary();
    table.integer("shipment_id").unsigned().notNullable();
    table.integer("franchise_id").unsigned().notNullable();
    table.integer("hub_id").unsigned().notNullable();

    table.enum("scan_type", ["IN_SCAN", "OUT_SCAN"]).notNullable();
    table.enum("status", ["SCANNED", "REVERSAL"]).defaultTo("SCANNED");

    table.integer("scanned_by").unsigned().notNullable();
    table.string("device_id", 100);
    table.string("location", 255);

    table.dateTime("scan_time").defaultTo(knex.fn.now());
    table.text("notes");

    table.timestamps(true, true);

    table.foreign("shipment_id").references("shipments.id").onDelete("CASCADE");
    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");
    table.foreign("scanned_by").references("users.id").onDelete("RESTRICT");

    table.index(["shipment_id", "scan_type"]);
    table.index(["hub_id", "scan_time"]);
    table.index(["franchise_id", "scan_time"]);
  });

  // 4. Create rto_manifests table
  await knex.schema.createTable("rto_manifests", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.string("rto_manifest_number", 50).notNullable().unique();
    table.integer("original_manifest_id").unsigned();
    table.integer("origin_shipment_hub_id").unsigned();
    table.integer("return_destination_hub_id").unsigned();

    table.enum("rto_reason", [
      "DELIVERY_FAILED",
      "CUSTOMER_REFUSED",
      "ADDRESS_UNSERVICEABLE",
      "DAMAGED_PARCEL",
      "LOST_PARCEL",
      "PAYMENT_ISSUE",
    ]).notNullable();

    table.enum("status", [
      "INITIATED",
      "IN_TRANSIT",
      "RETURNED",
      "RESOLVED",
    ]).defaultTo("INITIATED");

    table.integer("total_shipments").defaultTo(0);
    table.text("notes");

    table.dateTime("returned_at");
    table.dateTime("resolved_at");

    table.timestamps(true, true);

    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");
    table.foreign("original_manifest_id").references("manifests.id").onDelete("SET NULL");

    table.index(["franchise_id", "status"]);
    table.index("rto_manifest_number");
  });

  // 5. Create shipment_hub_tracking table
  await knex.schema.createTable("shipment_hub_tracking", (table) => {
    table.increments("id").primary();
    table.integer("shipment_id").unsigned().notNullable();
    table.integer("franchise_id").unsigned().notNullable();

    table.integer("current_hub_id").unsigned();
    table.dateTime("current_hub_in_scan_time");
    table.dateTime("current_hub_out_scan_time");

    table.integer("next_hub_id").unsigned();
    table.string("route_code", 50);
    table.string("vehicle_id", 100);
    table.string("bag_id", 100);

    table.enum("sla_status", ["ON_TIME", "AT_RISK", "BREACHED"]).defaultTo("ON_TIME");
    table.integer("sla_minutes").defaultTo(0);

    table.timestamps(true, true);

    table.foreign("shipment_id").references("shipments.id").onDelete("CASCADE");
    table.foreign("franchise_id").references("franchises.id").onDelete("CASCADE");

    table.index("shipment_id");
    table.index(["current_hub_id", "current_hub_in_scan_time"], "idx_hub_scan_time");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop tables in reverse order of creation
  await knex.schema.dropTableIfExists("shipment_hub_tracking");
  await knex.schema.dropTableIfExists("rto_manifests");
  await knex.schema.dropTableIfExists("hub_scans");
  await knex.schema.dropTableIfExists("manifest_shipments");
  await knex.schema.dropTableIfExists("manifests");
};
