/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("franchises", (table) => {
    table.string("invoice_prefix", 50);
    table.string("arn", 50);
    table.string("service_area", 100);
    table.string("account_name", 100);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("franchises", (table) => {
    table.dropColumn("invoice_prefix");
    table.dropColumn("arn");
    table.dropColumn("service_area");
    table.dropColumn("account_name");
  });
};
