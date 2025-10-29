/**
 * Stores courier-specific rates for each company
 * Used for Dox, NonDox, Dtdc PLUS, Dtdc PTP, Express Cargo, Priority, E-Commerce
 */
exports.up = function (knex) {
  return knex.schema.createTable("courier_company_rates", (table) => {
    table.increments("id").primary();
    table.integer("franchise_id").unsigned().notNullable();
    table.integer("company_id").unsigned().notNullable(); // Foreign key to company_rate_master
    table.string("courier_type", 50).notNullable(); // Dox, NonDox, Dtdc PLUS, etc.
    table.string("row_name", 100).notNullable(); // Within City, Metro, Special Destination, etc.
    table.string("sub_type", 50).nullable(); // For NonDox (air/surface), Dtdc PTP (ptp/ptp2)
    table.enum("slab_type", ["Slab 2", "Slab 3", "Slab 4"]).notNullable();

    // Rate columns - store as JSON for flexibility
    table.json("rates").notNullable(); // {"rate_1": "100", "rate_2": "150", "rate_3": "200"}

    table.enum("status", ["active", "inactive"]).defaultTo("active");
    table.timestamps(true, true);

    // Foreign keys
    table
      .foreign("franchise_id")
      .references("franchises.id")
      .onDelete("CASCADE");

    table
      .foreign("company_id")
      .references("company_rate_master.id")
      .onDelete("CASCADE");

    // Indexes for faster queries
    table.index(["franchise_id", "company_id", "courier_type"]);
    table.index(["courier_type", "row_name"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("courier_company_rates");
};
