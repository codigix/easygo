/**
 * Add calculated amount fields to bookings table
 * These fields store the breakdown of: tax, fuel, and percentages
 * Support for proper rate calculation workflow
 */
exports.up = function (knex) {
  return knex.schema.table("bookings", (table) => {
    // Add tax and fuel amount columns if they don't exist
    if (!table._getColumns().includes("tax_amount")) {
      table
        .decimal("tax_amount", 10, 2)
        .defaultTo(0)
        .comment("GST/Tax amount calculated from RateMaster");
    }

    if (!table._getColumns().includes("fuel_amount")) {
      table
        .decimal("fuel_amount", 10, 2)
        .defaultTo(0)
        .comment("Fuel surcharge calculated from RateMaster");
    }

    if (!table._getColumns().includes("gst_percent")) {
      table
        .decimal("gst_percent", 5, 2)
        .defaultTo(18)
        .comment("GST percentage used in calculation");
    }

    if (!table._getColumns().includes("fuel_percent")) {
      table
        .decimal("fuel_percent", 5, 2)
        .defaultTo(0)
        .comment("Fuel surcharge percentage used in calculation");
    }

    if (!table._getColumns().includes("from_pincode")) {
      table
        .string("from_pincode", 10)
        .nullable()
        .comment("Source pincode for rate calculation");
    }

    if (!table._getColumns().includes("to_pincode")) {
      table
        .string("to_pincode", 10)
        .nullable()
        .comment("Destination pincode for rate calculation");
    }

    if (!table._getColumns().includes("rate")) {
      table
        .decimal("rate", 10, 2)
        .nullable()
        .comment("Rate fetched from RateMaster");
    }

    if (!table._getColumns().includes("rate_master_id")) {
      table
        .integer("rate_master_id")
        .unsigned()
        .nullable()
        .comment("Reference to rate_master record used");
    }
  });
};

exports.down = function (knex) {
  return knex.schema.table("bookings", (table) => {
    // Drop the new columns
    table.dropColumnIfExists("tax_amount");
    table.dropColumnIfExists("fuel_amount");
    table.dropColumnIfExists("gst_percent");
    table.dropColumnIfExists("fuel_percent");
    table.dropColumnIfExists("from_pincode");
    table.dropColumnIfExists("to_pincode");
    table.dropColumnIfExists("rate");
    table.dropColumnIfExists("rate_master_id");
  });
};
