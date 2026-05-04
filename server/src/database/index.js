import { createSchema } from './schema.js';
import { seedDatabase } from './seed.js';

export async function initializeDatabase() {
  await createSchema();
  await seedDatabase();
}
