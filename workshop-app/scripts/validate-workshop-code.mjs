import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const chapterSource = appSource.slice(0, appSource.indexOf("const storageKey"));
const context = {};
vm.runInNewContext(`${chapterSource}\nglobalThis.chapters = chapters;\nglobalThis.nodeCodeOverrides = nodeCodeOverrides;`, context);

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

  const check = spawnSync("node", ["--check", tempFile], {
    encoding: "utf8"
  });

  rmSync(tempDir, { recursive: true, force: true });

  if (check.status !== 0) {
    throw new Error(`${name}\n${check.stderr || check.stdout}`);
  }
}

const pythonSnippets = snippets.filter((snippet) => snippet.label === "main.py");

for (const snippet of pythonSnippets) {
  if (snippet.label === "main.py") {
    pythonSyntaxCheck(
      snippet.code,
      `${snippet.chapterIndex + 1}.${snippet.stepIndex + 1} ${snippet.chapter} / ${snippet.step}`
    );
  }
}

const nodeSnippets = Object.entries(context.nodeCodeOverrides)
  .filter(([, snippet]) => snippet.label === "server.js")
  .map(([key, snippet]) => ({
    key,
    ...snippet
  }));

for (const snippet of nodeSnippets) {
  javascriptSyntaxCheck(snippet.code, `Node override ${snippet.key} ${snippet.label}`);
}

const finalApp = String.raw`import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from google import genai

load_dotenv()

PORT = int(os.getenv("PORT", "8080"))
DOMAIN = os.getenv("NGROK_URL")
if not DOMAIN:
    raise ValueError("NGROK_URL environment variable not set.")

WS_URL = f"wss://{DOMAIN}/ws"
WELCOME_GREETING = "Hi! I am your workshop voice agent. Ask me anything!"

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set.")

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
AGENT_NAME = os.getenv("AGENT_NAME", "Ava")
client = genai.Client(api_key=GOOGLE_API_KEY)
sessions = {}

SYSTEM_PROMPT = f"""
You are {AGENT_NAME}, a helpful voice AI agent on a live phone call.
Speak in short, natural sentences.
Ask one question at a time.
Do not use markdown, bullet points, links, or code blocks.
If you are unsure, ask a concise clarifying question.
""".strip()

app = FastAPI()


@app.get("/")
def health_check():
    return {"ok": True, "service": "twilio-gemini-voice-agent"}


@app.post("/twiml")
async def twiml_endpoint():
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="{WS_URL}" welcomeGreeting="{WELCOME_GREETING}" />
  </Connect>
</Response>
""".strip()
    return Response(content=xml, media_type="text/xml")


def start_call_session(call_sid):
    sessions[call_sid] = client.chats.create(
        model=MODEL,
        config={"system_instruction": SYSTEM_PROMPT},
    )
    return sessions[call_sid]


def end_call_session(call_sid):
    if call_sid in sessions:
        sessions.pop(call_sid)


def ask_gemini(chat_session, caller_text):
    response = chat_session.send_message(caller_text)
    return (response.text or "I am sorry, could you say that again?").strip()


def get_caller_text(message):
    return (
        message.get("voicePrompt")
        or message.get("text")
        or message.get("transcript")
        or message.get("utterance")
        or ""
    ).strip()


async def say(websocket, text):
    await websocket.send_text(json.dumps({
        "type": "text",
        "token": text,
        "last": True,
    }))


def lookup_customer(phone_number):
    return {
        "name": "Sam Rivera",
        "plan": "Pro",
        "status": "active",
    }


def create_ticket(summary):
    return {
        "ticket_id": "CR-1042",
        "summary": summary,
        "status": "created",
    }


def maybe_run_tool(caller_text):
    lowered = caller_text.lower()
    if "look me up" in lowered or "my account" in lowered:
        return {"tool": "lookup_customer", "result": lookup_customer("caller")}
    if "ticket" in lowered or "case" in lowered:
        return {"tool": "create_ticket", "result": create_ticket(caller_text)}
    return None


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    call_sid = None

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            event_type = message.get("type")

            if event_type == "setup":
                call_sid = message.get("callSid")
                start_call_session(call_sid)
                print(f"Setup for call: {call_sid}")

            elif event_type == "prompt":
                if not call_sid or call_sid not in sessions:
                    print("Prompt received before setup")
                    continue

                caller_text = get_caller_text(message)
                if not caller_text:
                    continue

                chat_session = sessions[call_sid]
                tool_event = maybe_run_tool(caller_text)
                if tool_event:
                    caller_text = (
                        f"The caller said: {caller_text}\n"
                        f"Tool result: {tool_event}\n"
                        "Explain the result to the caller in one or two sentences."
                    )

                try:
                    reply = ask_gemini(chat_session, caller_text)
                except Exception as error:
                    print("Gemini error:", error)
                    reply = "I had trouble thinking through that. Could you repeat it once?"

                await say(websocket, reply)

            elif event_type == "interrupt":
                print(f"Caller interrupted response for call: {call_sid}")
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for call: {call_sid}")
        end_call_session(call_sid)
`;

pythonSyntaxCheck(finalApp, "assembled final workshop app");

const finalNodeApp = String.raw`import "dotenv/config";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { GoogleGenAI } from "@google/genai";

const PORT = Number(process.env.PORT || 8080);
const DOMAIN = process.env.NGROK_URL;
if (!DOMAIN) {
  throw new Error("NGROK_URL environment variable not set.");
}

const WS_URL = "wss://" + DOMAIN + "/ws";
const WELCOME_GREETING = "Hi! I am your workshop voice agent. Ask me anything!";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY environment variable not set.");
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const AGENT_NAME = process.env.AGENT_NAME || "Ava";
const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
const sessions = new Map();

const SYSTEM_PROMPT = [
  "You are " + AGENT_NAME + ", a helpful voice AI agent on a live phone call.",
  "Speak in short, natural sentences.",
  "Ask one question at a time.",
  "Do not use markdown, bullet points, links, or code blocks.",
  "If you are unsure, ask a concise clarifying question.",
].join("\n");

const fastify = Fastify({ logger: true });
await fastify.register(websocket);

fastify.get("/", async () => {
  return { ok: true, service: "twilio-gemini-voice-agent" };
});

fastify.post("/twiml", async (request, reply) => {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Response>",
    "  <Connect>",
    '    <ConversationRelay url="' + WS_URL + '" welcomeGreeting="' + WELCOME_GREETING + '" />',
    "  </Connect>",
    "</Response>",
  ].join("\n");

  return reply.type("text/xml").send(xml);
});

function startCallSession(callSid) {
  const chat = ai.chats.create({
    model: MODEL,
    config: { systemInstruction: SYSTEM_PROMPT },
  });
  sessions.set(callSid, chat);
  return chat;
}

function endCallSession(callSid) {
  sessions.delete(callSid);
}

async function askGemini(chatSession, callerText) {
  const response = await chatSession.sendMessage({ message: callerText });
  return (response.text || "I am sorry, could you say that again?").trim();
}

function getCallerText(message) {
  return (
    message.voicePrompt ||
    message.text ||
    message.transcript ||
    message.utterance ||
    ""
  ).trim();
}

function say(ws, text) {
  ws.send(JSON.stringify({
    type: "text",
    token: text,
    last: true,
  }));
}

function lookupCustomer(phoneNumber) {
  return {
    name: "Sam Rivera",
    plan: "Pro",
    status: "active",
  };
}

function createTicket(summary) {
  return {
    ticketId: "CR-1042",
    summary,
    status: "created",
  };
}

function maybeRunTool(callerText) {
  const lowered = callerText.toLowerCase();
  if (lowered.includes("look me up") || lowered.includes("my account")) {
    return { tool: "lookupCustomer", result: lookupCustomer("caller") };
  }
  if (lowered.includes("ticket") || lowered.includes("case")) {
    return { tool: "createTicket", result: createTicket(callerText) };
  }
  return null;
}

fastify.get("/ws", { websocket: true }, (connection) => {
  const ws = connection.socket ?? connection;
  let callSid = null;

  ws.on("message", async (raw) => {
    const message = JSON.parse(raw.toString());
    const eventType = message.type;

    if (eventType === "setup") {
      callSid = message.callSid;
      startCallSession(callSid);
      console.log("Setup for call: " + callSid);
    } else if (eventType === "prompt") {
      if (!callSid || !sessions.has(callSid)) {
        console.log("Prompt received before setup");
        return;
      }

      let callerText = getCallerText(message);
      if (!callerText) return;

      const toolEvent = maybeRunTool(callerText);
      if (toolEvent) {
        callerText = [
          "The caller said: " + callerText,
          "Tool result: " + JSON.stringify(toolEvent),
          "Explain the result to the caller in one or two sentences.",
        ].join("\\n");
      }

      let responseText;
      try {
        const chatSession = sessions.get(callSid);
        responseText = await askGemini(chatSession, callerText);
      } catch (error) {
        console.error("Gemini error:", error);
        responseText = "I had trouble thinking through that. Could you repeat it once?";
      }

      say(ws, responseText);
    } else if (eventType === "interrupt") {
      console.log("Caller interrupted response for call: " + callSid);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket disconnected for call: " + callSid);
    endCallSession(callSid);
  });
});

await fastify.listen({ port: PORT, host: "0.0.0.0" });
`;

javascriptSyntaxCheck(finalNodeApp, "assembled final Node.js workshop app");

console.log(
  `Validated ${pythonSnippets.length} Python snippets, ${nodeSnippets.length} Node.js snippets, and the assembled Python and Node.js final apps.`
);
