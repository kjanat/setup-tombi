import {
  TOOL_VERSIONS_PACKAGE_ALIASES,
  cleanResolvedVersion,
  isTargetPackage,
} from "./common";

function splitToolVersionsLines(content: string): string[] {
  return content.split(/\r?\n/);
}

function stripToolVersionsComment(line: string): string {
  const commentIndex = line.indexOf("#");
  if (commentIndex === -1) {
    return line.trim();
  }
  return line.slice(0, commentIndex).trim();
}

function matchToolVersionsToolName(line: string): string | undefined {
  const nameMatch = line.match(/^\s*(\S+)/);
  return nameMatch?.[1];
}

function matchToolVersionsToolVersion(line: string): string | undefined {
  const versionMatch = line.match(/^\s*\S+\s+(\S+)/);
  if (versionMatch?.[1]) {
    return cleanResolvedVersion(versionMatch[1]);
  }
  return undefined;
}

export function extractVersionFromToolVersions(
  content: string,
): string | undefined {
  for (const rawLine of splitToolVersionsLines(content)) {
    const line = stripToolVersionsComment(rawLine);
    if (!line) {
      continue;
    }

    const toolName = matchToolVersionsToolName(line);
    if (
      !toolName ||
      !isTargetPackage(toolName, TOOL_VERSIONS_PACKAGE_ALIASES)
    ) {
      continue;
    }

    const version = matchToolVersionsToolVersion(line);
    if (version) {
      return version;
    }
  }

  return undefined;
}
