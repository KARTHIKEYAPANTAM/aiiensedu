import fs from 'node:fs/promises';

async function main() {
  const content = await fs.readFile('c:\\Users\\USER\\OneDrive\\Desktop\\karthik aims\\yasw-aimeasy\\src\\styles\\global.css', 'utf8');
  console.log('CONTAINS approval-card-grid:', content.includes('.approval-card-grid {'));
  console.log('CONTAINS approval-list-view:', content.includes('.approval-list-view {'));
}

main().catch(console.error);
