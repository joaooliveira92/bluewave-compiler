import { DiagnosticCollector } from "@bluewave/diagnostics";
import { validateCommandTypeDefinition } from "./definition.js";
import type { CommandTypeDefinition } from "./types.js";

export class CommandRegistry {
  private defs = new Map<string, CommandTypeDefinition>();

  register(def: CommandTypeDefinition): void {
    const c = new DiagnosticCollector();
    if (!validateCommandTypeDefinition(def, c)) {
      throw Object.assign(
        new Error(`INVALID_COMMAND_TYPE_DEFINITION: ${c.errors.map((e) => e.message).join("; ")}`),
        { code: "INVALID_COMMAND_TYPE_DEFINITION" },
      );
    }
    if (this.defs.has(def.commandTypeId))
      throw Object.assign(
        new Error(`INVALID_COMMAND_TYPE_DEFINITION: duplicate ${def.commandTypeId}`),
        { code: "INVALID_COMMAND_TYPE_DEFINITION" },
      );
    this.defs.set(def.commandTypeId, Object.freeze({ ...def }));
  }

  get(commandTypeId: string): CommandTypeDefinition | undefined {
    return this.defs.get(commandTypeId);
  }
  get all(): readonly CommandTypeDefinition[] {
    return [...this.defs.values()];
  }

  validateStartup(): void {
    const c = new DiagnosticCollector();
    for (const def of this.defs.values()) validateCommandTypeDefinition(def, c);
    if (c.hasErrors)
      throw Object.assign(new Error(`INVALID_COMMAND_TYPE_DEFINITION: startup validation failed`), {
        code: "INVALID_COMMAND_TYPE_DEFINITION",
        diagnostics: c.all,
      });
  }

  // §2 parity check
  assertIssuerParity(commandTypeId: string, issuerClass: string): void {
    const def = this.defs.get(commandTypeId);
    if (!def)
      throw Object.assign(new Error("INVALID_COMMAND_TYPE_DEFINITION"), {
        code: "INVALID_COMMAND_TYPE_DEFINITION",
      });
    if (!def.allowedIssuerClasses.includes(issuerClass as never)) {
      throw Object.assign(new Error("COMMAND_ISSUER_NOT_ALLOWED"), {
        code: "COMMAND_ISSUER_NOT_ALLOWED",
      });
    }
  }
}
