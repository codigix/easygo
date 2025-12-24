exports.up = function (knex) {
  return knex.raw(`
    ALTER TABLE shipments 
    MODIFY COLUMN status ENUM(
      'CREATED',
      'MANIFESTED',
      'HUB_IN_SCAN',
      'HUB_OUT_SCAN',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'RTO',
      'EXCEPTION'
    ) DEFAULT 'CREATED'
  `);
};

exports.down = function (knex) {
  return knex.raw(`
    ALTER TABLE shipments 
    MODIFY COLUMN status ENUM(
      'CREATED',
      'MANIFESTED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'RTO',
      'EXCEPTION'
    ) DEFAULT 'CREATED'
  `);
};
