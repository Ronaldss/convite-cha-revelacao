from __future__ import annotations

import csv
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

import pandas as pd


PROJECT_DIR = Path(__file__).resolve().parent
SOURCE_XLSX = PROJECT_DIR / "referencias" / "_convidados_new.xlsx"
CURRENT_CSV = PROJECT_DIR / "convidados-normalizados.csv"
OUTPUT_CSV = PROJECT_DIR / "convidados-normalizados.csv"
OUTPUT_SQL = PROJECT_DIR / "supabase-seed-guests.sql"
OUTPUT_MD = PROJECT_DIR / "convidados-invite-codes.md"
CONFIG_JS = PROJECT_DIR / "config.js"


@dataclass
class GuestRow:
    name: str
    display_name: str
    phone: str
    invite_code: str


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def normalize_phone(value: object) -> str:
    if value is None:
        return ""
    digits = re.sub(r"\D", "", str(value))
    return digits


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_only.lower()).strip("-")
    return slug or "convidado"


def sql_string(value: str | None) -> str:
    if value in (None, ""):
        return "null"
    escaped = value.replace("'", "''")
    return f"'{escaped}'"


def csv_cell(value: str) -> str:
    escaped = value.replace('"', '""')
    return f'"{escaped}"'


def read_existing_guests() -> list[GuestRow]:
    rows: list[GuestRow] = []
    with CURRENT_CSV.open("r", encoding="utf-8", newline="") as handle:
      reader = csv.DictReader(handle)
      for row in reader:
          rows.append(
              GuestRow(
                  name=normalize_spaces(row["name"]),
                  display_name=normalize_spaces(row["display_name"]),
                  phone=normalize_phone(row["phone"]),
                  invite_code=normalize_spaces(row["invite_code"]),
              )
          )
    return rows


def read_new_guests() -> list[tuple[str, str]]:
    dataframe = pd.read_excel(SOURCE_XLSX)
    guests: list[tuple[str, str]] = []
    for _, row in dataframe.iterrows():
        name = normalize_spaces(str(row.get("id_nome", "")))
        if not name or name.lower() == "nan":
            continue
        phone = normalize_phone(row.get("id_contato", ""))
        guests.append((name, phone))
    return guests


def generate_invite_code(name: str, phone: str, used_codes: set[str]) -> str:
    base = slugify(name)
    if phone:
        candidate = f"{base}-{phone[-4:]}"
        if candidate not in used_codes:
            return candidate

    suffix = 1
    while True:
        candidate = f"{base}-{suffix:02d}"
        if candidate not in used_codes:
            return candidate
        suffix += 1


def merge_guests(existing_rows: list[GuestRow], new_guests: list[tuple[str, str]]) -> tuple[list[GuestRow], list[GuestRow], int]:
    merged: list[GuestRow] = []
    used_old_indexes: set[int] = set()
    used_codes: set[str] = set()
    preserved_count = 0

    exact_lookup: dict[tuple[str, str], list[int]] = {}
    name_lookup: dict[str, list[int]] = {}
    for index, row in enumerate(existing_rows):
        exact_lookup.setdefault((row.name, row.phone), []).append(index)
        name_lookup.setdefault(row.name, []).append(index)

    for name, phone in new_guests:
        chosen_index: int | None = None

        for candidate in exact_lookup.get((name, phone), []):
            if candidate not in used_old_indexes:
                chosen_index = candidate
                break

        if chosen_index is None:
            remaining = [candidate for candidate in name_lookup.get(name, []) if candidate not in used_old_indexes]
            if len(remaining) == 1:
                chosen_index = remaining[0]

        if chosen_index is not None:
            old_row = existing_rows[chosen_index]
            used_old_indexes.add(chosen_index)
            used_codes.add(old_row.invite_code)
            preserved_count += 1
            merged.append(
                GuestRow(
                    name=name,
                    display_name=name,
                    phone=phone,
                    invite_code=old_row.invite_code,
                )
            )
            continue

        invite_code = generate_invite_code(name, phone, used_codes)
        used_codes.add(invite_code)
        merged.append(
            GuestRow(
                name=name,
                display_name=name,
                phone=phone,
                invite_code=invite_code,
            )
        )

    removed = [row for index, row in enumerate(existing_rows) if index not in used_old_indexes]
    return merged, removed, preserved_count


def write_csv(rows: list[GuestRow]) -> None:
    lines = ["name,display_name,phone,invite_code"]
    for row in rows:
        lines.append(
            ",".join(
                [
                    csv_cell(row.name),
                    csv_cell(row.display_name),
                    csv_cell(row.phone),
                    csv_cell(row.invite_code),
                ]
            )
        )
    OUTPUT_CSV.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_sql(rows: list[GuestRow], removed_rows: list[GuestRow]) -> None:
    lines = ["alter table public.guests add column if not exists phone text;", ""]

    removed_codes = [row.invite_code for row in removed_rows]
    if removed_codes:
        code_list = ", ".join(sql_string(code) for code in removed_codes)
        lines.extend(
            [
                "-- Remove convites que sairam da lista atual.",
                f"delete from public.gender_votes where guest_id in (select id from public.guests where invite_code in ({code_list}));",
                f"delete from public.guests where invite_code in ({code_list});",
                "",
            ]
        )

    lines.append("insert into public.guests (name, display_name, phone, invite_code, attendance_confirmed)")
    lines.append("values")

    values = []
    for row in rows:
        values.append(
            f"  ({sql_string(row.name)}, {sql_string(row.display_name)}, {sql_string(row.phone)}, {sql_string(row.invite_code)}, false)"
        )
    lines.append(",\n".join(values))
    lines.append("on conflict (invite_code) do update set")
    lines.append("  name = excluded.name,")
    lines.append("  display_name = excluded.display_name,")
    lines.append("  phone = excluded.phone;")

    OUTPUT_SQL.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_markdown(rows: list[GuestRow], removed_rows: list[GuestRow], preserved_count: int) -> None:
    removed_list = "\n".join(f"- `{row.display_name}` -> `{row.invite_code}`" for row in removed_rows) or "- Nenhum"
    generated_count = len(rows) - preserved_count
    content = f"""# Convidados e Invite Codes

A lista enviada pelos pais foi normalizada a partir de [referencias/_convidados_new.xlsx](/C:/Users/ronal/OneDrive/Documentos/Convite_online/referencias/_convidados_new.xlsx).

## Resumo

- Total de convites: `{len(rows)}`
- Convites preservados da lista anterior: `{preserved_count}`
- Convites novos gerados nesta atualização: `{generated_count}`
- Convidados sem telefone na planilha: `{sum(1 for row in rows if not row.phone)}`

## Como os códigos foram tratados

- quando o convidado já existia, o `invite_code` anterior foi preservado
- quando o convidado era novo, o código foi gerado com base no nome e nos `4 últimos dígitos` do telefone
- isso evita quebrar links que já possam ter sido enviados

Exemplos:

- `Daniel` -> `daniel-3755`
- `Rogério e esposa` -> `rogerio-e-esposa-01`
- `Samuel e esposa` -> `samuel-e-esposa-5927` e `samuel-e-esposa-6887`
- `Roni e Manu` -> `roni-e-manu-2854`

## Arquivos prontos

- Lista normalizada para conferência: [convidados-normalizados.csv](/C:/Users/ronal/OneDrive/Documentos/Convite_online/convidados-normalizados.csv)
- Seed para o Supabase: [supabase-seed-guests.sql](/C:/Users/ronal/OneDrive/Documentos/Convite_online/supabase-seed-guests.sql)
- Links finais para envio: [links-convidados.csv](/C:/Users/ronal/OneDrive/Documentos/Convite_online/links-convidados.csv)

## Removidos da lista atual

{removed_list}
"""
    OUTPUT_MD.write_text(content, encoding="utf-8")


def update_config_names(rows: list[GuestRow]) -> None:
    unique_names: list[str] = []
    seen: set[str] = set()
    for row in rows:
        if row.display_name in seen:
            continue
        seen.add(row.display_name)
        unique_names.append(row.display_name)

    replacement = ",\n".join(f'      "{name}"' for name in unique_names)
    content = CONFIG_JS.read_text(encoding="utf-8")
    updated = re.sub(
        r'(\s+names:\s+\[)(.*?)(\n\s+\],)',
        lambda match: f'{match.group(1)}\n{replacement}{match.group(3)}',
        content,
        flags=re.S,
    )
    CONFIG_JS.write_text(updated, encoding="utf-8")


def main() -> None:
    existing_rows = read_existing_guests()
    new_guests = read_new_guests()
    merged_rows, removed_rows, preserved_count = merge_guests(existing_rows, new_guests)
    write_csv(merged_rows)
    write_sql(merged_rows, removed_rows)
    write_markdown(merged_rows, removed_rows, preserved_count)
    update_config_names(merged_rows)

    print(f"Convidados finais: {len(merged_rows)}")
    print(f"Convites preservados: {preserved_count}")
    print(f"Convites novos: {len(merged_rows) - preserved_count}")
    print(f"Removidos da lista: {len(removed_rows)}")


if __name__ == "__main__":
    main()
