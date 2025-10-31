/**
 * Add invoice_id column to bookings table
 * This column links bookings to generated invoices
 */
exports.up = function (knex) {
  return knex.schema.table("bookings", (table) => {
    table
      .integer("invoice_id")
      .unsigned()
      .nullable()
      .comment("Reference to invoice when booking is billed")
      .after("id");
  });
};

exports.down = function (knex) {
  return knex.schema.table("bookings", (table) => {
    table.dropColumnIfExists("invoice_id");
  });
};
