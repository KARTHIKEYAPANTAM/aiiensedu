import fs from 'node:fs/promises';

async function main() {
  const content = await fs.readFile('c:\\Users\\USER\\OneDrive\\Desktop\\karthik aims\\yasw-aimeasy\\src\\legacy\\legacy-app.js', 'utf8');
  const lines = content.split('\n');
  for (let i = 9450; i <= 9520; i++) {
    console.log(`${i}: ${lines[i - 1]}`);
  }
}

main().catch(console.error);
