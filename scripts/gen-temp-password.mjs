import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Senha forte e fácil de digitar
const plain = process.argv[2] || 'DellaPace#2026';

const salt = randomBytes(16);
const derived = await scryptAsync(plain, salt, 64);
const stored = `${salt.toString('base64')}.${derived.toString('base64')}`;

console.log('Senha plain:', plain);
console.log('Hash:', stored);
