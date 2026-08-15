import { describe, expect, it, vi } from "vite-plus/test";
import { createShaderProgram } from "./shader-program.js";

function webGlStub(overrides: Record<string, unknown> = {}) {
  const vertex = {} as WebGLShader;
  const fragment = {} as WebGLShader;
  const program = {} as WebGLProgram;
  let shaderIndex = 0;
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    createShader: vi.fn(() => (shaderIndex++ === 0 ? vertex : fragment)),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => "compile failed"),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => program),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => "link failed"),
    deleteProgram: vi.fn(),
    ...overrides,
  } as unknown as WebGLRenderingContext;
  return { gl, vertex, fragment, program };
}

describe("shader program", () => {
  it("links both shaders and disposes every owned resource once", () => {
    const { gl, vertex, fragment, program } = webGlStub();
    const result = createShaderProgram(gl, "vertex", "fragment");

    expect(result?.program).toBe(program);
    expect(gl.attachShader).toHaveBeenCalledWith(program, vertex);
    expect(gl.attachShader).toHaveBeenCalledWith(program, fragment);

    result?.dispose();
    result?.dispose();
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  });

  it("cleans up and rejects a program that fails to link", () => {
    const { gl, program } = webGlStub({
      getProgramParameter: vi.fn(() => false),
    });

    expect(createShaderProgram(gl, "vertex", "fragment")).toBeNull();
    expect(gl.deleteProgram).toHaveBeenCalledWith(program);
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  });
});
