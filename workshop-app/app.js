const chapters = [
  {
    title: "Mission Briefing",
    summary: "Understand what we are building and get set up.",
    badge: "MB",
    intro:
      "You will build a voice AI agent using Twilio Agent Connect (TAC). TAC acts as middleware between your LLM and Twilio's communication channels — you write one message handler, TAC handles everything else.",
    flow: {
      python: [
        ["Call", "A caller dials your Twilio number."],
        ["TAC", "TACFastAPIServer handles webhooks and WebSocket connections."],
        ["Handler", "on_message_ready receives transcribed caller speech."],
        ["Gemini", "Your handler streams Gemini Flash response chunks."],
        ["Voice", "VoiceChannel sends each chunk back to the caller."]
      ],
      node: [
        ["Call", "A caller dials your Twilio number."],
        ["TAC", "TACServer handles webhooks and WebSocket connections."],
        ["Handler", "onMessageReady receives transcribed caller speech."],
        ["Gemini", "Your handler calls Gemini Flash and returns a reply."],
        ["Voice", "TAC routes the reply back through the voice channel."]
      ]
    },
    steps: [
      {
        title: "What We're Building",
        body:
          "The end state is a compact Python app powered by Twilio Agent Connect. TAC provides the server, webhook routes, and WebSocket handling — you only write the message handler that calls your LLM.",
        instructions: [
          "Open the TAC sample repo in a separate tab.",
          "Keep this workshop tab open as your checklist and code guide.",
          "Use the prompt builder to choose a name, persona, and model; later you will copy its prompt into SYSTEM_PROMPT and set the matching .env values."
        ],
        codeLabel: "Reference repo",
        code: "https://github.com/twilio/twilio-agent-connect-python"
      },
      {
        title: "Prerequisites",
        body:
          "Have the accounts and local tools ready before the room starts typing code.",
        instructions: [
          "Python 3.10 or newer.",
          "A Twilio account; the next step walks through buying a Voice-capable number.",
          "A Twilio API Key and API Secret from the Console.",
          "A Google AI Studio API key.",
          "An ngrok account; installation and authentication are covered below."
        ],
        codeLabel: "Accounts",
        code: "Twilio Console: https://console.twilio.com\nGoogle AI Studio: https://aistudio.google.com\nngrok: https://ngrok.com"
      },
      {
        title: "Buy a Twilio Phone Number",
        body:
          "Your agent needs a Twilio number that can receive Voice calls. Phone numbers have recurring charges, availability varies, and some countries require regulatory documentation.",
        instructions: [
          "In Twilio Console, open Phone Numbers → Manage → Buy a number.",
          "Filter for Voice capability, choose an available number, review its price and requirements, then buy it.",
          "Copy the number in E.164 format, such as +13125551234, for TWILIO_PHONE_NUMBER.",
          "On a trial account, verify your personal caller ID first; trial projects are limited to one Twilio number."
        ],
        codeLabel: "Twilio Console",
        code: "https://console.twilio.com\nPhone Numbers → Manage → Buy a number\nCapability: Voice\nSave as: TWILIO_PHONE_NUMBER=\"+1xxxxxxxxxx\""
      },
      {
        title: "Clone the Workshop Repo and Install",
        body:
          "Clone this workshop repository and work from its root. The hosted guide stays isolated in workshop-app while main.py and .env live in your attendee workspace.",
        instructions: [
          "Clone this workshop repo and enter its root directory.",
          "Create and activate a virtual environment.",
          "Install dependencies including twilio-agent-connect[server]."
        ],
        codeLabel: "Terminal",
        code:
          "git clone https://github.com/rishabkumar7/twilio-cr-tac-workshop\ncd twilio-cr-tac-workshop\npython3 -m venv .venv\nsource .venv/bin/activate\npip install \"twilio-agent-connect[server]==2.4.0\" \"google-genai==2.23.0\" \"python-dotenv==1.2.3\""
      },
      {
        title: "Configure Environment",
        body:
          "TAC reads Twilio credentials and the public domain from environment variables. Relay-only mode is enabled by omitting TWILIO_CONVERSATION_CONFIGURATION_ID.",
        instructions: [
          "Copy .env.example to .env.",
          "Add Account SID, Auth Token, API Key, and API Secret from the Twilio Console.",
          "Set TWILIO_VOICE_PUBLIC_DOMAIN to your ngrok domain without https://.",
          "Do not set TWILIO_CONVERSATION_CONFIGURATION_ID for this relay-only workshop."
        ],
        codeLabel: ".env",
        code:
          "TWILIO_ACCOUNT_SID=\"ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\"\nTWILIO_AUTH_TOKEN=\"your-auth-token\"\nTWILIO_API_KEY=\"SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\"\nTWILIO_API_SECRET=\"your-api-secret\"\nTWILIO_PHONE_NUMBER=\"+1xxxxxxxxxx\"\nTWILIO_VOICE_PUBLIC_DOMAIN=\"your-ngrok-domain.ngrok-free.app\"\nGOOGLE_API_KEY=\"your-google-ai-api-key\"\nAGENT_NAME=\"Ava\"\nGEMINI_MODEL=\"gemini-2.5-flash\""
      },
      {
        title: "Install and Connect ngrok",
        body:
          "ngrok gives Twilio a public HTTPS address that forwards to the TAC server on your computer. Create a free ngrok account before authenticating the CLI.",
        instructions: [
          "Install the ngrok Agent CLI; on macOS, use Homebrew, or use ngrok's download page for Linux and Windows.",
          "Copy the authtoken from the ngrok dashboard and add it to the CLI configuration.",
          "Run ngrok version to confirm the CLI is ready."
        ],
        codeLabel: "ngrok setup",
        code: "Download: https://ngrok.com/download\n\nbrew install ngrok\nngrok config add-authtoken YOUR_NGROK_AUTHTOKEN\nngrok version"
      },
      {
        title: "Start ngrok and Connect Voice",
        body:
          "TAC uses TWILIO_VOICE_PUBLIC_DOMAIN to build the ConversationRelay WebSocket URL. Twilio sends inbound calls to TAC's /twiml endpoint.",
        instructions: [
          "Start ngrok forwarding to TAC's default port, 8000.",
          "Copy the hostname only (no https://) into TWILIO_VOICE_PUBLIC_DOMAIN in .env.",
          "Open the purchased number in Twilio Console and set A call comes in to Webhook, https://your-ngrok-domain.ngrok-free.app/twiml, HTTP POST.",
          "Leave ngrok running — TAC needs the tunnel active when calls come in."
        ],
        codeLabel: "Terminal",
        code: "ngrok http 8000\n\nTWILIO_VOICE_PUBLIC_DOMAIN=\"your-ngrok-domain.ngrok-free.app\"\nVOICE_WEBHOOK=\"https://your-ngrok-domain.ngrok-free.app/twiml\""
      }
    ],
    quiz: {
      question: "What does TWILIO_VOICE_PUBLIC_DOMAIN tell TAC?",
      options: ["The LLM model to use", "Where to route WebSocket traffic for voice calls", "Your Twilio phone number"],
      answer: "Where to route WebSocket traffic for voice calls"
    }
  },
  {
    title: "How It Works",
    summary: "Understand ConversationRelay and TAC's role before coding.",
    badge: "HW",
    intro:
      "TAC sits between Twilio's communication channels and your LLM. This chapter explains what happens under the hood so the code in the next chapter makes sense immediately.",
    flow: {
      python: [
        ["Call", "A caller dials your Twilio number."],
        ["Relay", "Twilio opens a WebSocket and streams transcribed speech."],
        ["TAC", "TACFastAPIServer absorbs the webhook and WebSocket complexity."],
        ["Handler", "on_message_ready fires with the caller's words as a string."],
        ["LLM", "Your handler streams model output through VoiceChannel."]
      ],
      node: [
        ["Call", "A caller dials your Twilio number."],
        ["Relay", "Twilio opens a WebSocket and streams transcribed speech."],
        ["TAC", "TACServer absorbs the webhook and WebSocket complexity."],
        ["Handler", "onMessageReady fires with the caller's words as a string."],
        ["LLM", "Your handler calls any model and returns the reply text."]
      ]
    },
    steps: [
      {
        title: "ConversationRelay",
        body:
          "ConversationRelay is the Twilio primitive that converts a voice call into a real-time text stream. When a call arrives, Twilio transcribes the caller's speech and sends it over a WebSocket. Your server sends text back and Twilio speaks it aloud. TAC handles this WebSocket entirely — you never write the loop yourself.",
        instructions: [
          "Twilio handles speech-to-text and text-to-speech automatically.",
          "Your code only sees text in and text out — no audio processing.",
          "TAC generates the TwiML and manages the WebSocket on your behalf."
        ],
        codeLabel: "What TAC replaces",
        code:
          "Without TAC you would write:\n- A /twiml route that returns ConversationRelay XML\n- A WebSocket route that receives JSON events\n- Event parsing for setup, prompt, and interrupt types\n- Manual session tracking keyed to callSid\n\nWith TAC:\n- TACFastAPIServer registers those routes automatically\n- on_message_ready fires with the caller's text already extracted\n- context.conversation_id keys the session for you"
      },
      {
        title: "TAC Architecture",
        body:
          "TAC is an SDK, not a hosted service. It runs inside your Python process, exposes a FastAPI app via TACFastAPIServer, and connects to Twilio's APIs using your credentials.",
        instructions: [
          "TAC is LLM-agnostic — use Gemini, OpenAI, Bedrock, or any model.",
          "VoiceChannel handles ConversationRelay; SMSChannel handles messaging.",
          "TAC is not PCI compliant or HIPAA eligible — do not use it in regulated workflows."
        ],
        codeLabel: "TAC docs",
        code: "https://www.twilio.com/docs/conversations/agent-connect"
      },
      {
        title: "The on_message_ready Contract",
        body:
          "TAC calls your async handler with three arguments. In relay-only streaming mode, the handler returns None and sends an async token generator through VoiceChannel.",
        instructions: [
          "user_message — the caller's transcribed speech as a plain string.",
          "context — a ConversationSession object; use context.conversation_id to key per-call state.",
          "memory_response — unused in relay-only mode, but retained in the callback signature."
        ],
        codeLabel: "Handler signature",
        code:
          "async def handle_message_ready(\n    user_message: str,\n    context: ConversationSession,\n    memory_response: TACMemoryResponse | None,\n) -> None:\n    conv_id = context.conversation_id\n    await voice_channel.send_response(conv_id, stream_tokens())"
      },
      {
        title: "Conversation Flow",
        body:
          "Trace one complete voice turn to build the mental model you will use while coding.",
        instructions: [
          "Caller speaks → Twilio transcribes → TAC calls on_message_ready.",
          "Your handler streams Gemini chunks through voice_channel.send_response().",
          "Twilio speaks the streamed text as it arrives."
        ],
        codeLabel: "Full turn",
        code:
          "Caller: \"What can you help me with?\"\n→ TAC receives transcribed text\n→ on_message_ready(\"What can you help me with?\", context, memory_response)\n→ Gemini streams: \"I can answer questions and create support tickets.\"\n→ VoiceChannel sends chunks → Twilio speaks them to the caller"
      }
    ],
    quiz: {
      question: "What caller information does TAC expose to your message handler?",
      options: ["A raw audio buffer", "Transcribed caller speech as text", "A Twilio request signature"],
      answer: "Transcribed caller speech as text"
    }
  },
  {
    title: "Agent Connect",
    summary: "Replace the manual loop with Twilio Agent Connect (TAC).",
    badge: "AC",
    intro:
      "Twilio Agent Connect is an SDK that acts as middleware between your LLM and Twilio's communication channels — Voice, SMS, and more. Instead of managing webhooks and WebSocket loops yourself, TAC handles channel routing so you can focus on the model logic.",
    flow: {
      python: [
        ["TAC", "TACFastAPIServer handles webhooks and WebSocket connections."],
        ["Channel", "VoiceChannel handles ConversationRelay transport."],
        ["Handler", "on_message_ready receives transcribed speech."],
        ["LLM", "Gemini can call lookup_customer before streaming."],
        ["Route", "VoiceChannel sends the chunks back to the caller."]
      ],
      node: [
        ["TAC", "TAC server handles webhooks and WebSocket connections."],
        ["Channel", "VoiceChannel or SMSChannel abstracts the transport."],
        ["Handler", "onMessageReady receives transcribed speech."],
        ["LLM", "Gemini can call lookupCustomer before returning."],
        ["Route", "TAC sends the reply back through the correct channel."]
      ]
    },
    steps: [
      {
        title: "What Is Agent Connect",
        body:
          "TAC is middleware that connects LLM-powered agents to Twilio's communication services. It abstracts channel complexity so the same handler function works across Voice, SMS, and future channels without rewriting transport code.",
        instructions: [
          "TAC is not PCI compliant or HIPAA eligible — do not use it in regulated workflows.",
          "Supported LLM backends include AWS Bedrock, Azure AI Foundry, OpenAI, and generic providers.",
          "The workshop swaps the manual FastAPI WebSocket loop for a TACFastAPIServer."
        ],
        codeLabel: "Install TAC",
        code: "pip install \"twilio-agent-connect[server]==2.4.0\""
      },
      {
        title: "Configure the Environment",
        body:
          "TAC reads Twilio credentials and channel configuration from environment variables. Add the new keys to your existing .env file alongside the Gemini key.",
        instructions: [
          "Add your Twilio Account SID, Auth Token, API Key, and API Secret.",
          "Set TWILIO_PHONE_NUMBER and TWILIO_VOICE_PUBLIC_DOMAIN (ngrok domain without https://).",
          "Keep GOOGLE_API_KEY and leave TWILIO_CONVERSATION_CONFIGURATION_ID unset."
        ],
        codeLabel: ".env",
        code:
          "TWILIO_ACCOUNT_SID=\"ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\"\nTWILIO_AUTH_TOKEN=\"your-auth-token\"\nTWILIO_API_KEY=\"SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\"\nTWILIO_API_SECRET=\"your-api-secret\"\nTWILIO_PHONE_NUMBER=\"+1xxxxxxxxxx\"\nTWILIO_VOICE_PUBLIC_DOMAIN=\"your-ngrok-domain.ngrok-free.app\"\nGOOGLE_API_KEY=\"your-google-ai-api-key\"\nAGENT_NAME=\"Ava\"\nGEMINI_MODEL=\"gemini-2.5-flash\""
      },
      {
        title: "Initialise TAC and Channels",
        body:
          "Create a TAC instance in relay-only mode and attach a VoiceChannel. This replaces the manual FastAPI app, the /twiml route, and the raw WebSocket handler.",
        instructions: [
          "Create main.py with this first code block, then append each later main.py block in order.",
          "Import the TAC session and memory types used by the callback signature.",
          "Load config from environment variables with TACConfig.from_env().",
          "If you customized the prompt builder, replace the default SYSTEM_PROMPT text with your copied prompt.",
          "Assert that Conversation Orchestrator is disabled, then create VoiceChannel."
        ],
        codeLabel: "main.py",
        code:
          "import os\nfrom collections.abc import AsyncGenerator\n\nfrom dotenv import load_dotenv\nfrom google import genai\nfrom tac import TAC, TACConfig\nfrom tac.channels.voice import VoiceChannel\nfrom tac.models.session import ConversationSession\nfrom tac.models.tac import TACMemoryResponse\nfrom tac.server import TACFastAPIServer\n\nload_dotenv()\n\nMODEL = os.getenv(\"GEMINI_MODEL\", \"gemini-2.5-flash\")\nAGENT_NAME = os.getenv(\"AGENT_NAME\", \"Ava\")\nclient = genai.Client(api_key=os.getenv(\"GOOGLE_API_KEY\"))\n\nSYSTEM_PROMPT = f\"\"\"\nYou are {AGENT_NAME}, a helpful voice AI agent on a live phone call.\nSpeak in short, natural sentences. Ask one question at a time.\nUse lookup_customer when the caller asks about an account.\nAsk for their customer ID if they have not provided it.\nDo not use markdown, bullet points, links, or code blocks.\n\"\"\".strip()\n\ntac = TAC(config=TACConfig.from_env())\nassert not tac.is_orchestrator_enabled(), (\n    \"This workshop expects relay-only mode — \"\n    \"unset TWILIO_CONVERSATION_CONFIGURATION_ID.\"\n)\nvoice_channel = VoiceChannel(tac)"
      },
      {
        title: "Create a Callable Tool",
        body:
          "A Gemini tool can be an ordinary typed Python function. Gemini uses its name, docstring, and parameter types to decide when to call it and which arguments to provide.",
        instructions: [
          "Append this block to main.py; do not replace the initialization code from the previous step.",
          "Define lookup_customer with a typed customer_id parameter and a clear docstring.",
          "Return JSON-serializable data so Gemini can incorporate the result into its answer.",
          "Use the fake record for the workshop; a real app must call an authenticated customer system.",
          "Try it by saying: Look up customer CUST-1001."
        ],
        codeLabel: "main.py",
        code:
          "CUSTOMERS = {\n    \"CUST-1001\": {\n        \"name\": \"Sam Rivera\",\n        \"plan\": \"Pro\",\n        \"account_status\": \"active\",\n    }\n}\n\n\ndef lookup_customer(customer_id: str) -> dict[str, str]:\n    \"\"\"Look up a customer account by customer ID.\"\"\"\n    customer = CUSTOMERS.get(customer_id.upper())\n    if customer is None:\n        return {\"status\": \"not_found\", \"customer_id\": customer_id}\n    return {\"status\": \"found\", **customer}"
      },
      {
        title: "Write the Message Handler",
        body:
          "Add lookup_customer to the Gemini chat configuration. Gemini automatically calls it when account data is needed, then the handler streams Gemini's grounded response through VoiceChannel.",
        instructions: [
          "Append this block to main.py after lookup_customer.",
          "Register the handler with tac.on_message_ready().",
          "Pass lookup_customer in the tools list and stream the final Gemini response.",
          "Use context.conversation_id to key state, then clean it up with tac.on_conversation_ended()."
        ],
        codeLabel: "main.py",
        code:
          "sessions = {}\n\n\nasync def handle_message_ready(\n    user_message: str,\n    context: ConversationSession,\n    memory_response: TACMemoryResponse | None,\n) -> None:\n    conv_id = context.conversation_id\n\n    if conv_id not in sessions:\n        sessions[conv_id] = client.aio.chats.create(\n            model=MODEL,\n            config={\n                \"system_instruction\": SYSTEM_PROMPT,\n                \"tools\": [lookup_customer],\n            },\n        )\n\n    chat = sessions[conv_id]\n\n    async def stream_tokens() -> AsyncGenerator[str, None]:\n        try:\n            async for chunk in await chat.send_message_stream(user_message):\n                if chunk.text:\n                    yield chunk.text\n        except Exception as error:\n            print(\"Gemini error:\", error)\n            yield \"I had trouble thinking through that. Could you repeat it?\"\n\n    await voice_channel.send_response(conv_id, stream_tokens())\n\n\ntac.on_message_ready(handle_message_ready)\n\n\nasync def handle_conversation_ended(context: ConversationSession) -> None:\n    sessions.pop(context.conversation_id, None)\n\n\ntac.on_conversation_ended(handle_conversation_ended)"
      },
      {
        title: "Start the TAC Server",
        body:
          "TACFastAPIServer mounts the webhook and WebSocket routes automatically. Replace the uvicorn main:app invocation with the new server startup.",
        instructions: [
          "Append this final block to main.py.",
          "Create the TACFastAPIServer, passing tac and the voice channel.",
          "Start the server inside a __main__ guard, matching the relay-only example.",
          "TAC listens on port 8000 by default; confirm the Twilio voice webhook is the ngrok domain plus /twiml using HTTP POST."
        ],
        codeLabel: "main.py",
        code:
          "if __name__ == \"__main__\":\n    server = TACFastAPIServer(tac=tac, voice_channel=voice_channel)\n    server.start()"
      }
    ],
    quiz: {
      question: "What caller information does TAC expose to your message handler?",
      options: ["A raw audio buffer", "Transcribed caller speech as text", "A Twilio request signature"],
      answer: "Transcribed caller speech as text"
    }
  }
];

const nodeCodeOverrides = {
  "0:3": {
    label: "Terminal",
    code:
      "git clone https://github.com/rishabkumar7/twilio-cr-tac-workshop\ncd twilio-cr-tac-workshop\nnpm init -y\nnpm pkg set type=module scripts.start=\"node server.js\"\nnpm install twilio-agent-connect@2.3.0 @google/genai@2.22.0 dotenv@17.4.2"
  },
  "0:6": {
    label: "Terminal",
    code: "ngrok http 8000\n\nTWILIO_VOICE_PUBLIC_DOMAIN=\"your-ngrok-domain.ngrok-free.app\"\nVOICE_WEBHOOK=\"https://your-ngrok-domain.ngrok-free.app/twiml\""
  },
  "1:2": {
    label: "Handler signature",
    code:
      "tac.onMessageReady(async ({ conversationId, message, memory, session }) => {\n  const convId = String(conversationId);\n  return `You said: ${message}`;\n});"
  },
  "2:0": {
    label: "Install TAC",
    code: "npm install twilio-agent-connect@2.3.0"
  },
  "2:2": {
    label: "server.js",
    code:
      "import \"dotenv/config\";\nimport { GoogleGenAI } from \"@google/genai\";\nimport { TAC, TACConfig, TACServer, VoiceChannel } from \"twilio-agent-connect\";\n\nconst MODEL = process.env.GEMINI_MODEL || \"gemini-2.5-flash\";\nconst AGENT_NAME = process.env.AGENT_NAME || \"Ava\";\nconst ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });\n\nconst SYSTEM_PROMPT = `\nYou are ${AGENT_NAME}, a helpful voice AI agent on a live phone call.\nSpeak in short, natural sentences. Ask one question at a time.\nUse lookupCustomer when the caller asks about an account.\nAsk for their customer ID if they have not provided it.\nDo not use markdown, bullet points, links, or code blocks.\n`.trim();\n\nconst tac = await TAC.create({ config: TACConfig.fromEnv() });\nconst voiceChannel = new VoiceChannel(tac);\ntac.registerChannel(voiceChannel);"
  },
  "2:3": {
    label: "server.js",
    code:
      "const CUSTOMERS = new Map([\n  [\"CUST-1001\", {\n    name: \"Sam Rivera\",\n    plan: \"Pro\",\n    accountStatus: \"active\",\n  }],\n]);\n\nconst lookupCustomerDeclaration = {\n  name: \"lookupCustomer\",\n  description: \"Look up a customer account by customer ID.\",\n  parametersJsonSchema: {\n    type: \"object\",\n    properties: {\n      customerId: { type: \"string\" },\n    },\n    required: [\"customerId\"],\n  },\n};\n\nfunction lookupCustomer(customerId) {\n  const customer = CUSTOMERS.get(customerId.toUpperCase());\n  return customer\n    ? { status: \"found\", ...customer }\n    : { status: \"not_found\", customerId };\n}"
  },
  "2:4": {
    label: "server.js",
    code:
      "const sessions = new Map();\n\ntac.onMessageReady(async ({ conversationId, message }) => {\n  const convId = String(conversationId);\n\n  if (!sessions.has(convId)) {\n    sessions.set(convId, ai.chats.create({\n      model: MODEL,\n      config: {\n        systemInstruction: SYSTEM_PROMPT,\n        tools: [{ functionDeclarations: [lookupCustomerDeclaration] }],\n      },\n    }));\n  }\n\n  const chat = sessions.get(convId);\n  try {\n    let response = await chat.sendMessage({ message });\n    for (const call of response.functionCalls || []) {\n      if (call.name !== \"lookupCustomer\") continue;\n      const customerId = String(call.args?.customerId || \"\");\n      const output = lookupCustomer(customerId);\n      response = await chat.sendMessage({\n        message: [{\n          functionResponse: {\n            id: call.id,\n            name: call.name,\n            response: { output },\n          },\n        }],\n      });\n    }\n    return (response.text || \"I am sorry, could you say that again?\").trim();\n  } catch (error) {\n    console.error(\"Gemini error:\", error);\n    return \"I had trouble thinking through that. Could you repeat it?\";\n  }\n});"
  },
  "2:5": {
    label: "server.js",
    code:
      "const server = new TACServer(tac);\nawait server.start();"
  }
};

const nodeTextOverrides = {
  "0:0": {
    body:
      "The Node.js end state uses Twilio Agent Connect (TAC) with the @google/genai SDK. TAC handles webhooks and WebSocket connections; you write one message handler.",
    instructions: [
      "Open the TAC Python sample repo in a separate tab for reference.",
      "Keep this workshop tab open as your checklist and code guide.",
      "Use the prompt builder to choose a name, persona, and model; later you will copy its prompt into SYSTEM_PROMPT and set the matching .env values."
    ]
  },
  "0:1": {
    instructions: [
      "Node.js 22.13 or newer (required by the current TAC SDK).",
      "A Twilio account; the next step walks through buying a Voice-capable number.",
      "A Twilio API Key and API Secret from the Console.",
      "A Google AI Studio API key.",
      "An ngrok account; installation and authentication are covered below."
    ]
  },
  "0:3": {
    body:
      "For the Node.js path, clone this workshop repository and initialise the attendee workspace at its root.",
    instructions: [
      "Clone this workshop repo, enter its root, and enable ES modules there.",
      "Install twilio-agent-connect and @google/genai.",
      "Add a start script that runs server.js."
    ]
  },
  "0:4": {
    body:
      "TAC reads all Twilio credentials and the public domain from environment variables. Copy .env.example and fill in your values.",
    instructions: [
      "Copy .env.example to .env.",
      "Add Account SID, Auth Token, API Key, and API Secret from the Twilio Console.",
      "Set TWILIO_VOICE_PUBLIC_DOMAIN to your ngrok domain without https://."
    ]
  },
  "0:6": {
    instructions: [
      "Start ngrok forwarding to TAC's default port, 8000.",
      "Copy the hostname only (no https://) into TWILIO_VOICE_PUBLIC_DOMAIN in .env.",
      "Open the purchased number in Twilio Console and set A call comes in to Webhook, https://your-ngrok-domain.ngrok-free.app/twiml, HTTP POST.",
      "Leave ngrok running — TAC needs the tunnel active when calls come in."
    ]
  },
  "1:2": {
    title: "The onMessageReady Contract",
    body:
      "Register one async callback. TAC passes a structured object containing the transcribed message and conversation ID, then speaks the string you return.",
    instructions: [
      "message — the caller's transcribed speech as a plain string.",
      "conversationId — use this value to key per-call state.",
      "memory and session — optional conversation context supplied in the callback object."
    ]
  },
  "1:3": {
    instructions: [
      "Caller speaks → Twilio transcribes → TAC calls onMessageReady.",
      "Your handler calls Gemini and returns the reply string.",
      "TAC sends the reply through the voice channel → Twilio speaks it."
    ]
  },
  "2:0": {
    body:
      "TAC is middleware that connects LLM-powered agents to Twilio's communication services. It handles channel routing so you only write a message handler.",
    instructions: [
      "TAC is not PCI compliant or HIPAA eligible — do not use it in regulated workflows.",
      "Supported LLM backends include AWS Bedrock, Azure AI Foundry, OpenAI, and generic providers.",
      "The workshop uses TACServer to handle all webhook and WebSocket plumbing."
    ]
  },
  "2:1": {
    instructions: [
      "Add Account SID, Auth Token, API Key, and API Secret from the Twilio Console.",
      "Set TWILIO_VOICE_PUBLIC_DOMAIN to your ngrok domain without https://.",
      "Keep GOOGLE_API_KEY from the setup step."
    ]
  },
  "2:2": {
    body:
      "Create a TAC instance asynchronously, register a VoiceChannel, and import TACServer. This is the entire server setup.",
    instructions: [
      "Create server.js with this first code block, then append each later server.js block in order.",
      "Import TAC, TACConfig, VoiceChannel, and TACServer from twilio-agent-connect.",
      "Load config from environment variables with TACConfig.fromEnv().",
      "If you customized the prompt builder, replace the default SYSTEM_PROMPT text with your copied prompt.",
      "Create TAC with await TAC.create(), then register the voice channel."
    ]
  },
  "2:3": {
    body:
      "Declare lookupCustomer for Gemini and provide the local function that executes the lookup.",
    instructions: [
      "Append this block to server.js; do not replace the initialization code from the previous step.",
      "Describe the function and its customerId parameter with JSON Schema.",
      "Return plain JSON data that Gemini can use in its answer.",
      "Use the fake record for the workshop; a real app must call an authenticated customer system.",
      "Try it by saying: Look up customer CUST-1001."
    ]
  },
  "2:4": {
    body:
      "Add the lookupCustomer declaration to the Gemini chat, execute requested function calls, and send each result back to Gemini before returning its answer.",
    instructions: [
      "Append this block to server.js after lookupCustomer.",
      "Register the handler with tac.onMessageReady().",
      "Execute lookupCustomer when Gemini returns that function call.",
      "Use conversationId from the callback object to key per-call Gemini chat sessions."
    ]
  },
  "2:5": {
    body:
      "TACServer mounts webhook and WebSocket routes automatically. Await server.start() to launch.",
    instructions: [
      "Append this final block to server.js.",
      "Create TACServer with the configured TAC instance.",
      "Await server.start() — TAC starts listening on port 8000.",
      "Confirm the Twilio voice webhook is the ngrok domain plus /twiml using HTTP POST."
    ]
  }
};

const workshopConfig = window.WORKSHOP_CONFIG || {};
const enableNodeWorkshop = workshopConfig.enableNode === true;
const storageKey = "twilio-cr-tac-state-v1";
const defaultBuilder = {
  name: "Ava",
  persona: "Helpful retail concierge",
  model: "gemini-2.5-flash"
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
const runtimeSwitch = document.querySelector(".runtime-switch");
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
      runtime: enableNodeWorkshop && parsed.runtime === "node" ? "node" : "python",
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
  runtimeSwitch.hidden = !enableNodeWorkshop;
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
  if (!enableNodeWorkshop || state.runtime !== "node") return step;

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
      const runtimeStep = getRuntimeStep(step, activeChapter, index);
      const done = isStepDone(activeChapter, index);
      const current = index === activeStep;
      return `
        <button class="step-link ${done ? "is-done" : ""}" type="button" data-step="${index}" aria-current="${current}">
          <span class="step-state">${done ? icon("check") : index + 1}</span>
          <span>${escapeHtml(runtimeStep.title)}</span>
        </button>
      `;
    })
    .join("");
}

function renderVoiceVisual() {
  const serverName = state.runtime === "node" ? "TACServer" : "TACFastAPIServer";
  const handlerName = state.runtime === "node" ? "onMessageReady" : "on_message_ready";
  return `
    <div class="mission-overview" aria-label="Voice AI agent system overview">
      <div class="chapter-kicker">System overview</div>
      <svg class="mission-overview-svg" viewBox="0 0 940 360" role="img" aria-label="Caller reaches Twilio Voice, ConversationRelay opens a WebSocket to TAC, TAC calls your ${handlerName} handler which asks Gemini Flash, then Twilio speaks the response back.">
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
          <text x="110" y="72" text-anchor="middle">TAC Server</text>
          <text x="110" y="94" text-anchor="middle" class="mission-node-small">${serverName}</text>
        </g>

        <g class="mission-node mission-node-muted" transform="translate(405 236)">
          <rect width="180" height="78" rx="18" />
          <foreignObject x="33" y="22" width="30" height="30">
            <div xmlns="http://www.w3.org/1999/xhtml" class="arch-lucide-icon">${icon("wrench")}</div>
          </foreignObject>
          <text x="108" y="42" text-anchor="middle">Tools</text>
          <text x="108" y="60" text-anchor="middle" class="mission-node-small">lookup</text>
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
  const serverName = state.runtime === "node" ? "TACServer" : "TACFastAPIServer";
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
            <text x="140" y="46" text-anchor="middle">TAC Server</text>
            <text x="140" y="68" text-anchor="middle" class="arch-svg-small">${serverName}</text>
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
  const handlerName = state.runtime === "node" ? "onMessageReady" : "on_message_ready";
  const serverName = state.runtime === "node" ? "TACServer" : "TACFastAPIServer";
  const fallback = [
    ["Call", "A caller dials your Twilio number."],
    ["TAC", `${serverName} handles webhooks and WebSocket connections.`],
    ["Handler", `${handlerName} receives transcribed caller speech.`],
    ["Gemini", "Your handler calls Gemini Flash and returns a reply."],
    ["Voice", "TAC routes the reply back through the voice channel."]
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
      ${activeStep === chapters[activeChapter].steps.length - 1 ? renderQuiz(chapters[activeChapter]) : ""}
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
        In this workshop, you'll build a <strong>voice AI agent</strong> using Twilio Agent Connect (TAC).
        TAC handles all the Twilio plumbing — you write one handler function that calls Gemini and produces a reply.
      </p>

      <article class="callout-card">
        <h2>What You'll Build</h2>
        <p>${escapeHtml(step.body)}</p>
      </article>

      <div class="lesson-page lesson-page-flat">
        <div class="lesson-title-row">
          <div>
            <h2>Open the Sample Repo Now</h2>
            <p class="lesson-lead">Open the TAC sample repo in a new tab so it is ready when you need it.</p>
          </div>
          ${renderStepAction()}
        </div>
        <div class="action-stack">
          <article class="action-card">
            <div class="mini-icon">${icon("github")}</div>
            <div>
              <div class="step-kicker">Step 1</div>
              <strong>Open the TAC sample repo</strong>
              <p>Use the copy button and open the repo in a new browser tab.</p>
            </div>
          </article>
          <article class="action-card">
            <div class="mini-icon">${icon("settings")}</div>
            <div>
              <div class="step-kicker">Step 2</div>
              <strong>Use the builder drawer</strong>
              <p>Pick your agent name, persona, and model. Copy the generated text into SYSTEM_PROMPT, then set AGENT_NAME and GEMINI_MODEL in .env.</p>
            </div>
          </article>
        </div>
        ${renderCode(step)}
      </div>

      <aside class="note">
        <strong>You will also need Google AI Studio and ngrok accounts.</strong> The next step lists every account and local tool.
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
      <p class="lesson-lead">A phone call becomes a stream of text events. TAC manages the WebSocket, Gemini writes the next response, and Twilio turns that text back into audio — your code only sees the text.</p>
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
      ${renderQuiz(chapters[activeChapter])}
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

  // Chapter 0 — Mission Briefing
  if (activeChapter === 0 && activeStep === 0) {
    chapterContent.innerHTML = renderMissionStep(step);
    requestAnimationFrame(initThreeScenes);
    return;
  }

  // Chapter 1 — How It Works: architecture on step 1, flow+simulator on step 3
  if (activeChapter === 1 && activeStep === 1) {
    chapterContent.innerHTML = renderHowItWorksStep(step);
    requestAnimationFrame(initThreeScenes);
    return;
  }
  if (activeChapter === 1 && activeStep === 3) {
    chapterContent.innerHTML = renderConversationFlowStep(step);
    requestAnimationFrame(initThreeScenes);
    return;
  }

  // Chapter 2 — Agent Connect: architecture diagram above first step
  if (activeChapter === 2 && activeStep === 0) {
    chapterContent.innerHTML = `
      <div class="lesson-page">
        ${renderArchitecture()}
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
    model: formData.get("model") || defaultBuilder.model
  };
}

function updateBuilderReadout() {
  const builder = state.builder;
  document.querySelector("#agentNameReadout").textContent = builder.name;
  document.querySelector("#agentPersonaReadout").textContent = builder.persona;
  document.querySelector("#agentModelReadout").textContent = builder.model;
  document.querySelector("#promptPreview").textContent = makePrompt(builder);
}

function makePrompt(builder) {
  const lookupTool = state.runtime === "node" ? "lookupCustomer" : "lookup_customer";
  return [
    `You are ${builder.name}, a ${builder.persona.toLowerCase()} on a live phone call.`,
    "Keep replies short, natural, and easy to understand aloud.",
    "Ask one question at a time.",
    "Do not use markdown, bullet points, links, or code blocks.",
    `Use ${lookupTool} when the caller asks about an account.`,
    "Ask for the caller's customer ID if they have not provided it."
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
    const requestedRuntime = runtimeButton.dataset.runtime === "node" ? "node" : "python";
    state.runtime = requestedRuntime === "node" && enableNodeWorkshop ? "node" : "python";
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
      tool: "Caller: Look up customer CUST-1001. -> Gemini calls lookup_customer(), then speaks the returned account details."
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
