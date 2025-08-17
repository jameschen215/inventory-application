// scripts/db-setup.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './init.js';
import { seedDatabase } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETUP_FLAG_FILE = path.join(__dirname, '.db-setup-complete');

export async function runSetup() {
  // Check if setup has already been run
  if (fs.existsSync(SETUP_FLAG_FILE)) {
    console.log('Database setup already completed. Skipping...');
    return;
  }

  try {
    console.log('Running database initialization...');
    await initializeDatabase();

    console.log('Running database seeding...');
    await seedDatabase();

    // Create flag file to mark setup as complete
    const setupInfo = {
      completedAt: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development',
    };
    fs.writeFileSync(SETUP_FLAG_FILE, JSON.stringify(setupInfo, null, 2));

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSetup();
}
