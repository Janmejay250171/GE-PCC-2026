import { connectDB, disconnectDB } from '../config/db.js';
import { Policy } from '../models/Policy.js';
import { DEMO_POLICIES } from '../utils/demoData.js';

async function seed() {
  console.log('[Seed] Connecting to database...');
  await connectDB();

  console.log('[Seed] Seeding demo policies into MongoDB...');
  for (const demo of DEMO_POLICIES) {
    const existing = await Policy.findById(demo.id);
    const docData = {
      _id: demo.id,
      confirmedByUser: false,
      ...demo.data
    };

    if (existing) {
      await Policy.findByIdAndUpdate(demo.id, docData);
      console.log(`[Seed] Updated demo policy: ${demo.id} (${demo.title})`);
    } else {
      await Policy.create(docData);
      console.log(`[Seed] Created demo policy: ${demo.id} (${demo.title})`);
    }
  }

  console.log('[Seed] Seeding completed successfully.');
  await disconnectDB();
}

seed().catch((err) => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
