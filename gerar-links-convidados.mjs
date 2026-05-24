import fs from "node:fs/promises";
import path from "node:path";

const projectDir = process.cwd();
const sourcePath = path.join(projectDir, "convidados-normalizados.csv");
const outputPath = path.join(projectDir, "links-convidados.csv");

const baseUrl = "https://SEU-PROJETO.vercel.app/";

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function toCsvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

const raw = await fs.readFile(sourcePath, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);
const [header, ...rows] = lines;

if (!header) {
  throw new Error("Arquivo convidados-normalizados.csv está vazio.");
}

const base = new URL(baseUrl);
const normalizedBaseUrl = `${base.origin}${base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`}`;

const outputRows = rows.map((line) => {
  const [name, displayName, phone, inviteCode] = parseCsvLine(line);
  const inviteUrl = `${normalizedBaseUrl}?invite=${encodeURIComponent(inviteCode)}`;
  return [name, displayName, phone, inviteCode, inviteUrl];
});

const output = [
  "name,display_name,phone,invite_code,invite_url",
  ...outputRows.map((row) => row.map(toCsvCell).join(",")),
].join("\n");

await fs.writeFile(outputPath, output, "utf8");

console.log(`Arquivo gerado em: ${outputPath}`);
