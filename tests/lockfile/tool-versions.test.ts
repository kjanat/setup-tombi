import { describe, it } from "vitest";
import { expectResolvedVersion, expectVersionNotFound } from "./helpers";

describe(".tool-versions parser", () => {
  it("resolves version from padded asdf entries", () => {
    expectResolvedVersion(
      ".tool-versions",
      `
golang        1.27.1
golangci-lint 2.13.2
tombi         1.5.5
`,
      "1.5.5",
    );
  });

  it("resolves version with normal spacing", () => {
    expectResolvedVersion(".tool-versions", "tombi 1.5.5\n", "1.5.5");
  });

  it("ignores comments, blank lines, and Windows line endings", () => {
    expectResolvedVersion(
      ".tool-versions",
      "# tools\r\n\r\ntombi 1.5.5 # TOML formatter\r\n",
      "1.5.5",
    );
  });

  it("selects the first version when multiple are listed", () => {
    expectResolvedVersion(
      ".tool-versions",
      "tombi 1.5.5 1.4.0 latest\n",
      "1.5.5",
    );
  });

  it("passes through non-semver values", () => {
    expectResolvedVersion(".tool-versions", "tombi latest\n", "latest");
  });

  it("does not match similar tool names", () => {
    expectVersionNotFound(
      ".tool-versions",
      "tombi-extra 1.5.5\nmytombi 1.5.5\n",
    );
  });

  it("returns undefined when Tombi is absent", () => {
    expectVersionNotFound(".tool-versions", "golang 1.27.1\n");
  });

  it("returns undefined when the Tombi line has no version", () => {
    expectVersionNotFound(".tool-versions", "tombi\n");
  });
});
