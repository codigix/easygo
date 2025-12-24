/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("rto_manifests", (table) => {
    table.integer("origin_shipment_hub_id").unsigned().nullable().alter();
    table.integer("return_destination_hub_id").unsigned().nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("rto_manifests", (table) => {
    table.integer("origin_shipment_hub_id").unsigned().notNullable().alter();
    table.integer("return_destination_hub_id").unsigned().notNullable().alter();
  });
};
