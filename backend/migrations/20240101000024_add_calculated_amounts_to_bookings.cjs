/**
 * Add calculated amount fields to bookings table
 * These fields store the breakdown of: tax, fuel, and percentages
 * Support for proper rate calculation workflow
 */
exports.up = function (knex) {
  return knex.schema.table("bookings", (table) => {
    // Add tax and fuel amount columns if they don't exist
    table
      .decimal("tax_amount", 10, 2)
      .defaultTo(0)
      .nullable()
      .comment("GST/Tax amount calculated from RateMaster");

    table
      .decimal("fuel_amount", 10, 2)
      .defaultTo(0)
      .nullable()
      .comment("Fuel surcharge calculated from RateMaster");

    table
      .decimal("gst_percent", 5, 2)
      .defaultTo(18)
      .nullable()
      .comment("GST percentage used in calculation");

    table
      .decimal("fuel_percent", 5, 2)
      .defaultTo(0)
      .nullable()
      .comment("Fuel surcharge percentage used in calculation");

    table
      .string("from_pincode", 10)
      .nullable()
      .comment("Source pincode for rate calculation");

    table
      .string("to_pincode", 10)
      .nullable()
      .comment("Destination pincode for rate calculation");

    table
      .decimal("rate", 10, 2)
      .nullable()
      .comment("Rate fetched from RateMaster");

    table
      .integer("rate_master_id")
      .unsigned()
      .nullable()
      .comment("Reference to rate_master record used");
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
