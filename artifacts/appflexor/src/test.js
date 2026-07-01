import bcrypt from 'bcrypt';
const password = 'Bis@n8n786';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);