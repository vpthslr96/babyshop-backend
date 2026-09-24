const bcrypt = require('bcrypt');

const password = process.argv[2];
if (!password) {
  console.error('Использование: node hash-password.js <пароль>');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
});
