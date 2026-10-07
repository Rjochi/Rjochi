import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { parsePageCopy, serializeInlineJson } from "../../src/content/page-copy";

const source = readFileSync(new URL("../../data/page.ja.yaml", import.meta.url), "utf8");
describe("editable Japanese copy", () => {
  it("reports the missing edit location before a page can be generated", () => {
    const copy = parse(source);
    delete copy.demo.controls.pause;
    expect(() => parsePageCopy(stringify(copy))).toThrow("demo.controls.pause");
    copy.demo.controls.pause = "一時停止";
    copy.explanation.steps[0].body = "";
    expect(() => parsePageCopy(stringify(copy))).toThrow("explanation.steps.0.body");
  });
  it("keeps script-like edited text literal in inline client data", () => {
    const copy = parsePageCopy(source);
    copy.demo.controls.play = '</script><script>alert("edited copy")</script> & 再生';
    const inline = serializeInlineJson(copy.demo);
    expect(inline).not.toContain("</script>");
    expect(JSON.parse(inline).controls.play).toBe(copy.demo.controls.play);
  });
});
