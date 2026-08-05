import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("用法: node scripts/hash-password.mjs <密碼>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log(hash);