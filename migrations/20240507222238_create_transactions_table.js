/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.createTable("accruals", (table) => {
        table.increments("id").primary;
        table.uuid("partner_id").notNullable();
        table.foreign("partner_id").references("id").inTable("partner");
        table.integer("amount").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTableIfExists("accruals");
};
