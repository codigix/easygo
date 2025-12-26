/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("load_plans", (table) => {
    table.boolean("route_deviation_flag").notNullable().defaultTo(false);
    table.decimal("route_deviation_distance_km", 10, 2).notNullable().defaultTo(0);
    table.dateTime("route_deviation_triggered_at");
    table.string("completion_source", 30).notNullable().defaultTo("MANUAL");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("load_plans", (table) => {
    table.dropColumn("route_deviation_flag");
    table.dropColumn("route_deviation_distance_km");
    table.dropColumn("route_deviation_triggered_at");
    table.dropColumn("completion_source");
  });
};
