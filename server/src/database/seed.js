import { all, get, run } from './connection.js';
import { demoCases, demoRecommendations, demoUsers, demoZones } from './seedData.js';

function isoDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(8 + (daysAgo % 7), 15, 0, 0);
  return date.toISOString();
}

async function seedUsers() {
  const { total } = await get('SELECT COUNT(*) AS total FROM users');
  if (total > 0) {
    return;
  }

  for (const user of demoUsers) {
    await run(
      `INSERT INTO users (name, username, password, role)
       VALUES (?, ?, ?, ?)`,
      [user.name, user.username, user.password, user.role]
    );
  }
}

async function seedZones() {
  const { total } = await get('SELECT COUNT(*) AS total FROM zones');
  if (total > 0) {
    return;
  }

  for (const zone of demoZones) {
    await run(
      `INSERT INTO zones (name, campus_area, description, general_status)
       VALUES (?, ?, ?, ?)`,
      [zone.name, zone.campus_area, zone.description, zone.general_status]
    );
  }
}

async function seedRecommendations() {
  const { total } = await get('SELECT COUNT(*) AS total FROM recommendations');
  if (total > 0) {
    return;
  }

  for (const recommendation of demoRecommendations) {
    await run(
      `INSERT INTO recommendations (
        diagnostic_state,
        risk_level,
        priority,
        irrigation_recommendation,
        automatic_observation,
        color,
        sort_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        recommendation.diagnostic_state,
        recommendation.risk_level,
        recommendation.priority,
        recommendation.irrigation_recommendation,
        recommendation.automatic_observation,
        recommendation.color,
        recommendation.sort_order
      ]
    );
  }
}

async function seedCases() {
  const { total } = await get('SELECT COUNT(*) AS total FROM cases');
  if (total > 0) {
    return;
  }

  const zones = await all('SELECT id, name FROM zones');
  const users = await all('SELECT id, username FROM users');
  const recommendations = await all('SELECT * FROM recommendations');

  const zoneByName = new Map(zones.map((zone) => [zone.name, zone]));
  const userByUsername = new Map(users.map((user) => [user.username, user]));
  const recommendationByState = new Map(
    recommendations.map((recommendation) => [recommendation.diagnostic_state, recommendation])
  );

  for (const item of demoCases) {
    const zone = zoneByName.get(item.zone);
    const user = userByUsername.get(item.user);
    const recommendation = recommendationByState.get(item.diagnostic_state);

    if (!zone || !recommendation) {
      continue;
    }

    await run(
      `INSERT INTO cases (
        created_at,
        zone_id,
        created_by,
        location,
        image_path,
        image_filename,
        diagnostic_state,
        confidence,
        risk_level,
        irrigation_recommendation,
        observations,
        priority,
        analysis_mode
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        isoDaysAgo(item.daysAgo),
        zone.id,
        user?.id || null,
        item.location,
        null,
        null,
        item.diagnostic_state,
        item.confidence,
        recommendation.risk_level,
        recommendation.irrigation_recommendation,
        recommendation.automatic_observation,
        recommendation.priority,
        'demo'
      ]
    );
  }
}

export async function seedDatabase() {
  await seedUsers();
  await seedZones();
  await seedRecommendations();
  await seedCases();
}
