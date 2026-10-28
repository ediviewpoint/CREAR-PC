export function inspectMigrationHistory(migrations, journal, applied) {
  const known = new Map(
    migrations.map((migration, index) => [
      String(migration.folderMillis),
      { ...migration, tag: journal.entries[index].tag },
    ]),
  );
  const issues = [];
  const matched = new Set();
  for (const row of applied) {
    const migration = known.get(String(row.created_at));
    if (!migration) issues.push("El historial contiene una migración ajena a esta versión.");
    else if (row.hash !== migration.hash)
      issues.push(`El contenido de ${migration.tag} no coincide con el historial aplicado.`);
    else if (matched.has(migration.tag)) issues.push(`El historial repite ${migration.tag}.`);
    else matched.add(migration.tag);
  }
  let gap = false;
  for (const migration of known.values()) {
    if (!matched.has(migration.tag)) gap = true;
    else if (gap)
      issues.push("Hay huecos en el historial; el migrador automático podría omitirlos.");
  }
  return {
    applied: [...matched],
    pending: [...known.values()]
      .filter((migration) => !matched.has(migration.tag))
      .map((migration) => migration.tag),
    issues,
  };
}
