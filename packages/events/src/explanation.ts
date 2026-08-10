import type { SafeInt } from "@bluewave/contracts";

export interface ExplanationTree {
  formulaId: string;
  formulaVersion: string;
  inputs: Record<string, number | string>;
  intermediate: Record<string, number>;
  result: number | SafeInt;
  unit?: string;
  children?: ExplanationTree[];
}

export class ExplanationBuilder {
  private tree: ExplanationTree;

  constructor(
    formulaId: string,
    formulaVersion: string,
  ) {
    this.tree = {
      formulaId,
      formulaVersion,
      inputs: {},
      intermediate: {},
      result: 0,
    };
  }

  withInput(name: string, value: number | string): this {
    this.tree["inputs"][name] = value;
    return this;
  }

  withIntermediate(name: string, value: number): this {
    this.tree["intermediate"][name] = value;
    return this;
  }

  withResult(result: number | SafeInt): this {
    this.tree["result"] = result;
    return this;
  }

  withUnit(unit: string): this {
    this.tree["unit"] = unit;
    return this;
  }

  addChild(child: ExplanationTree): this {
    if (this.tree["children"] === undefined) {
      this.tree["children"] = [];
    }
    this.tree["children"]!.push(child);
    return this;
  }

  build(): ExplanationTree {
    return { ...this.tree };
  }
}

function formatExplanationImpl(tree: ExplanationTree, indent: number): string {
  const prefix = "  ".repeat(indent);
  const lines: string[] = [];

  lines.push(
    `${prefix}${tree["formulaId"]} v${tree["formulaVersion"]} = ${String(tree["result"])}${tree["unit"] !== undefined ? ` ${tree["unit"]}` : ""}`,
  );

  const inputKeys = Object.keys(tree["inputs"]);
  if (inputKeys.length > 0) {
    lines.push(`${prefix}  inputs:`);
    for (const key of inputKeys) {
      lines.push(`${prefix}    ${key} = ${String(tree["inputs"][key]!)}`);
    }
  }

  const intermediateKeys = Object.keys(tree["intermediate"]);
  if (intermediateKeys.length > 0) {
    lines.push(`${prefix}  intermediate:`);
    for (const key of intermediateKeys) {
      lines.push(`${prefix}    ${key} = ${String(tree["intermediate"][key]!)}`);
    }
  }

  if (tree["children"] !== undefined) {
    for (const child of tree["children"]!) {
      lines.push(formatExplanationImpl(child, indent + 1));
    }
  }

  return lines.join("\n");
}

export function formatExplanation(tree: ExplanationTree): string {
  return formatExplanationImpl(tree, 0);
}