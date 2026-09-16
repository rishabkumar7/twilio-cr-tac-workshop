import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const configSource = readFileSync(new URL("../config.js", import.meta.url), "utf8");
const chapterSource = appSource.slice(0, appSource.indexOf("const workshopConfig"));
const context = {};
vm.runInNewContext(
  `${chapterSource}\nglobalThis.chapters = chapters;\nglobalThis.nodeCodeOverrides = nodeCodeOverrides;\nglobalThis.nodeTextOverrides = nodeTextOverrides;`,
  context
);

const snippets = context.chapters.flatMap((chapter, chapterIndex) =>
  chapter.steps.map((step, stepIndex) => ({
    chapter: chapter.title,
    chapterIndex,
    step: step.title,
    stepIndex,
    label: step.codeLabel,
    code: step.code
  }))
);

function pythonSyntaxCheck(code, name) {
  const check = spawnSync(
    "python3",
    [
      "-c",
      [
        "import ast, sys",
        "name = sys.argv[1]",
        "source = sys.stdin.read()",
        "try:",
        "    ast.parse(source, filename=name)",
        "except SyntaxError as error:",
        "    if 'await' in source and 'outside function' in str(error):",
        "        wrapped = 'async def __workshop_snippet__():\\n' + ''.join('    ' + line + '\\n' for line in source.splitlines())",
        "        ast.parse(wrapped, filename=name)",
        "    else:",
        "        raise"
      ].join("\n"),
      name
    ],
    { input: code, encoding: "utf8" }
  );

  if (check.status !== 0) {
    throw new Error(`${name}\n${check.stderr || check.stdout}`);
  }
}

function javascriptSyntaxCheck(code, name) {
  const tempDir = mkdtempSync(join(tmpdir(), "workshop-js-"));
  const tempFile = join(tempDir, "snippet.mjs");
  writeFileSync(tempFile, code, "utf8");

  const check = spawnSync("node", ["--check", tempFile], { encoding: "utf8" });
  rmSync(tempDir, { recursive: true, force: true });

  if (check.status !== 0) {
    throw new Error(`${name}\n${check.stderr || check.stdout}`);
  }
}

function requireText(source, expected, name) {
  if (!source.includes(expected)) {
    throw new Error(`${name} must include: ${expected}`);
  }
}

function forbidText(source, forbidden, name) {
  if (source.includes(forbidden)) {
    throw new Error(`${name} must not include: ${forbidden}`);
  }
}

const pythonSnippets = snippets.filter((snippet) => snippet.label === "main.py");
for (const snippet of pythonSnippets) {
  pythonSyntaxCheck(
    snippet.code,
    `${snippet.chapterIndex + 1}.${snippet.stepIndex + 1} ${snippet.chapter} / ${snippet.step}`
  );
}

const nodeSnippets = Object.entries(context.nodeCodeOverrides)
  .filter(([, snippet]) => snippet.label === "server.js")
  .map(([key, snippet]) => ({ key, ...snippet }));
for (const snippet of nodeSnippets) {
  javascriptSyntaxCheck(snippet.code, `Node override ${snippet.key} ${snippet.label}`);
}

const pythonFinalApp = context.chapters[2].steps
  .filter((step) => step.codeLabel === "main.py")
  .map((step) => step.code)
  .join("\n\n");
const nodeFinalApp = ["2:2", "2:3", "2:4", "2:5"]
  .map((key) => context.nodeCodeOverrides[key].code)
  .join("\n\n");

pythonSyntaxCheck(pythonFinalApp, "assembled final Python workshop app");
javascriptSyntaxCheck(nodeFinalApp, "assembled final Node.js workshop app");

requireText(context.chapters[0].steps[3].code, '"twilio-agent-connect[server]==2.4.0"', "Python install command");
requireText(context.nodeCodeOverrides["0:3"].code, "twilio-agent-connect@2.3.0", "Node.js install command");
requireText(context.chapters[0].steps[6].code, "ngrok http 8000", "Python ngrok command");
requireText(context.nodeCodeOverrides["0:6"].code, "ngrok http 8000", "Node.js ngrok command");
requireText(nodeFinalApp, "await TAC.create", "Node.js final app");
requireText(nodeFinalApp, "TACServer", "Node.js final app");
requireText(nodeFinalApp, "tac.registerChannel(voiceChannel)", "Node.js final app");
requireText(nodeFinalApp, "async ({ conversationId, message })", "Node.js final app");
forbidText(nodeFinalApp, "twilio-agent-connect/", "Node.js final app");
forbidText(nodeFinalApp, "TACFastAPIServer", "Node.js final app");
forbidText(appSource, "gemini-1.5-flash", "Workshop model choices");
requireText(configSource, "enableNode: false", "Default workshop configuration");
requireText(appSource, "enableNodeWorkshop && parsed.runtime", "Saved runtime guard");
requireText(appSource, "!enableNodeWorkshop || state.runtime !== \"node\"", "Node content guard");
requireText(context.nodeTextOverrides["0:1"].instructions.join("\n"), "22.13", "Node.js prerequisites");
requireText(
  context.nodeCodeOverrides["1:2"].code,
  "({ conversationId, message, memory, session })",
  "Node.js handler contract example"
);

console.log(
  `Validated ${pythonSnippets.length} Python snippets, ${nodeSnippets.length} Node.js snippets, and the actual assembled Python and Node.js workshop apps.`
);
