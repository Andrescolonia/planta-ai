import bcrypt from 'bcryptjs';

export const PUBLIC_ROLES = ['invitado', 'usuario', 'supervisor', 'administrador'];
export const ADMIN_ASSIGNABLE_ROLES = ['usuario', 'supervisor', 'administrador'];

const ROLE_MAP = {
  operador: 'usuario',
  usuario: 'usuario',
  supervisor: 'supervisor',
  administrador: 'administrador',
  invitado: 'invitado'
};

export function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email || null;
}

export function normalizePersonName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function validatePersonName(value, { required = true, maxLength = 50 } = {}) {
  const name = normalizePersonName(value);

  if (!name) {
    return required ? { valid: false, message: 'Ingresa un nombre.' } : { valid: true, name: '' };
  }

  if (name.length < 2 || name.length > maxLength) {
    return {
      valid: false,
      message: `El nombre debe tener entre 2 y ${maxLength} caracteres.`
    };
  }

  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(name)) {
    return {
      valid: false,
      message: 'El nombre solo puede contener letras y espacios.'
    };
  }

  return { valid: true, name };
}

export function isGeneratedGuestName(value) {
  return /^Invitado \d{4}$/.test(String(value || '').trim());
}

export function normalizeRole(role, fallback = 'usuario') {
  return ROLE_MAP[role] || fallback;
}

export async function hashPassword(password) {
  return bcrypt.hash(String(password), 10);
}

export async function verifyPassword(password, passwordHash) {
  if (!passwordHash) {
    return false;
  }

  return bcrypt.compare(String(password), passwordHash);
}

export function ensurePasswordIsValid(password) {
  if (!password || String(password).length < 6) {
    return false;
  }

  return true;
}

export function createSession(user, type = 'local') {
  const issuedAt = Date.now();
  const token = Buffer.from(`${user.id}:${user.username}:${user.role}:${issuedAt}`).toString(
    'base64url'
  );

  return {
    token,
    type,
    expiresIn: '8h'
  };
}

export function parseSessionToken(token) {
  try {
    const decoded = Buffer.from(String(token || ''), 'base64url').toString('utf8');
    const [id, username, role] = decoded.split(':');

    if (!id || !username || !role) {
      return null;
    }

    return {
      id: Number(id),
      username,
      role
    };
  } catch {
    return null;
  }
}

export function createGuestUsername() {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `invitado-${suffix}`;
}
