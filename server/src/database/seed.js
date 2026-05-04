import { all, get, run } from './connection.js';
import { hashPassword, normalizeEmail, normalizeRole, normalizeUsername } from '../services/authService.js';
import { demoCases, demoRecommendations, demoZones, initialUsers } from './seedData.js';

function isoDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(8 + (daysAgo % 7), 15, 0, 0);
  return date.toISOString();
}

async function seedUsers() {
  for (const user of initialUsers) {
    const username = normalizeUsername(user.username);
    const existing = await get('SELECT * FROM users WHERE username = ?', [username]);

    if (existing) {
      const updates = [];
      const params = [];

      if (!existing.email && user.email) {
        updates.push('email = ?');
        params.push(normalizeEmail(user.email));
      }

      if (!existing.password_hash) {
        updates.push('password_hash = ?');
        params.push(await hashPassword(user.password));
      }

      if (normalizeRole(existing.role) !== existing.role) {
        updates.push('role = ?');
        params.push(normalizeRole(existing.role));
      }

      if (updates.length > 0) {
        params.push(existing.id);
        await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      continue;
    }

    await run(
      `INSERT INTO users (name, username, email, password_hash, role, active, is_guest)
       VALUES (?, ?, ?, ?, ?, 1, 0)`,
      [
        user.name,
        username,
        normalizeEmail(user.email),
        await hashPassword(user.password),
        normalizeRole(user.role)
      ]
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
