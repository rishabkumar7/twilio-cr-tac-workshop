const chapters = [
  {
    title: "Mission Briefing",
    summary: "Understand what we are building and get set up.",
    badge: "MB",
    intro:
      "You will build a Python voice AI agent that answers a real phone call, receives caller speech as text, asks Gemini Flash for the next response, and sends text back to Twilio to be spoken aloud.",
    flow: {
      python: [
        ["Call", "A caller dials your Twilio number."],
        ["TwiML", "FastAPI returns ConversationRelay instructions."],
        ["Relay", "Twilio sends transcribed speech over WebSocket."],
        ["Gemini", "Your server asks Gemini Flash for a reply."],
        ["Voice", "Twilio speaks the reply back to the caller."]
      ],
      node: [
        ["Call", "A caller dials your Twilio number."],
        ["TwiML", "Fastify returns ConversationRelay instructions."],
        ["Relay", "Twilio sends transcribed speech over WebSocket."],
        ["Gemini", "Your server asks Gemini Flash for a reply."],
        ["Voice", "Twilio speaks the reply back to the caller."]
      ]
    },
    steps: [
      {
        title: "What We're Building",
        body:
          "The end state is a small FastAPI app with two endpoints: a TwiML route that starts ConversationRelay and a WebSocket route that handles the live conversation loop.",
        instructions: [
          "Start with the reference repo open in a separate tab.",
          "Keep this workshop tab open as your checklist and code guide.",
          "Use the builder drawer to choose the agent name, persona, voice, tools, and handoff behavior you want."
        ],
        codeLabel: "Reference repo",
        code: "https://github.com/rishabkumar7/twilio-cr-gemini-python"
      },
      {
        title: "How It Works",
        body:
          "Have the accounts and local tools ready before the room starts typing code. This keeps the workshop focused on the agent loop instead of setup drift.",
        instructions: [
          "Python 3.10 or newer.",
          "A Twilio account and a voice-capable Twilio phone number.",
          "A Google AI Studio API key.",
          "ngrok or another HTTPS tunnel that can forward to port 8080."
        ],
        codeLabel: "Accounts",
        code: "Twilio Console: https://console.twilio.com\nGoogle AI Studio: https://aistudio.google.com\nngrok: https://ngrok.com"
      },
      {
        title: "Conversation Flow",
        body:
          "For a classroom setting, Codespaces removes most laptop differences. If attendees prefer local work, the same commands work in a terminal.",
        instructions: [
          "Open the repo in GitHub Codespaces or clone it locally.",
          "Let the environment warm up while you continue through the briefing.",
          "Confirm you can see main.py, requirements.txt, and .env.example."
        ],
        codeLabel: "Clone locally",
        code: "git clone https://github.com/rishabkumar7/twilio-cr-gemini-python\ncd twilio-cr-gemini-python"
      },
      {
        title: "Open Codespace",
        body:
          "Create a virtual environment so the workshop dependencies stay isolated from other Python projects on the machine.",
        instructions: [
          "Create and activate a virtual environment.",
          "Install the Python packages from the repo.",
          "Keep the terminal open because you will reuse it for the app server."
        ],
        codeLabel: "Terminal",
        code:
          "python3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install --upgrade pip\npip install -r requirements.txt"
      },
      {
        title: "Verify Setup",
        body:
          "Before connecting Twilio, make sure the environment variables file exists and the app can import its dependencies.",
        instructions: [
          "Copy .env.example to .env.",
          "Add your Google API key.",
          "Leave NGROK_URL blank until your tunnel is running."
        ],
        codeLabel: ".env",
        code: "GOOGLE_API_KEY=\"your-google-ai-api-key\"\nNGROK_URL=\"\""
      }
    ],
    quiz: {
      question: "Which server endpoint receives the live ConversationRelay messages?",
      options: ["/twiml", "/ws", "/health"],
      answer: "/ws"
    }
  },
  {
    title: "First Contact",
    summary: "Make your first AI-powered phone call.",
    badge: "FC",
    intro:
      "This chapter makes Twilio call your app. The agent will not be smart yet, but the phone call will reach your server and open the live relay channel.",
    steps: [
      {
        title: "The Server",
        body:
          "FastAPI serves the webhook and owns the WebSocket. The root route is only a quick sanity check for you and the instructor.",
        instructions: [
          "Open main.py.",
          "Keep the imports small at first.",
          "Add a root route so you can prove the app is running before wiring Twilio."
        ],
        codeLabel: "main.py",
        code:
          "import json\nimport os\n\nfrom dotenv import load_dotenv\nfrom fastapi import FastAPI, WebSocket, WebSocketDisconnect\nfrom fastapi.responses import Response\n\nload_dotenv()\n\nPORT = int(os.getenv(\"PORT\", \"8080\"))\nDOMAIN = os.getenv(\"NGROK_URL\")\nWS_URL = f\"wss://{DOMAIN}/ws\" if DOMAIN else \"\"\nWELCOME_GREETING = \"Hi! I am your workshop voice agent. Ask me anything!\"\n\napp = FastAPI()\n\n@app.get(\"/\")\ndef health_check():\n    return {\"ok\": True, \"service\": \"twilio-gemini-voice-agent\"}"
      },
      {
        title: "Starting the Call",
        body:
          "When Twilio receives a phone call, it requests this route. The response tells Twilio to connect the call to your WebSocket.",
        instructions: [
          "Read NGROK_URL from the environment.",
          "Return XML with the correct content type.",
          "Use wss for the WebSocket URL because Twilio needs a secure socket."
        ],
        codeLabel: "main.py",
        code:
          "@app.post(\"/twiml\")\nasync def twiml_endpoint():\n    if not WS_URL:\n        raise ValueError(\"NGROK_URL environment variable not set.\")\n\n    xml = f\"\"\"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n  <Connect>\n    <ConversationRelay url=\"{WS_URL}\" welcomeGreeting=\"{WELCOME_GREETING}\" />\n  </Connect>\n</Response>\n\"\"\".strip()\n    return Response(content=xml, media_type=\"text/xml\")"
      },
      {
        title: "Listening to the Caller",
        body:
          "The WebSocket route is where ConversationRelay events arrive. For now, log messages and send a simple greeting back.",
        instructions: [
          "Accept the socket.",
          "Receive JSON messages in a loop.",
          "Send a text message back to Twilio when the session starts."
        ],
        codeLabel: "main.py",
        code:
          "@app.websocket(\"/ws\")\nasync def websocket_endpoint(websocket: WebSocket):\n    await websocket.accept()\n\n    try:\n        while True:\n            data = await websocket.receive_text()\n            message = json.loads(data)\n            print(\"ConversationRelay message:\", message)\n\n            if message.get(\"type\") == \"prompt\":\n                await websocket.send_text(json.dumps({\n                    \"type\": \"text\",\n                    \"token\": \"I heard you. Gemini comes online in the next chapter.\",\n                    \"last\": True,\n                }))\n    except WebSocketDisconnect:\n        print(\"WebSocket disconnected\")"
      },
      {
        title: "The AI Responds",
        body:
          "The app runs on port 8080 and ngrok gives Twilio a public HTTPS hostname that forwards to your local server.",
        instructions: [
          "Start ngrok in one terminal.",
          "Copy only the hostname from the https forwarding URL into NGROK_URL.",
          "Start the FastAPI app in another terminal."
        ],
        codeLabel: "Terminal",
        code:
          "ngrok http 8080\n\n# in .env, use the domain without https://\nNGROK_URL=\"your-ngrok-domain.ngrok-free.app\"\n\nuvicorn main:app --host 0.0.0.0 --port 8080 --reload"
      },
      {
        title: "Make Your First Call",
        body:
          "The number's voice webhook points at /twiml. Every inbound call will now ask your app what to do.",
        instructions: [
          "Open the Twilio Console phone number settings.",
          "Under voice configuration, set 'A call comes in' to your ngrok HTTPS URL with /twiml.",
          "Save the number and place a test call."
        ],
        codeLabel: "Webhook URL",
        code: "https://your-ngrok-domain.ngrok-free.app/twiml"
      }
    ],
    quiz: {
      question: "What URL scheme should ConversationRelay use for the live socket?",
      options: ["http", "wss", "ftp"],
      answer: "wss"
    }
  },
  {
    title: "Identity",
    summary: "Give the agent a model, memory, and personality.",
    badge: "ID",
    intro:
      "Now the phone call gets intelligence. You will configure Gemini Flash, preserve conversation history, and shape the agent with a practical system prompt.",
    steps: [
      {
        title: "Install the Gemini Client",
        body:
          "The Google Gen AI client lets the app call Gemini from the same server that handles the Twilio relay.",
        instructions: [
          "Confirm google-genai is listed in requirements.txt.",
          "Import the client in main.py.",
          "Create one client when the app starts."
        ],
        codeLabel: "main.py",
        code:
          "from google import genai\n\nGOOGLE_API_KEY = os.getenv(\"GOOGLE_API_KEY\")\nif not GOOGLE_API_KEY:\n    raise ValueError(\"GOOGLE_API_KEY environment variable not set.\")\n\nMODEL = os.getenv(\"GEMINI_MODEL\", \"gemini-2.5-flash\")\nAGENT_NAME = os.getenv(\"AGENT_NAME\", \"Ava\")\nclient = genai.Client(api_key=GOOGLE_API_KEY)\nsessions = {}"
      },
      {
        title: "Write the Agent Prompt",
        body:
          "Voice prompts need to be short and conversational. They should also tell the model not to produce markdown, tables, or long lists that sound awkward over the phone.",
        instructions: [
          "Use the builder drawer to generate a starting prompt.",
          "Paste the prompt into main.py.",
          "Keep responses concise because the caller is listening in real time."
        ],
        codeLabel: "main.py",
        code:
          "SYSTEM_PROMPT = f\"\"\"\nYou are {AGENT_NAME}, a helpful voice AI agent on a live phone call.\nSpeak in short, natural sentences.\nAsk one question at a time.\nDo not use markdown, bullet points, links, or code blocks.\nIf you are unsure, ask a concise clarifying question.\n\"\"\".strip()"
      },
      {
        title: "Track Conversation History",
        body:
          "The WebSocket handler owns a single call, so a plain list is enough for per-call memory. Each new phone call gets a fresh history.",
        instructions: [
          "Create a history list inside the WebSocket handler.",
          "Seed it with the system prompt.",
          "Append user and assistant turns as the call progresses."
        ],
        codeLabel: "main.py",
        code:
          "# Each active call gets its own Gemini chat session.\n# The chat object keeps turn-by-turn history for that call.\ndef start_call_session(call_sid):\n    sessions[call_sid] = client.chats.create(\n        model=MODEL,\n        config={\"system_instruction\": SYSTEM_PROMPT},\n    )\n    return sessions[call_sid]\n\n\ndef end_call_session(call_sid):\n    if call_sid in sessions:\n        sessions.pop(call_sid)"
      },
      {
        title: "Call Gemini Flash",
        body:
          "The core agent turn is a helper function: receive text, append it to history, ask Gemini, save the answer, and return the answer.",
        instructions: [
          "Keep the helper async-friendly for the WebSocket route.",
          "Set a low temperature for a workshop demo.",
          "Return a fallback phrase if Gemini returns an empty response."
        ],
        codeLabel: "main.py",
        code:
          "def ask_gemini(chat_session, caller_text):\n    response = chat_session.send_message(caller_text)\n    return (response.text or \"I am sorry, could you say that again?\").strip()"
      },
      {
        title: "Personalize with Environment Variables",
        body:
          "A workshop app should make experimentation cheap. Environment variables let attendees change the model or agent name without editing several lines of code.",
        instructions: [
          "Add optional values to .env.",
          "Read them in main.py.",
          "Use the same names in the workshop handout."
        ],
        codeLabel: ".env",
        code:
          "GOOGLE_API_KEY=\"your-google-ai-api-key\"\nNGROK_URL=\"your-ngrok-domain.ngrok-free.app\"\nGEMINI_MODEL=\"gemini-2.5-flash\"\nAGENT_NAME=\"Ava\"\nPORT=\"8080\""
      }
    ],
    quiz: {
      question: "Why keep voice responses short?",
      options: ["They are cheaper to store", "The caller is listening live", "Twilio requires one sentence"],
      answer: "The caller is listening live"
    }
  },
  {
    title: "Reflexes",
    summary: "Respond to caller turns reliably and recover from errors.",
    badge: "RF",
    intro:
      "A voice agent needs quick reflexes. This chapter handles ConversationRelay message types, extracts caller speech, returns Gemini replies, and keeps the call graceful when something breaks.",
    steps: [
      {
        title: "Handle Relay Events",
        body:
          "ConversationRelay sends JSON events. The most important event for this workshop is the text turn that contains what the caller said.",
        instructions: [
          "Print the full event shape during the first test call.",
          "Extract the caller text defensively.",
          "Ignore events that do not contain speech text."
        ],
        codeLabel: "main.py",
        code:
          "def get_caller_text(message):\n    return (\n        message.get(\"voicePrompt\")\n        or message.get(\"text\")\n        or message.get(\"transcript\")\n        or message.get(\"utterance\")\n        or \"\"\n    ).strip()"
      },
      {
        title: "Reply Through Twilio",
        body:
          "Once Gemini produces text, send it back over the same WebSocket. Twilio handles speaking that text to the caller.",
        instructions: [
          "Use a helper so all outgoing speech has one shape.",
          "Keep the response text plain.",
          "Avoid markdown or URLs unless your use case truly needs them."
        ],
        codeLabel: "main.py",
        code:
          "async def say(websocket, text):\n    await websocket.send_text(json.dumps({\n        \"type\": \"text\",\n        \"token\": text,\n        \"last\": True,\n    }))"
      },
      {
        title: "Connect the Full Loop",
        body:
          "This loop turns caller speech into Gemini output and sends the result to Twilio. It is the smallest useful agent.",
        instructions: [
          "Create conversation history after accepting the WebSocket.",
          "For each caller text turn, call Gemini.",
          "Send Gemini's reply back to Twilio."
        ],
        codeLabel: "main.py",
        code:
          "@app.websocket(\"/ws\")\nasync def websocket_endpoint(websocket: WebSocket):\n    await websocket.accept()\n    call_sid = None\n\n    try:\n        while True:\n            data = await websocket.receive_text()\n            message = json.loads(data)\n            event_type = message.get(\"type\")\n\n            if event_type == \"setup\":\n                call_sid = message.get(\"callSid\")\n                start_call_session(call_sid)\n                print(f\"Setup for call: {call_sid}\")\n\n            elif event_type == \"prompt\":\n                if not call_sid or call_sid not in sessions:\n                    print(\"Prompt received before setup\")\n                    continue\n\n                caller_text = get_caller_text(message)\n                if not caller_text:\n                    continue\n\n                chat_session = sessions[call_sid]\n                reply = ask_gemini(chat_session, caller_text)\n                await say(websocket, reply)\n\n            elif event_type == \"interrupt\":\n                print(f\"Caller interrupted response for call: {call_sid}\")\n    except WebSocketDisconnect:\n        print(f\"WebSocket disconnected for call: {call_sid}\")\n        end_call_session(call_sid)"
      },
      {
        title: "Add Error Recovery",
        body:
          "Workshop networks and API keys fail. A polite fallback keeps the call understandable and gives attendees a clear debugging signal in the terminal.",
        instructions: [
          "Wrap the model call in try and except.",
          "Log the actual exception.",
          "Tell the caller the agent needs them to repeat the request."
        ],
        codeLabel: "main.py",
        code:
          "try:\n    chat_session = sessions[call_sid]\n    reply = ask_gemini(chat_session, caller_text)\nexcept Exception as error:\n    print(\"Gemini error:\", error)\n    reply = \"I had trouble thinking through that. Could you repeat it once?\"\n\nawait say(websocket, reply)"
      },
      {
        title: "Test Latency",
        body:
          "The best workshop demo is a fast, natural exchange. Test with the phone on speaker and watch the terminal logs while the call is active.",
        instructions: [
          "Ask a short question first.",
          "Then ask a follow-up that depends on the previous answer.",
          "If the agent feels slow, shorten the prompt and reduce extra logging."
        ],
        codeLabel: "Test script",
        code:
          "Caller: What can you help me with?\nCaller: Can you remember my name is Rishab?\nCaller: What name did I give you?"
      }
    ],
    quiz: {
      question: "Where should per-call conversation history live for this app?",
      options: ["Inside the WebSocket handler", "In a global list", "In requirements.txt"],
      answer: "Inside the WebSocket handler"
    }
  },
  {
    title: "Superpowers",
    summary: "Add tools, guardrails, and human handoff.",
    badge: "SP",
    intro:
      "After the basic call works, add capabilities that make the agent useful: simple business tools, clear boundaries, and a path to a human when automation is not enough.",
    steps: [
      {
        title: "Define Workshop Tools",
        body:
          "Use deterministic Python functions for actions that should not be guessed by the model. Start with read-only lookup and a mock ticket creator.",
        instructions: [
          "Create plain Python functions first.",
          "Return small JSON-like dictionaries.",
          "Keep side effects obvious for workshop safety."
        ],
        codeLabel: "main.py",
        code:
          "def lookup_customer(phone_number):\n    return {\n        \"name\": \"Sam Rivera\",\n        \"plan\": \"Pro\",\n        \"status\": \"active\",\n    }\n\n\ndef create_ticket(summary):\n    return {\n        \"ticket_id\": \"CR-1042\",\n        \"summary\": summary,\n        \"status\": \"created\",\n    }"
      },
      {
        title: "Expose Tool Results to Gemini",
        body:
          "For a compact workshop flow, call tools from clear phrases first. This makes the concept visible before introducing advanced function calling.",
        instructions: [
          "Check caller text for a lookup or ticket intent.",
          "Add the tool result into the conversation history.",
          "Ask Gemini to explain the result naturally to the caller."
        ],
        codeLabel: "main.py",
        code:
          "def maybe_run_tool(caller_text):\n    lowered = caller_text.lower()\n    if \"look me up\" in lowered or \"my account\" in lowered:\n        return {\"tool\": \"lookup_customer\", \"result\": lookup_customer(\"caller\")}\n    if \"ticket\" in lowered or \"case\" in lowered:\n        return {\"tool\": \"create_ticket\", \"result\": create_ticket(caller_text)}\n    return None"
      },
      {
        title: "Use Tool Context",
        body:
          "The model should not invent tool results. Add the exact tool output to the prompt for the next turn and ask it to summarize plainly.",
        instructions: [
          "Run maybe_run_tool before asking Gemini.",
          "If a tool returns data, append it as context.",
          "Let Gemini turn the data into voice-friendly language."
        ],
        codeLabel: "main.py",
        code:
          "tool_event = maybe_run_tool(caller_text)\nif tool_event:\n    caller_text = (\n        f\"The caller said: {caller_text}\\n\"\n        f\"Tool result: {tool_event}\\n\"\n        \"Explain the result to the caller in one or two sentences.\"\n    )\n\nreply = ask_gemini(chat_session, caller_text)"
      },
      {
        title: "Add Handoff Language",
        body:
          "A voice agent should know when to stop. Even a demo agent needs clear escalation language for billing, safety, legal, or angry-caller scenarios.",
        instructions: [
          "Add handoff rules to the system prompt.",
          "Use a consistent phrase when handoff is needed.",
          "Log handoff requests so the class can see when they trigger."
        ],
        codeLabel: "Prompt addition",
        code:
          "If the caller asks for billing changes, legal advice, medical advice, or says they want a person, say:\n\"I can connect you with a teammate for that.\"\nThen ask for one sentence describing what they need help with."
      },
      {
        title: "Run a Capability Demo",
        body:
          "The superpower demo should prove memory, tool use, and handoff in one call without requiring real customer data.",
        instructions: [
          "Ask the agent to look up your account.",
          "Ask it to create a ticket.",
          "Ask for a human and confirm the handoff phrase appears."
        ],
        codeLabel: "Demo prompts",
        code:
          "Can you look me up?\nPlease create a ticket that my shipment arrived damaged.\nI want to talk to a person."
      }
    ],
    quiz: {
      question: "What should the model do with tool output?",
      options: ["Invent missing fields", "Summarize exact results", "Ignore it"],
      answer: "Summarize exact results"
    }
  },
  {
    title: "Launch",
    summary: "Test the whole call and package the workshop.",
    badge: "LN",
    intro:
      "The final chapter turns the prototype into a repeatable workshop finish: test paths, debugging checks, and a clear launch checklist for attendees.",
    steps: [
      {
        title: "Final Call Test",
        body:
          "Run one clean call from greeting to hangup. The goal is to verify Twilio webhook configuration, WebSocket traffic, Gemini responses, memory, and fallback behavior.",
        instructions: [
          "Restart uvicorn so the latest code is loaded.",
          "Restart ngrok only if the tunnel changed.",
          "Call the Twilio number and watch terminal logs."
        ],
        codeLabel: "Terminal",
        code: "uvicorn main:app --host 0.0.0.0 --port 8080 --reload"
      },
      {
        title: "Troubleshoot the Common Failures",
        body:
          "Most workshop failures land in three places: Twilio cannot reach the tunnel, the WebSocket URL is wrong, or the Google API key is missing.",
        instructions: [
          "If the phone call disconnects immediately, check the Twilio webhook URL.",
          "If the WebSocket never connects, check NGROK_URL and wss.",
          "If the agent greets but cannot answer, check GOOGLE_API_KEY and model name."
        ],
        codeLabel: "Checklist",
        code:
          "Webhook: https://your-ngrok-domain.ngrok-free.app/twiml\nWebSocket in TwiML: wss://your-ngrok-domain.ngrok-free.app/ws\nServer: uvicorn running on 0.0.0.0:8080\nKey: GOOGLE_API_KEY is present in .env"
      },
      {
        title: "Prepare Production Notes",
        body:
          "The workshop app is intentionally small. Production needs stronger auth, observability, retry behavior, and careful data boundaries.",
        instructions: [
          "Do not log sensitive caller data.",
          "Store secrets in a secret manager, not in .env files.",
          "Add request validation, monitoring, and rate limits before public use."
        ],
        codeLabel: "Production backlog",
        code:
          "- Validate Twilio requests\n- Use managed secrets\n- Add structured logs and traces\n- Persist conversation state only when needed\n- Add consent and data retention language\n- Load test peak call volume"
      },
      {
        title: "Share the Attendee Finish Line",
        body:
          "Make the final state visible so every attendee knows what done looks like before they leave the room.",
        instructions: [
          "The caller can ask a question and receive a Gemini answer.",
          "The caller can ask a follow-up and the agent remembers context.",
          "The caller can trigger one tool and one handoff path."
        ],
        codeLabel: "Done statement",
        code:
          "I built a Twilio voice AI agent with FastAPI, ConversationRelay, and Gemini Flash. It answers a real phone call, keeps short call memory, uses simple tools, and knows when to hand off."
      },
      {
        title: "Reset for the Next Workshop",
        body:
          "After the room finishes, clean up anything that should not stay running and make the next run easy to repeat.",
        instructions: [
          "Stop uvicorn and ngrok.",
          "Rotate any exposed API keys.",
          "Export this workshop app with the repo or publish it as a static page."
        ],
        codeLabel: "Cleanup",
        code:
          "deactivate\n# Stop ngrok with Ctrl+C in its terminal\n# Stop uvicorn with Ctrl+C in its terminal"
      }
    ],
    quiz: {
      question: "What is the clearest signal that the workshop is complete?",
      options: ["The repo cloned", "A real call works end to end", "The CSS loaded"],
      answer: "A real call works end to end"
    }
  }
];

const nodeCodeOverrides = {
  "0:2": {
    label: "Node.js project",
    code:
      "mkdir twilio-cr-gemini-node\ncd twilio-cr-gemini-node\nnpm init -y\nnpm pkg set type=module scripts.start=\"node server.js\""
  },
  "0:3": {
    label: "Terminal",
    code: "npm install fastify @fastify/websocket dotenv @google/genai"
  },
  "0:4": {
    label: ".env",
    code: "GOOGLE_API_KEY=\"your-google-ai-api-key\"\nNGROK_URL=\"\"\nPORT=\"8080\""
  },
  "1:0": {
    label: "server.js",
    code:
      "import \"dotenv/config\";\nimport Fastify from \"fastify\";\nimport websocket from \"@fastify/websocket\";\n\nconst PORT = Number(process.env.PORT || 8080);\nconst DOMAIN = process.env.NGROK_URL;\nconst WS_URL = DOMAIN ? `wss://${DOMAIN}/ws` : \"\";\nconst WELCOME_GREETING = \"Hi! I am your workshop voice agent. Ask me anything!\";\n\nconst fastify = Fastify({ logger: true });\nawait fastify.register(websocket);\n\nfastify.get(\"/\", async () => {\n  return { ok: true, service: \"twilio-gemini-voice-agent\" };\n});"
  },
  "1:1": {
    label: "server.js",
    code:
      "fastify.post(\"/twiml\", async (request, reply) => {\n  if (!WS_URL) {\n    throw new Error(\"NGROK_URL environment variable not set.\");\n  }\n\n  const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n  <Connect>\n    <ConversationRelay url=\"${WS_URL}\" welcomeGreeting=\"${WELCOME_GREETING}\" />\n  </Connect>\n</Response>`;\n\n  return reply.type(\"text/xml\").send(xml);\n});"
  },
  "1:2": {
    label: "server.js",
    code:
      "fastify.get(\"/ws\", { websocket: true }, (connection) => {\n  const ws = connection.socket ?? connection;\n\n  ws.on(\"message\", (raw) => {\n    const message = JSON.parse(raw.toString());\n    console.log(\"ConversationRelay message:\", message);\n\n    if (message.type === \"prompt\") {\n      ws.send(JSON.stringify({\n        type: \"text\",\n        token: \"I heard you. Gemini comes online in the next chapter.\",\n        last: true,\n      }));\n    }\n  });\n\n  ws.on(\"close\", () => {\n    console.log(\"WebSocket disconnected\");\n  });\n});"
  },
  "1:3": {
    label: "Terminal",
    code:
      "ngrok http 8080\n\n# in .env, use the domain without https://\nNGROK_URL=\"your-ngrok-domain.ngrok-free.app\"\n\nnpm start"
  },
  "2:0": {
    label: "server.js",
    code:
      "import { GoogleGenAI } from \"@google/genai\";\n\nconst GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;\nif (!GOOGLE_API_KEY) {\n  throw new Error(\"GOOGLE_API_KEY environment variable not set.\");\n}\n\nconst MODEL = process.env.GEMINI_MODEL || \"gemini-2.5-flash\";\nconst AGENT_NAME = process.env.AGENT_NAME || \"Ava\";\nconst ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });\nconst sessions = new Map();"
  },
  "2:1": {
    label: "server.js",
    code:
      "const SYSTEM_PROMPT = `\nYou are ${AGENT_NAME}, a helpful voice AI agent on a live phone call.\nSpeak in short, natural sentences.\nAsk one question at a time.\nDo not use markdown, bullet points, links, or code blocks.\nIf you are unsure, ask a concise clarifying question.\n`.trim();"
  },
  "2:2": {
    label: "server.js",
    code:
      "function startCallSession(callSid) {\n  const chat = ai.chats.create({\n    model: MODEL,\n    config: { systemInstruction: SYSTEM_PROMPT },\n  });\n  sessions.set(callSid, chat);\n  return chat;\n}\n\nfunction endCallSession(callSid) {\n  sessions.delete(callSid);\n}"
  },
  "2:3": {
    label: "server.js",
    code:
      "async function askGemini(chatSession, callerText) {\n  const response = await chatSession.sendMessage({ message: callerText });\n  return (response.text || \"I am sorry, could you say that again?\").trim();\n}"
  },
  "2:4": {
    label: ".env",
    code:
      "GOOGLE_API_KEY=\"your-google-ai-api-key\"\nNGROK_URL=\"your-ngrok-domain.ngrok-free.app\"\nGEMINI_MODEL=\"gemini-2.5-flash\"\nAGENT_NAME=\"Ava\"\nPORT=\"8080\""
  },
  "3:0": {
    label: "server.js",
    code:
      "function getCallerText(message) {\n  return (\n    message.voicePrompt ||\n    message.text ||\n    message.transcript ||\n    message.utterance ||\n    \"\"\n  ).trim();\n}"
  },
  "3:1": {
    label: "server.js",
    code:
      "function say(ws, text) {\n  ws.send(JSON.stringify({\n    type: \"text\",\n    token: text,\n    last: true,\n  }));\n}"
  },
  "3:2": {
    label: "server.js",
    code:
      "fastify.get(\"/ws\", { websocket: true }, (connection) => {\n  const ws = connection.socket ?? connection;\n  let callSid = null;\n\n  ws.on(\"message\", async (raw) => {\n    const message = JSON.parse(raw.toString());\n    const eventType = message.type;\n\n    if (eventType === \"setup\") {\n      callSid = message.callSid;\n      startCallSession(callSid);\n      console.log(`Setup for call: ${callSid}`);\n    } else if (eventType === \"prompt\") {\n      if (!callSid || !sessions.has(callSid)) {\n        console.log(\"Prompt received before setup\");\n        return;\n      }\n\n      const callerText = getCallerText(message);\n      if (!callerText) return;\n\n      const chatSession = sessions.get(callSid);\n      const reply = await askGemini(chatSession, callerText);\n      say(ws, reply);\n    } else if (eventType === \"interrupt\") {\n      console.log(`Caller interrupted response for call: ${callSid}`);\n    }\n  });\n\n  ws.on(\"close\", () => {\n    console.log(`WebSocket disconnected for call: ${callSid}`);\n    endCallSession(callSid);\n  });\n});"
  },
  "3:3": {
    label: "server.js",
    code:
      "try {\n  const chatSession = sessions.get(callSid);\n  reply = await askGemini(chatSession, callerText);\n} catch (error) {\n  console.error(\"Gemini error:\", error);\n  reply = \"I had trouble thinking through that. Could you repeat it once?\";\n}\n\nsay(ws, reply);"
  },
  "4:0": {
    label: "server.js",
    code:
      "function lookupCustomer(phoneNumber) {\n  return {\n    name: \"Sam Rivera\",\n    plan: \"Pro\",\n    status: \"active\",\n  };\n}\n\nfunction createTicket(summary) {\n  return {\n    ticketId: \"CR-1042\",\n    summary,\n    status: \"created\",\n  };\n}"
  },
  "4:1": {
    label: "server.js",
    code:
      "function maybeRunTool(callerText) {\n  const lowered = callerText.toLowerCase();\n  if (lowered.includes(\"look me up\") || lowered.includes(\"my account\")) {\n    return { tool: \"lookupCustomer\", result: lookupCustomer(\"caller\") };\n  }\n  if (lowered.includes(\"ticket\") || lowered.includes(\"case\")) {\n    return { tool: \"createTicket\", result: createTicket(callerText) };\n  }\n  return null;\n}"
  },
  "4:2": {
    label: "server.js",
    code:
      "const toolEvent = maybeRunTool(callerText);\nif (toolEvent) {\n  callerText = [\n    `The caller said: ${callerText}`,\n    `Tool result: ${JSON.stringify(toolEvent)}`,\n    \"Explain the result to the caller in one or two sentences.\",\n  ].join(\"\\n\");\n}\n\nconst reply = await askGemini(chatSession, callerText);"
  },
  "5:0": {
    label: "Terminal",
    code: "npm start"
  },
  "5:1": {
    label: "Checklist",
    code:
      "Webhook: https://your-ngrok-domain.ngrok-free.app/twiml\nWebSocket in TwiML: wss://your-ngrok-domain.ngrok-free.app/ws\nServer: npm start running on 0.0.0.0:8080\nKey: GOOGLE_API_KEY is present in .env"
  },
  "5:4": {
    label: "Cleanup",
    code:
      "# Stop ngrok with Ctrl+C in its terminal\n# Stop npm start with Ctrl+C in its terminal"
  }
};

const nodeTextOverrides = {
  "0:0": {
    body:
      "The Node.js end state is a small Fastify app with two routes: a TwiML route that starts ConversationRelay and a WebSocket route that handles the live conversation loop.",
    instructions: [
      "Start with the Python reference repo open in a separate tab for behavior comparison.",
      "Keep this workshop tab open as your checklist and code guide.",
      "Use the builder drawer to choose the agent name, persona, voice, tools, and handoff behavior you want."
    ]
  },
  "0:1": {
    instructions: [
      "Node.js 20 or newer.",
      "A Twilio account and a voice-capable Twilio phone number.",
      "A Google AI Studio API key.",
      "ngrok or another HTTPS tunnel that can forward to port 8080."
    ]
  },
  "0:2": {
    body:
      "For the Node.js path, create a fresh project next to the reference repo. This keeps the workshop focused on translating the same call flow into Fastify.",
    instructions: [
      "Create a new Node.js project folder.",
      "Enable ES modules.",
      "Add a start script that runs server.js."
    ]
  },
  "0:3": {
    body:
      "Install the Node.js packages that replace FastAPI, Python dotenv, and the Python Gemini client.",
    instructions: [
      "Install Fastify and its WebSocket plugin.",
      "Install dotenv for local environment variables.",
      "Install the Google Gen AI SDK for Gemini."
    ]
  },
  "0:4": {
    instructions: [
      "Create .env in the Node.js project.",
      "Add your Google API key.",
      "Leave NGROK_URL blank until your tunnel is running."
    ]
  },
  "1:0": {
    body:
      "Fastify serves the webhook and owns the WebSocket. The root route is only a quick sanity check for you and the instructor.",
    instructions: [
      "Open server.js.",
      "Import Fastify, the WebSocket plugin, and dotenv.",
      "Add a root route so you can prove the app is running before wiring Twilio."
    ]
  },
  "1:3": {
    instructions: [
      "Start ngrok in one terminal.",
      "Copy only the hostname from the https forwarding URL into NGROK_URL.",
      "Start the Node.js app in another terminal."
    ]
  },
  "2:0": {
    instructions: [
      "Confirm @google/genai is installed.",
      "Import the client in server.js.",
      "Create one client when the app starts."
    ]
  },
  "2:2": {
    body:
      "The WebSocket handler owns a single call, so a Map keyed by callSid is enough for per-call memory. Each new phone call gets a fresh chat session.",
    instructions: [
      "Create a Gemini chat session when setup arrives.",
      "Store it in a Map by callSid.",
      "Delete it when the WebSocket closes."
    ]
  },
  "3:2": {
    instructions: [
      "Create the chat session after the setup event.",
      "For each caller text turn, call Gemini.",
      "Send Gemini's reply back to Twilio."
    ]
  },
  "4:0": {
    body:
      "Use deterministic JavaScript functions for actions that should not be guessed by the model. Start with read-only lookup and a mock ticket creator.",
    instructions: [
      "Create plain JavaScript functions first.",
      "Return small JSON-like objects.",
      "Keep side effects obvious for workshop safety."
    ]
  },
  "5:0": {
    instructions: [
      "Restart npm start so the latest code is loaded.",
      "Restart ngrok only if the tunnel changed.",
      "Call the Twilio number and watch terminal logs."
    ]
  },
  "5:3": {
    code:
      "I built a Twilio voice AI agent with Node.js, Fastify, ConversationRelay, and Gemini Flash. It answers a real phone call, keeps short call memory, uses simple tools, and knows when to hand off."
  },
  "5:4": {
    instructions: [
      "Stop npm start and ngrok.",
      "Rotate any exposed API keys.",
      "Export this workshop app with the repo or publish it as a static page."
    ]
  }
};

const storageKey = "twilio-cr-tac-state-v1";
const defaultBuilder = {
  name: "Ava",
  persona: "Helpful retail concierge",
  voice: "Google TTS",
  language: "en-US",
  model: "gemini-2.5-flash",
  toolLookup: true,
  toolTicket: true,
  handoff: true
};

const state = loadState();
let activeChapter = state.activeChapter || 0;
let activeStep = state.activeStep || 0;

const chapterTabs = document.querySelector("#chapterTabs");
const stepList = document.querySelector("#stepList");
const chapterKicker = document.querySelector("#chapterKicker");
const chapterTitle = document.querySelector("#chapterTitle");
const chapterSummary = document.querySelector("#chapterSummary");
const chapterContent = document.querySelector("#chapterContent");
const content = document.querySelector("#content");
const progressFill = document.querySelector("#progressFill");
const progressLabel = document.querySelector("#progressLabel");
const badgeList = document.querySelector("#badgeList");
const builderPanel = document.querySelector("#builderPanel");
const builderToggle = document.querySelector("#builderToggle");
const builderForm = document.querySelector("#builderForm");
const prevStepButton = document.querySelector("#prevStep");
const nextStepButton = document.querySelector("#nextStep");
const runtimeButtons = document.querySelectorAll("[data-runtime]");
const THREE_MODULE_URL = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
let threeModule = null;
let threeSceneCleanup = [];

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      completed: parsed.completed || {},
      activeChapter: parsed.activeChapter || 0,
      activeStep: parsed.activeStep || 0,
      builder: { ...defaultBuilder, ...(parsed.builder || {}) },
      runtime: parsed.runtime === "node" ? "node" : "python",
      theme: parsed.theme || "dark"
    };
  } catch {
    return { completed: {}, builder: { ...defaultBuilder }, runtime: "python", theme: "dark" };
  }
}

function saveState() {
  state.activeChapter = activeChapter;
  state.activeStep = activeStep;
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function renderRuntimeSwitch() {
  runtimeButtons.forEach((button) => {
    const active = button.dataset.runtime === state.runtime;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function stepKey(chapterIndex, stepIndex) {
  return `${chapterIndex}:${stepIndex}`;
}

function isStepDone(chapterIndex, stepIndex) {
  return Boolean(state.completed[stepKey(chapterIndex, stepIndex)]);
}

function isChapterDone(chapterIndex) {
  return chapters[chapterIndex].steps.every((_, stepIndex) => isStepDone(chapterIndex, stepIndex));
}

function totalStepCount() {
  return chapters.reduce((sum, chapter) => sum + chapter.steps.length, 0);
}

function completedStepCount() {
  return Object.values(state.completed).filter(Boolean).length;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRuntimeStep(step, chapterIndex = activeChapter, stepIndex = activeStep) {
  if (state.runtime !== "node") return step;

  const key = stepKey(chapterIndex, stepIndex);
  const textOverride = nodeTextOverrides[key] || {};
  const codeOverride = nodeCodeOverrides[key];
  return {
    ...step,
    ...textOverride,
    ...(codeOverride ? { codeLabel: codeOverride.label, code: codeOverride.code } : {})
  };
}

const lucideIcons = {
  bot:
    '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M9 13v2"/><path d="M15 13v2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  github:
    '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  circle: '<circle cx="12" cy="12" r="10"/>',
  "code-xml": '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  copy:
    '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  "phone-call":
    '<path d="M13 2a9 9 0 0 1 9 9"/><path d="M13 6a5 5 0 0 1 5 5"/><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  radio:
    '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2a6 6 0 0 1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.5"/><path d="M19.1 4.9c3.9 3.9 3.9 10.2 0 14.1"/>',
  "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  server: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  settings:
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  "sun-moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/>',
  terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
};

function icon(name) {
  const body = lucideIcons[name] || lucideIcons.circle;
  return `<svg class="lucide lucide-${escapeHtml(name)}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

function refreshIcons() {
  document.querySelectorAll("[data-icon]").forEach((placeholder) => {
    placeholder.outerHTML = icon(placeholder.dataset.icon);
  });
}

function getCodeLanguage(label, code) {
  const normalized = label.toLowerCase();
  if (normalized.endsWith(".py") || code.includes("from fastapi") || code.includes("@app.")) return "python";
  if (
    normalized.endsWith(".js") ||
    code.includes("import Fastify") ||
    code.includes("@google/genai") ||
    code.includes("function ") ||
    code.includes("const ")
  ) {
    return "javascript";
  }
  if (normalized === ".env" || /^[A-Z0-9_]+=/.test(code.trim())) return "env";
  if (
    ["terminal", "clone locally", "cleanup", "node.js project"].includes(normalized) ||
    /^(cd|deactivate|git|mkdir|ngrok|npm|pip|python|python3|source|uvicorn)\b/m.test(code.trim())
  ) {
    return "bash";
  }
  if (normalized.includes("url") || normalized.includes("repo") || /^https?:\/\//.test(code.trim())) return "url";
  return "text";
}

function findCommentStart(line) {
  let quote = "";
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const previous = line[index - 1];
    if ((character === '"' || character === "'") && previous !== "\\") {
      quote = quote === character ? "" : quote || character;
    }
    if (character === "#" && !quote) return index;
  }
  return -1;
}

function highlightToken(value, type) {
  return `<span class="syntax-${type}">${escapeHtml(value)}</span>`;
}

function highlightPythonSegment(segment) {
  const tokenPattern =
    /(@[A-Za-z_]\w*|\b(?:async|await|break|class|continue|def|elif|else|except|finally|for|from|if|import|in|is|not|or|pass|return|try|while|with|as|and)\b|\b(?:True|False|None)\b|\b[A-Z_]{3,}\b|\b\d+(?:\.\d+)?\b)/g;
  let html = "";
  let cursor = 0;
  for (const match of segment.matchAll(tokenPattern)) {
    html += escapeHtml(segment.slice(cursor, match.index));
    const value = match[0];
    const type =
      value.startsWith("@") ? "decorator" : /^(True|False|None)$/.test(value) ? "literal" : /^[A-Z_]{3,}$/.test(value) ? "constant" : /^\d/.test(value) ? "number" : "keyword";
    html += highlightToken(value, type);
    cursor = match.index + value.length;
  }
  html += escapeHtml(segment.slice(cursor));
  return html;
}

function highlightStringAware(line, segmentHighlighter) {
  const stringPattern = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
  let html = "";
  let cursor = 0;
  for (const match of line.matchAll(stringPattern)) {
    html += segmentHighlighter(line.slice(cursor, match.index));
    html += highlightToken(match[0], "string");
    cursor = match.index + match[0].length;
  }
  html += segmentHighlighter(line.slice(cursor));
  return html;
}

function highlightPythonLine(line) {
  const commentStart = findCommentStart(line);
  const code = commentStart >= 0 ? line.slice(0, commentStart) : line;
  const comment = commentStart >= 0 ? line.slice(commentStart) : "";
  return `${highlightStringAware(code, highlightPythonSegment)}${comment ? highlightToken(comment, "comment") : ""}`;
}

function findSlashCommentStart(line) {
  let quote = "";
  let escaped = false;
  for (let index = 0; index < line.length - 1; index += 1) {
    const character = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if ((character === '"' || character === "'" || character === "`") && !quote) {
      quote = character;
      continue;
    }
    if (character === quote) {
      quote = "";
      continue;
    }
    if (!quote && character === "/" && line[index + 1] === "/") return index;
  }
  return -1;
}

function highlightJavaScriptSegment(segment) {
  const tokenPattern =
    /(\b(?:async|await|break|case|catch|class|const|continue|default|else|export|finally|for|from|function|if|import|in|let|new|null|of|return|throw|try|while)\b|\b(?:true|false|null|undefined)\b|\b[A-Z_]{3,}\b|\b\d+(?:\.\d+)?\b)/g;
  let html = "";
  let cursor = 0;
  for (const match of segment.matchAll(tokenPattern)) {
    html += escapeHtml(segment.slice(cursor, match.index));
    const value = match[0];
    const type =
      /^(true|false|null|undefined)$/.test(value) ? "literal" : /^[A-Z_]{3,}$/.test(value) ? "constant" : /^\d/.test(value) ? "number" : "keyword";
    html += highlightToken(value, type);
    cursor = match.index + value.length;
  }
  html += escapeHtml(segment.slice(cursor));
  return html;
}

function highlightJavaScriptLine(line) {
  const commentStart = findSlashCommentStart(line);
  const code = commentStart >= 0 ? line.slice(0, commentStart) : line;
  const comment = commentStart >= 0 ? line.slice(commentStart) : "";
  return `${highlightStringAware(code, highlightJavaScriptSegment)}${comment ? highlightToken(comment, "comment") : ""}`;
}

function highlightBashLine(line) {
  const commentStart = line.trimStart().startsWith("#") ? line.indexOf("#") : -1;
  const code = commentStart >= 0 ? line.slice(0, commentStart) : line;
  const commandPattern = /(\b(?:cd|cp|curl|echo|export|git|mkdir|ngrok|npm|pip|python|python3|source|uvicorn)\b|--?[A-Za-z0-9-]+|https?:\/\/[^\s]+)/g;
  const highlighted = highlightStringAware(code, (segment) => {
    let html = "";
    let cursor = 0;
    for (const match of segment.matchAll(commandPattern)) {
      html += escapeHtml(segment.slice(cursor, match.index));
      const value = match[0];
      const type = value.startsWith("-") ? "option" : value.startsWith("http") ? "url" : "keyword";
      html += highlightToken(value, type);
      cursor = match.index + value.length;
    }
    html += escapeHtml(segment.slice(cursor));
    return html;
  });
  return `${highlighted}${commentStart >= 0 ? highlightToken(line.slice(commentStart), "comment") : ""}`;
}

function highlightEnvLine(line) {
  const match = line.match(/^([A-Z0-9_]+)(=)(.*)$/);
  if (!match) return escapeHtml(line);
  return `${highlightToken(match[1], "constant")}${escapeHtml(match[2])}${highlightStringAware(match[3], (segment) => escapeHtml(segment))}`;
}

function highlightPlainLine(line) {
  return escapeHtml(line).replace(/(https?:\/\/[^\s<]+)/g, '<span class="syntax-url">$1</span>');
}

function highlightCode(code, language) {
  return code
    .split("\n")
    .map((line) => {
      if (language === "python") return highlightPythonLine(line);
      if (language === "javascript") return highlightJavaScriptLine(line);
      if (language === "bash") return highlightBashLine(line);
      if (language === "env") return highlightEnvLine(line);
      return highlightPlainLine(line);
    })
    .join("\n");
}

function renderChapterTabs() {
  chapterTabs.innerHTML = chapters
    .map((chapter, index) => {
      const complete = isChapterDone(index);
      const current = index === activeChapter;
      const number = complete ? icon("check") : index + 1;
      return `
        <button class="chapter-tab ${complete ? "is-complete" : ""}" type="button" data-chapter="${index}" aria-current="${current}">
          <span class="chapter-number">${number}</span>
          <span>${escapeHtml(chapter.title)}</span>
        </button>
      `;
    })
    .join("");
}

function renderSideRail() {
  const chapter = chapters[activeChapter];
  chapterKicker.textContent = `Chapter ${activeChapter + 1}`;
  chapterTitle.textContent = chapter.title;
  chapterSummary.textContent = chapter.summary;

  stepList.innerHTML = chapter.steps
    .map((step, index) => {
      const done = isStepDone(activeChapter, index);
      const current = index === activeStep;
      return `
        <button class="step-link ${done ? "is-done" : ""}" type="button" data-step="${index}" aria-current="${current}">
          <span class="step-state">${done ? icon("check") : index + 1}</span>
          <span>${escapeHtml(step.title)}</span>
        </button>
      `;
    })
    .join("");
}

function renderVoiceVisual() {
  const serverLabel = state.runtime === "node" ? "Fastify Server" : "FastAPI Server";
  return `
    <div class="mission-overview" aria-label="Voice AI agent system overview">
      <div class="chapter-kicker">System overview</div>
      <svg class="mission-overview-svg" viewBox="0 0 940 360" role="img" aria-label="Caller reaches Twilio Voice, ConversationRelay opens a WebSocket to your ${escapeHtml(serverLabel)}, the server asks Gemini Flash and tools, then Twilio speaks the response back.">
        <defs>
          <marker id="missionArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0 0 L10 5 L0 10z" class="mission-arrow-head" />
          </marker>
          <filter id="missionGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g class="mission-lines">
          <path d="M172 135 H260" marker-end="url(#missionArrow)" />
          <path d="M430 135 H590" marker-end="url(#missionArrow)" />
          <path d="M704 188 C688 226 640 255 585 267" marker-end="url(#missionArrow)" />
          <path d="M760 188 V238" marker-end="url(#missionArrow)" />
          <path class="mission-return" d="M590 182 C540 212 480 212 430 182" marker-end="url(#missionArrow)" />
          <path class="mission-return" d="M260 182 C220 212 184 212 172 174" marker-end="url(#missionArrow)" />
          <text x="190" y="116">phone call</text>
          <text x="462" y="116">WebSocket text</text>
          <text x="606" y="246">tool context</text>
          <text x="778" y="220">prompt</text>
          <text x="482" y="234">text reply</text>
          <text x="186" y="234">spoken reply</text>
        </g>

        <g class="mission-packets">
          <circle class="mission-packet mission-packet-in" r="5">
            <animateMotion dur="2.8s" repeatCount="indefinite" path="M172 135 H260" />
          </circle>
          <circle class="mission-packet mission-packet-in" r="5">
            <animateMotion dur="3.2s" begin="-1.2s" repeatCount="indefinite" path="M430 135 H590" />
          </circle>
          <circle class="mission-packet mission-packet-ai" r="5">
            <animateMotion dur="2.6s" begin="-0.6s" repeatCount="indefinite" path="M760 188 V238" />
          </circle>
          <circle class="mission-packet mission-packet-out" r="5">
            <animateMotion dur="2.5s" begin="-0.9s" repeatCount="indefinite" path="M590 182 C540 212 480 212 430 182" />
          </circle>
          <circle class="mission-packet mission-packet-out" r="5">
            <animateMotion dur="2.4s" begin="-1.5s" repeatCount="indefinite" path="M260 182 C220 212 184 212 172 174" />
          </circle>
        </g>

        <g class="mission-node" transform="translate(44 96)">
          <rect width="124" height="80" rx="18" />
          <foreignObject x="48" y="16" width="28" height="28">
            <div xmlns="http://www.w3.org/1999/xhtml" class="arch-lucide-icon">${icon("smartphone")}</div>
          </foreignObject>
          <text x="62" y="58" text-anchor="middle">Caller</text>
        </g>

        <g class="mission-node" transform="translate(260 84)">
          <rect width="150" height="96" rx="18" />
          <foreignObject x="56" y="14" width="38" height="38">
            <div xmlns="http://www.w3.org/1999/xhtml" class="arch-lucide-icon arch-lucide-icon-large">${icon("phone-call")}</div>
          </foreignObject>
          <text x="75" y="67" text-anchor="middle">Twilio Voice</text>
          <text x="75" y="86" text-anchor="middle" class="mission-node-small">ConversationRelay</text>
        </g>

        <g class="mission-node mission-node-hot" transform="translate(590 70)" filter="url(#missionGlow)">
          <rect width="220" height="118" rx="22" />
          <foreignObject x="88" y="18" width="34" height="34">
            <div xmlns="http://www.w3.org/1999/xhtml" class="arch-lucide-icon arch-lucide-icon-hot">${icon("server")}</div>
          </foreignObject>
          <text x="110" y="72" text-anchor="middle">${escapeHtml(serverLabel)}</text>
          <text x="110" y="94" text-anchor="middle" class="mission-node-small">/twiml + /ws</text>
        </g>

        <g class="mission-node mission-node-muted" transform="translate(405 236)">
          <rect width="180" height="78" rx="18" />
          <foreignObject x="33" y="22" width="30" height="30">
            <div xmlns="http://www.w3.org/1999/xhtml" class="arch-lucide-icon">${icon("wrench")}</div>
          </foreignObject>
          <text x="108" y="42" text-anchor="middle">Tools</text>
          <text x="108" y="60" text-anchor="middle" class="mission-node-small">lookup, tickets</text>
        </g>

        <g class="mission-node mission-node-gemini" transform="translate(690 238)">
          <rect width="180" height="76" rx="18" />
          <image class="arch-gemini-logo" href="assets/gemini-logo.webp" x="23" y="18" width="34" height="34" preserveAspectRatio="xMidYMid slice" />
          <text x="112" y="34" text-anchor="middle">Gemini Flash</text>
          <text x="112" y="56" text-anchor="middle" class="mission-node-small">AI response</text>
        </g>
      </svg>
    </div>
  `;
}

function renderArchitecture() {
  return `
    <div class="architecture-panel" aria-label="Architecture diagram">
      <div class="chapter-kicker">Architecture</div>
      <div class="architecture-map">
        <svg class="architecture-svg" viewBox="0 0 960 300" role="img" aria-label="Caller connects to Twilio Voice, Twilio opens a WebSocket to your server, and the server connects to tools and Gemini Flash.">
          <defs>
            <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g class="arch-svg-lines">
            <line x1="230" y1="94" x2="295" y2="94" />
            <circle cx="230" cy="94" r="5" />
            <circle cx="295" cy="94" r="5" />

            <line x1="550" y1="94" x2="685" y2="94" />
            <circle cx="550" cy="94" r="5" />
            <circle cx="685" cy="94" r="5" />
            <text x="593" y="60">WebSocket</text>

            <line x1="798" y1="148" x2="798" y2="183" class="arch-svg-hot-line" />
            <circle cx="798" cy="183" r="5" class="arch-svg-hot-dot" />

            <line x1="728" y1="146" x2="525" y2="196" />
            <circle cx="525" cy="196" r="5" />
          </g>

          <g class="arch-svg-packets">
            <circle class="arch-svg-packet packet-one" r="5">
              <animateMotion dur="2.4s" repeatCount="indefinite" path="M230 94 L295 94" />
            </circle>
            <circle class="arch-svg-packet packet-two" r="5">
              <animateMotion dur="2.8s" begin="-1.1s" repeatCount="indefinite" path="M550 94 L685 94" />
            </circle>
            <circle class="arch-svg-packet packet-three" r="5">
              <animateMotion dur="2.3s" begin="-0.8s" repeatCount="indefinite" path="M798 148 L798 183" />
            </circle>
          </g>

          <g class="arch-svg-node arch-svg-muted" transform="translate(48 48)">
            <rect width="182" height="92" rx="18" />
            <foreignObject x="42" y="27" width="26" height="26">
              <div xmlns="http://www.w3.org/1999/xhtml" class="arch-lucide-icon">${icon("smartphone")}</div>
            </foreignObject>
            <text x="110" y="41" text-anchor="middle">Caller</text>
            <text x="110" y="68" text-anchor="middle" class="arch-svg-small">your phone</text>
          </g>

          <g class="arch-svg-node arch-svg-muted arch-svg-wide" transform="translate(295 48)">
            <rect width="255" height="92" rx="18" />
            <foreignObject x="56" y="22" width="48" height="48">
              <div xmlns="http://www.w3.org/1999/xhtml" class="arch-lucide-icon arch-lucide-icon-large">${icon("phone-call")}</div>
            </foreignObject>
            <text x="180" y="41" text-anchor="middle">Twilio Voice</text>
            <text x="180" y="68" text-anchor="middle" class="arch-svg-small">ConversationRelay</text>
          </g>

          <g class="arch-svg-node arch-svg-server" transform="translate(685 48)" filter="url(#softGlow)">
            <rect width="225" height="92" rx="18" />
            <foreignObject x="61" y="32" width="30" height="30">
              <div xmlns="http://www.w3.org/1999/xhtml" class="arch-lucide-icon arch-lucide-icon-hot">${icon("server")}</div>
            </foreignObject>
            <text x="140" y="55" text-anchor="middle">Your Server</text>
          </g>

          <g class="arch-svg-node arch-svg-tools" transform="translate(410 196)">
            <rect width="230" height="84" rx="18" />
            <foreignObject x="58" y="32" width="34" height="34">
              <div xmlns="http://www.w3.org/1999/xhtml" class="arch-lucide-icon">${icon("wrench")}</div>
            </foreignObject>
            <text x="128" y="50" text-anchor="middle">Tools</text>
          </g>

          <g class="arch-svg-node arch-svg-muted" transform="translate(680 196)">
            <rect width="210" height="84" rx="18" />
            <image class="arch-gemini-logo" href="assets/gemini-logo.webp" x="45" y="23" width="42" height="42" preserveAspectRatio="xMidYMid slice" />
            <text x="132" y="38" text-anchor="middle">Gemini</text>
            <text x="132" y="64" text-anchor="middle" class="arch-svg-small">Flash</text>
          </g>
        </svg>
        </div>
      </div>
    </div>
  `;
}

function renderFlow(chapter) {
  const toolsDetail = state.runtime === "node" ? "JavaScript functions add facts or actions." : "Python functions add facts or actions.";
  const fallback = [
    ["Webhook", "Twilio asks your app what to do."],
    ["Socket", "ConversationRelay streams text turns."],
    ["Model", "Gemini writes the next reply."],
    ["Tools", toolsDetail],
    ["Caller", "Twilio speaks the answer."]
  ];
  const flow = (chapter.flow && (chapter.flow[state.runtime] || chapter.flow)) || fallback;

  return `
    <div class="flow-panel lesson-block">
      <h3>Conversation Flow</h3>
      <p>Keep this mental model in view while coding. Every chapter adds one stronger link to the call path.</p>
      <div class="flow-grid">
        ${flow
          .map(
            ([title, detail], index) => `
              <div class="flow-node">
                <span>${index + 1}</span>
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(detail)}</small>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderStepAction() {
  const done = isStepDone(activeChapter, activeStep);
  return `
    <button class="complete-step ${done ? "is-done" : ""}" type="button" data-complete-chapter="${activeChapter}" data-complete-step="${activeStep}">
      ${done ? icon("check") : icon("circle")}
      <span>${done ? "Completed" : "Mark Done"}</span>
    </button>
  `;
}

function renderLessonStep(step) {
  return `
    <div class="lesson-page">
      <div class="lesson-title-row">
        <div>
          <div class="step-kicker">Step ${activeStep + 1}</div>
          <h2>${escapeHtml(step.title)}</h2>
        </div>
        ${renderStepAction()}
      </div>

      <p class="lesson-lead">${escapeHtml(step.body)}</p>
      ${renderInstructionCards(step.instructions)}
      ${renderCode(step)}
    </div>
  `;
}

function renderInstructionCards(instructions) {
  const icons = ["terminal", "settings", "check", "radio", "phone-call"];
  return `
    <div class="action-stack">
      ${instructions
        .map(
          (instruction, index) => `
            <article class="action-card">
              <div class="mini-icon">${icon(icons[index % icons.length])}</div>
              <div>
                <div class="step-kicker">Step ${index + 1}</div>
                <strong>${escapeHtml(instruction)}</strong>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderMissionStep(step) {
  return `
    <div class="mission-page">
      ${renderVoiceVisual()}
      <p class="mission-lead">
        In this workshop, you'll create a <strong>voice AI agent</strong> that you can talk to over a real phone call.
        It listens to what you say, sends your words to Gemini Flash, and speaks the reply back in real time over Twilio.
      </p>

      <article class="callout-card">
        <h2>What You'll Build</h2>
        <p>${escapeHtml(step.body)}</p>
      </article>

      <div class="lesson-page lesson-page-flat">
        <div class="lesson-title-row">
          <div>
            <h2>Open Your Codespace Now</h2>
            <p class="lesson-lead">You will be writing code in a few minutes. Open your Codespace in a new tab now so it can warm up in the background.</p>
          </div>
          ${renderStepAction()}
        </div>
        <div class="action-stack">
          <article class="action-card">
            <div class="mini-icon">${icon("github")}</div>
            <div>
              <div class="step-kicker">Step 1</div>
              <strong>Open the workshop repo</strong>
              <p>Use the copy button and open the repo or Codespace in a new browser tab.</p>
            </div>
          </article>
          <article class="action-card">
            <div class="mini-icon">${icon("settings")}</div>
            <div>
              <div class="step-kicker">Step 2</div>
              <strong>Leave it loading in the background</strong>
              <p>GitHub spins up a cloud VS Code with the repo ready by the time you need it.</p>
            </div>
          </article>
        </div>
        ${renderCode(step)}
      </div>

      <aside class="note">
        <strong>All you need is a GitHub account.</strong> If you do not have one, create it before the coding chapters begin.
      </aside>
    </div>
  `;
}

function renderHowItWorksStep(step) {
  return `
    <div class="lesson-page">
      ${renderArchitecture()}
      <div class="lesson-title-row">
        <div>
          <div class="step-kicker">Step ${activeStep + 1}</div>
          <h2>${escapeHtml(step.title)}</h2>
        </div>
        ${renderStepAction()}
      </div>
      <p class="lesson-lead">A phone call becomes a stream of text events. Your server keeps the socket open, Gemini writes the next response, and Twilio turns that text back into audio.</p>
      <div class="inline-diagram">
        <button type="button" class="diagram-chip is-active" data-flow-preview="caller">Caller speaks</button>
        <button type="button" class="diagram-chip" data-flow-preview="relay">Relay sends text</button>
        <button type="button" class="diagram-chip" data-flow-preview="gemini">Gemini replies</button>
        <button type="button" class="diagram-chip" data-flow-preview="voice">Twilio speaks</button>
      </div>
      <div class="simulator-card" id="flowPreview">
        <span class="chapter-kicker">Live mental model</span>
        <p>The caller says: "Can you help me check my order?"</p>
      </div>
      ${renderCode(step)}
    </div>
  `;
}

function renderConversationFlowStep(step) {
  return `
    <div class="lesson-page">
      <div class="lesson-title-row">
        <div>
          <div class="step-kicker">Step ${activeStep + 1}</div>
          <h2>${escapeHtml(step.title)}</h2>
        </div>
        ${renderStepAction()}
      </div>
      <p class="lesson-lead">${escapeHtml(step.body)}</p>
      ${renderFlow(chapters[activeChapter])}
      <div class="simulator-card">
        <span class="chapter-kicker">Try the path</span>
        <div class="call-simulator">
          <button type="button" data-sim="question">Ask a question</button>
          <button type="button" data-sim="memory">Test memory</button>
          <button type="button" data-sim="tool">Trigger a tool</button>
        </div>
        <p id="simOutput">Pick a caller move to preview what the app should do.</p>
      </div>
    </div>
  `;
}

function renderChapterOneStep(step) {
  if (activeStep === 0) return renderMissionStep(step);
  if (activeStep === 1) return renderHowItWorksStep(step);
  if (activeStep === 2) return renderConversationFlowStep(step);
  return renderLessonStep(step);
}

function renderFirstContactStep(step) {
  const architecture = activeStep === 0 ? renderArchitecture() : "";
  return `
    <div class="lesson-page">
      ${architecture}
      <div class="lesson-title-row">
        <div>
          <div class="step-kicker">Step ${activeStep + 1}</div>
          <h2>${escapeHtml(step.title)}</h2>
        </div>
        ${renderStepAction()}
      </div>
      <p class="lesson-lead">${escapeHtml(step.body)}</p>
      ${renderInstructionCards(step.instructions)}
      ${renderCode(step)}
    </div>
  `;
}

function renderCode(step) {
  const label = step.codeLabel;
  const code = step.code;
  const codeId = `code-${Math.random().toString(36).slice(2)}`;
  const language = getCodeLanguage(label, code);
  return `
    <div class="code-block">
      <div class="code-header">
        <span>${escapeHtml(label)}</span>
        <span class="code-language">${escapeHtml(language)}</span>
        <button class="copy-button" type="button" data-copy-target="${codeId}">${icon("copy")}<span>Copy</span></button>
      </div>
      <pre id="${codeId}" data-language="${escapeHtml(language)}"><code class="language-${escapeHtml(language)}">${highlightCode(code, language)}</code></pre>
    </div>
  `;
}

function renderQuiz(chapter) {
  return `
    <div class="quiz-card">
      <h3>Checkpoint</h3>
      <p>${escapeHtml(chapter.quiz.question)}</p>
      <div class="quiz-options">
        ${chapter.quiz.options
          .map(
            (option) => `
              <button type="button" data-quiz-option="${escapeHtml(option)}">${escapeHtml(option)}</button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderContent() {
  cleanupThreeScenes();
  const chapter = chapters[activeChapter];
  const step = getRuntimeStep(chapter.steps[activeStep]);
  if (activeChapter === 0) {
    chapterContent.innerHTML = renderChapterOneStep(step);
    requestAnimationFrame(initThreeScenes);
    return;
  }
  if (activeChapter === 1) {
    chapterContent.innerHTML = renderFirstContactStep(step);
    requestAnimationFrame(initThreeScenes);
    return;
  }
  chapterContent.innerHTML = renderLessonStep(step);
  requestAnimationFrame(initThreeScenes);
}

function renderProgress() {
  const total = totalStepCount();
  const completed = completedStepCount();
  const chapterTotal = chapters[activeChapter].steps.length;
  const percent = Math.round((completed / total) * 100);
  progressFill.style.width = `${percent}%`;
  progressLabel.textContent = `Chapter ${activeChapter + 1} · Step ${Math.min(activeStep + 1, chapterTotal)}/${chapterTotal} · ${percent}% overall`;

  const previous = getAdjacentStep(-1);
  const next = getAdjacentStep(1);
  prevStepButton.disabled = !previous;
  nextStepButton.disabled = !next;
  prevStepButton.querySelector("span").textContent = previous ? previous.label : "Previous";
  nextStepButton.querySelector("span").textContent = next ? next.label : "Next";

  badgeList.innerHTML = chapters
    .filter((_, index) => isChapterDone(index))
    .map((chapter) => `<span class="badge" title="${escapeHtml(chapter.title)}">${escapeHtml(chapter.badge)}</span>`)
    .join("");

  if (!badgeList.innerHTML) {
    badgeList.innerHTML = '<span class="badge" title="First badge unlocks when a chapter is complete">...</span>';
  }
}

function getAdjacentStep(direction) {
  if (direction < 0) {
    if (activeStep > 0) {
      return {
        chapter: activeChapter,
        step: activeStep - 1,
        label: chapters[activeChapter].steps[activeStep - 1].title
      };
    }
    if (activeChapter > 0) {
      const chapter = activeChapter - 1;
      const step = chapters[chapter].steps.length - 1;
      return { chapter, step, label: chapters[chapter].steps[step].title };
    }
    return null;
  }

  if (activeStep < chapters[activeChapter].steps.length - 1) {
    return {
      chapter: activeChapter,
      step: activeStep + 1,
      label: chapters[activeChapter].steps[activeStep + 1].title
    };
  }
  if (activeChapter < chapters.length - 1) {
    return { chapter: activeChapter + 1, step: 0, label: chapters[activeChapter + 1].steps[0].title };
  }
  return null;
}

function goToStep(chapter, step) {
  activeChapter = chapter;
  activeStep = step;
  renderAll();
  content.focus();
  window.scrollTo({ top: 0, behavior: "auto" });
  content.scrollTo({ top: 0, behavior: "auto" });
}

function updateCompletionControls() {
  document.querySelectorAll("[data-complete-chapter][data-complete-step]").forEach((button) => {
    const chapterIndex = Number(button.dataset.completeChapter);
    const stepIndex = Number(button.dataset.completeStep);
    const done = isStepDone(chapterIndex, stepIndex);
    button.classList.toggle("is-done", done);
    button.innerHTML = `${done ? icon("check") : icon("circle")}<span>${done ? "Completed" : "Mark Done"}</span>`;
  });
}

function cleanupThreeScenes() {
  threeSceneCleanup.forEach((cleanup) => cleanup());
  threeSceneCleanup = [];
}

async function loadThreeModule() {
  if (threeModule) return threeModule;
  threeModule = await import(THREE_MODULE_URL);
  return threeModule;
}

async function initThreeScenes() {
  const targets = [...document.querySelectorAll("[data-three-scene]")];
  if (!targets.length) return;

  let THREE;
  try {
    THREE = await loadThreeModule();
  } catch (error) {
    console.warn("Three.js failed to load", error);
    return;
  }

  targets.forEach((target) => {
    const sceneType = target.dataset.threeScene;
    if (sceneType === "voice") {
      mountVoiceScene(THREE, target);
    }
  });
}

function makeRenderer(THREE, target) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  target.appendChild(renderer.domElement);

  const resize = (camera) => {
    const width = Math.max(1, target.clientWidth);
    const height = Math.max(1, target.clientHeight);
    renderer.setSize(width, height, false);
    if (camera.isPerspectiveCamera) {
      camera.aspect = width / height;
    } else {
      const aspect = width / height;
      camera.left = -4.6 * aspect;
      camera.right = 4.6 * aspect;
      camera.top = 4.6;
      camera.bottom = -4.6;
    }
    camera.updateProjectionMatrix();
  };

  return { renderer, resize };
}

function addRoundedNode(THREE, scene, color, position, scale) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(scale.x, scale.y, scale.z),
    new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.08 })
  );
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry),
    new THREE.LineBasicMaterial({ color: 0xc4ceec, transparent: true, opacity: 0.34 })
  );
  group.add(body, edge);
  group.position.set(position.x, position.y, position.z);
  scene.add(group);
  return group;
}

function mountVoiceScene(THREE, target) {
  const { renderer, resize } = makeRenderer(THREE, target);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.28, 8.6);

  scene.add(new THREE.AmbientLight(0xffffff, 1.35));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);
  const redLight = new THREE.PointLight(0xf24a50, 2.2, 7);
  redLight.position.set(2.6, 1.3, 2.2);
  scene.add(redLight);
  const cyanLight = new THREE.PointLight(0x58d8ff, 1.3, 6);
  cyanLight.position.set(-2.4, -0.9, 2.2);
  scene.add(cyanLight);

  const composition = new THREE.Group();
  composition.scale.setScalar(0.86);
  composition.position.set(0, -0.08, 0);
  scene.add(composition);

  const glassPanel = addRoundedNode(
    THREE,
    composition,
    0x13263d,
    { x: 0, y: 0, z: 0 },
    { x: 5.7, y: 3.18, z: 0.16 }
  );
  glassPanel.rotation.set(-0.05, 0.12, -0.02);

  const innerGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.9, 2.42),
    new THREE.MeshBasicMaterial({ color: 0x1a3650, transparent: true, opacity: 0.34 })
  );
  innerGlow.position.set(0, 0.02, 0.14);
  innerGlow.rotation.copy(glassPanel.rotation);
  composition.add(innerGlow);

  const callCore = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.56, 40, 24),
    new THREE.MeshStandardMaterial({
      color: 0x4968c8,
      emissive: 0x16236b,
      roughness: 0.22,
      metalness: 0.18
    })
  );
  const coreHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.76, 0.035, 12, 80),
    new THREE.MeshBasicMaterial({ color: 0x58d8ff, transparent: true, opacity: 0.72 })
  );
  coreHalo.rotation.x = Math.PI / 2;
  const coreRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.04, 0.025, 12, 96),
    new THREE.MeshBasicMaterial({ color: 0x57d39c, transparent: true, opacity: 0.38 })
  );
  coreRing.rotation.x = Math.PI / 2;
  callCore.add(core, coreHalo, coreRing);
  callCore.position.set(-1.52, -0.18, 0.52);
  composition.add(callCore);

  const wavePlate = addRoundedNode(
    THREE,
    composition,
    0x0d1228,
    { x: 1.15, y: -0.52, z: 0.56 },
    { x: 2.85, y: 0.78, z: 0.08 }
  );
  wavePlate.children[1].material.opacity = 0.48;

  const aiCard = addRoundedNode(
    THREE,
    composition,
    0xffffff,
    { x: -1.95, y: 1.06, z: 0.7 },
    { x: 0.92, y: 0.76, z: 0.1 }
  );
  aiCard.rotation.z = -0.14;

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.43, 2),
    new THREE.MeshStandardMaterial({
      color: 0xf24a50,
      emissive: 0x3b1013,
      roughness: 0.22,
      metalness: 0.18
    })
  );
  gem.position.set(2.02, 0.96, 0.78);
  composition.add(gem);

  const bars = new THREE.Group();
  for (let index = 0; index < 18; index += 1) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.34 + (index % 5) * 0.08, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xf24a50, emissive: 0x4b1115, roughness: 0.3 })
    );
    bar.position.x = -0.02 + index * 0.13;
    bar.position.y = -0.58;
    bar.position.z = 0.72;
    bars.add(bar);
  }
  composition.add(bars);

  const routeMaterial = new THREE.LineBasicMaterial({ color: 0x7ea4ff, transparent: true, opacity: 0.45 });
  const route = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.08, -0.18, 0.55),
      new THREE.Vector3(-0.28, 0.16, 0.58),
      new THREE.Vector3(0.5, -0.12, 0.58),
      new THREE.Vector3(1.34, 0.55, 0.58),
      new THREE.Vector3(1.8, 0.86, 0.58)
    ]),
    routeMaterial
  );
  composition.add(route);

  const packets = new THREE.Group();
  for (let index = 0; index < 5; index += 1) {
    const packet = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 14, 10),
      new THREE.MeshBasicMaterial({ color: index % 2 ? 0x57d39c : 0xf24a50 })
    );
    packet.userData.offset = index / 5;
    packets.add(packet);
  }
  composition.add(packets);

  let frameId;
  const clock = new THREE.Clock();
  const render = () => {
    const time = clock.getElapsedTime();
    composition.rotation.y = Math.sin(time * 0.45) * 0.045;
    callCore.rotation.z = time * 0.45;
    core.scale.setScalar(1 + Math.sin(time * 2.3) * 0.035);
    coreHalo.scale.setScalar(1 + Math.sin(time * 2.1) * 0.08);
    coreRing.scale.setScalar(1 + Math.cos(time * 1.6) * 0.08);
    gem.rotation.x = time * 0.8;
    gem.rotation.y = time * 1.1;
    bars.children.forEach((bar, index) => {
      bar.scale.y = 0.42 + Math.abs(Math.sin(time * 3.4 + index * 0.42)) * 1.35;
    });
    packets.children.forEach((packet) => {
      const t = (time * 0.24 + packet.userData.offset) % 1;
      const x = -1.08 + t * 2.9;
      const y = -0.18 + Math.sin(t * Math.PI * 2) * 0.28 + t * 0.9;
      packet.position.set(x, y, 0.82);
    });
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  resize(camera);
  const observer = new ResizeObserver(() => resize(camera));
  observer.observe(target);
  render();

  threeSceneCleanup.push(() => {
    cancelAnimationFrame(frameId);
    observer.disconnect();
    renderer.dispose();
    target.replaceChildren();
  });
}

function mountArchitectureScene(THREE, target) {
  const { renderer, resize } = makeRenderer(THREE, target);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 4.6, -4.6, 0.1, 100);
  camera.zoom = 2.25;
  camera.position.set(0, 0, 10);

  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const nodes = [
    [-3.6, 1.0, 0x222544],
    [-1.0, 1.0, 0x222544],
    [2.1, 1.0, 0x3a2035],
    [-0.2, -1.35, 0x151d3c],
    [2.2, -1.35, 0x222544]
  ].map(([x, y, color]) =>
    addRoundedNode(THREE, scene, color, { x, y, z: 0 }, { x: 1.62, y: 0.78, z: 0.14 })
  );
  nodes[2].children[1].material.color.set(0xf24a50);
  nodes[2].children[1].material.opacity = 0.8;

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x7f89a8, transparent: true, opacity: 0.7 });
  const hotLineMaterial = new THREE.LineBasicMaterial({ color: 0xf24a50, transparent: true, opacity: 0.8 });
  const makeLine = (points, material = lineMaterial) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, y, z = 0.04]) => new THREE.Vector3(x, y, z)));
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    return line;
  };

  makeLine([[-2.78, 1.0], [-1.82, 1.0]]);
  makeLine([[-0.18, 1.0], [1.28, 1.0]]);
  makeLine([[2.1, 0.6], [2.1, -0.88]], hotLineMaterial);
  makeLine([[1.35, 0.62], [-0.2, -0.96]]);
  makeLine([[1.35, 0.62], [2.2, -0.96]]);

  const packets = new THREE.Group();
  const packetGeometry = new THREE.SphereGeometry(0.06, 12, 8);
  for (let index = 0; index < 7; index += 1) {
    const packet = new THREE.Mesh(
      packetGeometry,
      new THREE.MeshBasicMaterial({ color: index % 2 ? 0x57d39c : 0xf24a50 })
    );
    packet.userData.offset = index / 7;
    packets.add(packet);
  }
  scene.add(packets);

  let frameId;
  const clock = new THREE.Clock();
  const render = () => {
    const time = clock.getElapsedTime();
    packets.children.forEach((packet, index) => {
      const t = (time * 0.22 + packet.userData.offset) % 1;
      if (index < 4) {
        packet.position.set(-3.05 + t * 4.75, 1.0, 0.2);
      } else {
        packet.position.set(2.1, 0.58 - t * 1.95, 0.2);
      }
    });
    nodes.forEach((node, index) => {
      node.rotation.z = Math.sin(time * 0.7 + index) * 0.015;
    });
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  resize(camera);
  const observer = new ResizeObserver(() => resize(camera));
  observer.observe(target);
  render();

  threeSceneCleanup.push(() => {
    cancelAnimationFrame(frameId);
    observer.disconnect();
    renderer.dispose();
    target.querySelectorAll("canvas").forEach((canvas) => canvas.remove());
  });
}

function renderShell() {
  renderRuntimeSwitch();
  renderChapterTabs();
  renderSideRail();
  renderProgress();
  renderBuilder();
  updateCompletionControls();
  saveState();
  refreshIcons();
}

function renderBuilder() {
  const builder = state.builder;
  for (const [key, value] of Object.entries(builder)) {
    const field = builderForm.elements[key];
    if (!field) continue;
    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  }
  updateBuilderReadout();
}

function getBuilderValues() {
  const formData = new FormData(builderForm);
  return {
    name: formData.get("name") || "Ava",
    persona: formData.get("persona") || defaultBuilder.persona,
    voice: formData.get("voice") || defaultBuilder.voice,
    language: formData.get("language") || defaultBuilder.language,
    model: formData.get("model") || defaultBuilder.model,
    toolLookup: builderForm.elements.toolLookup.checked,
    toolTicket: builderForm.elements.toolTicket.checked,
    handoff: builderForm.elements.handoff.checked
  };
}

function updateBuilderReadout() {
  const builder = state.builder;
  const toolCount = [builder.toolLookup, builder.toolTicket].filter(Boolean).length;
  document.querySelector("#agentNameReadout").textContent = builder.name;
  document.querySelector("#agentVoiceReadout").textContent = builder.voice;
  document.querySelector("#agentModelReadout").textContent = builder.model;
  document.querySelector("#agentToolsReadout").textContent = `${toolCount} / 2`;
  document.querySelector("#agentHandoffReadout").textContent = builder.handoff ? "Yes" : "No";
  document.querySelector("#promptPreview").textContent = makePrompt(builder);
}

function makePrompt(builder) {
  const tools = [];
  if (builder.toolLookup) tools.push("customer lookup");
  if (builder.toolTicket) tools.push("ticket creation");
  const toolLine = tools.length ? `You can use these tools: ${tools.join(", ")}.` : "You do not have tools enabled.";
  const handoffLine = builder.handoff
    ? "If the caller asks for a human, billing changes, legal advice, or anything unsafe, offer a warm handoff."
    : "Do not offer human handoff unless the workshop instructor tells you to.";

  return [
    `You are ${builder.name}, a ${builder.persona.toLowerCase()} on a live phone call.`,
    `Use ${builder.model} and speak in ${builder.language}.`,
    `Voice: ${builder.voice}.`,
    "Keep replies short, natural, and easy to understand aloud.",
    "Ask one question at a time.",
    "Do not use markdown, bullet points, links, or code blocks.",
    toolLine,
    handoffLine
  ].join("\n");
}

function renderAll({ keepScroll = false } = {}) {
  const scrollTop = content.scrollTop;
  renderRuntimeSwitch();
  renderChapterTabs();
  renderSideRail();
  renderContent();
  renderProgress();
  renderBuilder();
  updateCompletionControls();
  saveState();
  if (keepScroll) {
    content.scrollTop = scrollTop;
  }
  refreshIcons();
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    const previous = button.innerHTML;
    button.innerHTML = `${icon("check")}<span>Copied</span>`;
    refreshIcons();
    setTimeout(() => {
      button.innerHTML = previous;
      refreshIcons();
    }, 1100);
  } catch {
    button.innerHTML = "<span>Select text</span>";
  }
}

document.addEventListener("click", (event) => {
  const chapterButton = event.target.closest("[data-chapter]");
  if (chapterButton) {
    goToStep(Number(chapterButton.dataset.chapter), 0);
    return;
  }

  const stepButton = event.target.closest("[data-step]");
  if (stepButton) {
    goToStep(activeChapter, Number(stepButton.dataset.step));
    return;
  }

  const runtimeButton = event.target.closest("[data-runtime]");
  if (runtimeButton) {
    state.runtime = runtimeButton.dataset.runtime === "node" ? "node" : "python";
    renderAll({ keepScroll: true });
    return;
  }

  const completeButton = event.target.closest("[data-complete-step]");
  if (completeButton) {
    const chapterIndex = Number(completeButton.dataset.completeChapter);
    const index = Number(completeButton.dataset.completeStep);
    const key = stepKey(chapterIndex, index);
    state.completed[key] = !state.completed[key];
    activeChapter = chapterIndex;
    activeStep = index;
    renderAll({ keepScroll: true });
    return;
  }

  const copyButton = event.target.closest("[data-copy-target]");
  if (copyButton) {
    const target = document.getElementById(copyButton.dataset.copyTarget);
    if (target) {
      copyText(target.textContent, copyButton);
    }
    return;
  }

  const quizButton = event.target.closest("[data-quiz-option]");
  if (quizButton) {
    const answer = chapters[activeChapter].quiz.answer;
    const options = quizButton.parentElement.querySelectorAll("button");
    options.forEach((option) => {
      option.classList.toggle("is-correct", option.dataset.quizOption === answer);
      option.classList.toggle("is-wrong", option === quizButton && option.dataset.quizOption !== answer);
    });
    return;
  }

  const flowButton = event.target.closest("[data-flow-preview]");
  if (flowButton) {
    const previews = {
      caller: "The caller says: \"Can you help me check my order?\"",
      relay: "ConversationRelay sends your server a text event with the caller's words.",
      gemini: "Your server sends the text plus call context to Gemini Flash.",
      voice: "The server sends a text token back and Twilio speaks it to the caller."
    };
    document.querySelectorAll("[data-flow-preview]").forEach((button) => {
      button.classList.toggle("is-active", button === flowButton);
    });
    const preview = document.querySelector("#flowPreview p");
    if (preview) preview.textContent = previews[flowButton.dataset.flowPreview];
    return;
  }

  const simButton = event.target.closest("[data-sim]");
  if (simButton) {
    const output = {
      question: "Caller: What can you help me with? -> Agent: I can answer questions, look up simple account details, and create a support ticket.",
      memory: "Caller: My name is Rishab. -> Later: The agent should remember and use Rishab naturally.",
      tool: "Caller: Create a ticket for a damaged shipment. -> Server: runs create_ticket(), then Gemini summarizes the result."
    };
    document.querySelectorAll("[data-sim]").forEach((button) => {
      button.classList.toggle("is-active", button === simButton);
    });
    const simOutput = document.querySelector("#simOutput");
    if (simOutput) simOutput.textContent = output[simButton.dataset.sim];
  }
});

prevStepButton.addEventListener("click", () => {
  const previous = getAdjacentStep(-1);
  if (previous) goToStep(previous.chapter, previous.step);
});

nextStepButton.addEventListener("click", () => {
  const currentKey = stepKey(activeChapter, activeStep);
  state.completed[currentKey] = true;
  const next = getAdjacentStep(1);
  if (next) {
    goToStep(next.chapter, next.step);
  } else {
    renderShell();
  }
});

builderToggle.addEventListener("click", () => {
  const isOpen = builderPanel.classList.toggle("is-open");
  builderPanel.setAttribute("aria-hidden", String(!isOpen));
  builderToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelector("#closeBuilder").addEventListener("click", () => {
  builderPanel.classList.remove("is-open");
  builderPanel.setAttribute("aria-hidden", "true");
  builderToggle.setAttribute("aria-expanded", "false");
});

builderForm.addEventListener("input", () => {
  state.builder = getBuilderValues();
  updateBuilderReadout();
  saveState();
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = state.theme;
  saveState();
});

document.querySelector("#resetProgress").addEventListener("click", () => {
  state.completed = {};
  goToStep(0, 0);
});

document.documentElement.dataset.theme = state.theme;
renderAll();
