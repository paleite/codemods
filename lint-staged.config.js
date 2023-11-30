module.exports = {
  "*.{js,jsx,ts,tsx,json,css,scss,md}": ["prettier --write"],
  "*.ts?(x)": [() => "pnpm run typecheck"],
};
