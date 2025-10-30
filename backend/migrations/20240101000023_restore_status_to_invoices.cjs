/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("invoices", (table) => {
    // Restore the status column that was mistakenly dropped in migration 18
    table
      .enum("status", ["draft", "sent", "paid", "cancelled"])
      .defaultTo("draft")
      .after("net_amount");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("invoices", (table) => {
    table.dropColumn("status");
  });
};
