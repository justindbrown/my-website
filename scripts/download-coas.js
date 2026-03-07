/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/download-coas.js
// Downloads all COA report pages as PDF using Puppeteer

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const coasPath = path.join(__dirname, '../data/janoshik-public.json');
const outputDir = path.join(__dirname, '../public/coas');

async function main() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const data = JSON.parse(fs.readFileSync(coasPath, 'utf-8'));
  const grouped = data.grouped || {};
  let count = 0;
  const browser = await puppeteer.launch();
  for (const peptide in grouped) {
    for (const item of grouped[peptide]) {
      const url = item.reportUrl;
      const fileName = `${item.testId || item.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const filePath = path.join(outputDir, fileName);
      if (fs.existsSync(filePath)) continue;
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.pdf({ path: filePath, format: 'A4' });
      await page.close();
      count++;
      console.log(`Saved: ${fileName}`);
    }
  }
  await browser.close();
  console.log(`Downloaded ${count} COA PDFs to ${outputDir}`);
}

main().catch(e => { console.error(e); process.exit(1); });
