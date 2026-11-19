import ts from "typescript";

// Names must be sorted after expansion: TCategory precedes TCreateCategoryRequest, TOrder follows TCreateOrderRequest.
const sortNamedImports = (source: string, filename: string): string => {
  if (!/\.tsx?$/.test(filename)) return source;
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const edits: { start: number; end: number; text: string }[] = [];
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (
      !bindings ||
      !ts.isNamedImports(bindings) ||
      bindings.elements.length < 2
    )
      continue;
    const elements = [...bindings.elements].sort((a, b) => {
      const left = (a.propertyName ?? a.name).text;
      const right = (b.propertyName ?? b.name).text;
      for (
        let index = 0;
        index < Math.min(left.length, right.length);
        index++
      ) {
        const l = left[index];
        const r = right[index];
        if (l.toLowerCase() !== r.toLowerCase())
          return l.toLowerCase() < r.toLowerCase() ? -1 : 1;
        if (l !== r) return l < r ? -1 : 1;
      }
      return left.length - right.length;
    });
    if (
      elements.every((element, index) => element === bindings.elements[index])
    )
      continue;
    const texts = elements.map((element) => element.getText(file));
    const multiline = bindings.getText(file).includes("\n");
    edits.push({
      start: bindings.getStart(file),
      end: bindings.end,
      text: multiline
        ? `{\n${texts.map((text) => `  ${text}`).join(",\n")},\n}`
        : `{ ${texts.join(", ")} }`,
    });
  }
  let output = source;
  for (const edit of edits.reverse())
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  return output;
};

export { sortNamedImports };
