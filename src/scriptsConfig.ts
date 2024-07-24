export interface ScriptsItem {
  content: string;
  enabled: boolean;
}

export type ScriptsList = ScriptsItem[];

const SCRIPTS_SEPARATOR = "/* === MANAGED BY PSKEY === */";
const SCRIPTS_DISABLED_MARKER = "/* DISABLED BY PSKEY */";

// comment out, and escape existing comments
// /* */ => /[1]* *[1]/ => /[2]* *[2]/

function commentOut(content: string): string {
  content = content.replaceAll(
    /\/\[(\d+)\]\*/g,
    (_, p1) => `/[${parseInt(p1) + 1}]*`
  );
  content = content.replaceAll(
    /\*\[(\d+)\]\//g,
    (_, p1) => `*[${parseInt(p1) + 1}]/`
  );
  content = content.replaceAll(/\/\*/g, `/[1]*`);
  content = content.replaceAll(/\*\//g, `*[1]/`);

  return `/*\n${content}\n*/`;
}

function uncomment(content: string): string {
  content = content.slice(3, -3);
  content = content.replaceAll(/\/\[1\]\*/g, `/*`);
  content = content.replaceAll(/\*\[1\]\//g, `*/`);
  content = content.replaceAll(
    /\/\[(\d+)\]\*/g,
    (_, p1) => `/[${parseInt(p1) - 1}]*`
  );
  content = content.replaceAll(
    /\*\[(\d+)\]\//g,
    (_, p1) => `*[${parseInt(p1) - 1}]/`
  );
  return content;
}

function parseScriptItem(script: string): ScriptsItem {
  script = script.trim();
  if (script.startsWith(SCRIPTS_DISABLED_MARKER)) {
    script = script.slice(SCRIPTS_DISABLED_MARKER.length).trim();
    return { content: uncomment(script), enabled: false };
  } else {
    return { content: script, enabled: true };
  }
}

export function parseScripts(content: string): ScriptsList {
  const scripts: ScriptsList = [];
  let currentScript = "";
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.trim() === SCRIPTS_SEPARATOR) {
      scripts.push(parseScriptItem(currentScript));
      currentScript = "";
    } else {
      currentScript += line + "\n";
    }
  }
  currentScript = currentScript.trim();
  if (currentScript) {
    scripts.push(parseScriptItem(currentScript));
  }

  return scripts;
}

export function serializeScripts(scripts: ScriptsList): string {
  return scripts
    .map(({ content, enabled }) => {
      return enabled
        ? content
        : `${SCRIPTS_DISABLED_MARKER}\n${commentOut(content)}`;
    })
    .join("\n" + SCRIPTS_SEPARATOR + "\n");
}
