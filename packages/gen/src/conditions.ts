import type { TAlotConfig } from "./config.js";

const matches = (config: TAlotConfig, expression: string): boolean =>
  expression
    .split("|")
    .map((condition) => {
      const [key, expected, extra] = condition.split("=");
      if (
        !key ||
        !expected ||
        extra ||
        !["mobile", "uploads"].includes(key) ||
        !["on", "off"].includes(expected)
      ) {
        throw new Error(`invalid template condition: ${expression}`);
      }
      const enabled = (config.modules ?? ["mobile", "uploads"]).includes(key);
      return enabled === (expected === "on");
    })
    .some(Boolean);

const renderConditions = (source: string, config: TAlotConfig): string => {
  const stack: { active: boolean; matched: boolean; alternate: boolean }[] = [];
  const output: string[] = [];
  for (const line of source.split(/(?<=\n)/)) {
    const directive =
      /^\s*(?:\/\/|#) @alot-(if|else|endif)(?: ([^\r\n]+))?\s*$/.exec(line);
    if (!directive) {
      if (stack.every((block) => block.active)) output.push(line);
      continue;
    }
    const [, kind, expression] = directive;
    if (kind === "if") {
      if (!expression) throw new Error("template if requires a condition");
      const matched = matches(config, expression);
      stack.push({ active: matched, matched, alternate: false });
    } else {
      const block = stack.at(-1);
      if (!block || expression) throw new Error(`unexpected template ${kind}`);
      if (kind === "endif") stack.pop();
      else {
        if (block.alternate) throw new Error("duplicate template else");
        block.active = !block.matched;
        block.alternate = true;
      }
    }
  }
  if (stack.length) throw new Error("unclosed template condition");
  return output.join("");
};

export { renderConditions };
