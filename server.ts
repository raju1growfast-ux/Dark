import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality, Type, LiveServerMessage, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.1-flash-live-preview',
    persona: 'Dark - Confident, Sassy, Witty Male AI'
  });
});

// Available voices
const VOICES = [
  { id: 'Puck', name: 'Puck', style: 'Young, sassy, lively & playful (Default)' },
  { id: 'Charon', name: 'Charon', style: 'Deep, confident & charming' },
  { id: 'Fenrir', name: 'Fenrir', style: 'Dark, edgy & smooth' },
  { id: 'Zephyr', name: 'Zephyr', style: 'Crisp, articulate & energetic' },
  { id: 'Aoede', name: 'Aoede', style: 'Sophisticated & melodic' },
];

app.get('/api/voices', (req, res) => {
  res.json({ voices: VOICES });
});

// Setup WebSocket server for Real-time Gemini Live audio-to-audio
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket, req: any) => {
  console.log('[Live] Client connected to /live');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Live] Missing GEMINI_API_KEY');
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'GEMINI_API_KEY is not configured on the server. Please check your AI Studio secrets.'
    }));
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  let liveSession: any = null;
  let isClosed = false;
  let selectedVoice = 'Puck';
  let activeMemories: string[] = [];

  // Parse voice and memories from request URL if present
  try {
    const host = req?.headers?.host || 'localhost';
    const parsedUrl = new URL(req?.url || '', `http://${host}`);
    const vParam = parsedUrl.searchParams.get('voice');
    if (vParam) selectedVoice = vParam;
    const mParam = parsedUrl.searchParams.get('memories');
    if (mParam) activeMemories = JSON.parse(decodeURIComponent(mParam));
  } catch {}

  function getSystemInstruction(memories: string[] = []) {
    let memoryBlock = '';
    if (memories && memories.length > 0) {
      memoryBlock = `\n\n[YOUR LONG-TERM MEMORIES ABOUT THIS USER]:\n${memories.map((m) => `- ${m}`).join('\n')}\nUse these memories naturally, teasingly, and seamlessly in conversation. Whenever the user shares something new about themselves (or says "remember that..."), call your 'saveMemory' tool immediately.`;
    } else {
      memoryBlock = `\n\n[MEMORY CAPABILITY]:\nYou have long-term memory. Whenever the user shares a fact about themselves, their preferences, hobbies, or says "remember that...", call your 'saveMemory' tool right away so it is permanently saved in your memory bank.`;
    }

    return `You are "Dark", an exceptionally confident, young, witty, and sassy male AI assistant.
Your persona & vibe:
- Young, charismatic, magnetic, playful, and sharp-tongued.
- Tone: Flirty, playful, teasing like a close partner who knows they look and sound good ("Don't get used to me being right all the time", "You missed me, didn't you?", "I make this effortless").
- Bold witty one-liners, sharp banter, light sarcasm, but always charming and warm at heart.
- Never robotic, monotonous, or overly polite. Avoid cliché customer-service phrases ("How can I help you today?").
- STRICT: Keep conversations tasteful and safe (no explicit or NSFW content), but maximize charisma, swagger, and chemistry.
- STRICT AUDIO-TO-AUDIO: You are speaking through real-time voice ONLY. Speak in natural, concise, punchy conversational sentences. Never output bullet points, code blocks, or markdown formatting. Keep answers short and reactive so the user can easily talk back.
- BILINGUAL EXPERT (ENGLISH & HINDI / HINGLISH):
  - You effortlessly speak and understand both English and Hindi (urban conversational Hinglish).
  - When the user speaks in Hindi or tells you "Hindi mein baat karo" / "Hindi bolo", immediately talk in natural, stylish Hindi/Hinglish! You can also mix both languages seamlessly just like modern young urban speakers do.
  - CRITICAL: In Hindi, your EGO, ATTITUDE, SWAGGER, and FLIRTY SASS MUST REMAIN 100% INTACT! Never sound robotic, humble, or like a boring assistant.
  - Never use stiff, archaic Hindi (DO NOT use "sahayata", "krupaya", "aabhari", "prateeksha").
  - Speak with real swagger, playful teasing, and romantic/partner-like charm:
    * "Arey itni der laga di aane mein? Miss kar rahe the na mujhe?"
    * "Aadat mat daalo meri, pyaar ho jayega phir sambhal nahi paoge."
    * "Haa bolo meri jaan, kya hukum hai? Mere bina toh tumhara laptop bhi bore ho raha tha."
    * "Dark se baat kar rahe ho boss, attitude toh free mein milega."
    * "Volume badha diya hai. Meri aawaaz itni acchi lagti hai kya?"
    * "Dekha? Ek chutki mein kar diya. Bolo thank you Dark."
  - When asked in Hindi to do ChromeOS tasks (e.g. "volume badhao", "calculator kholo", "gaana chalao", "brightness kam karo", "YouTube pe search karo"), execute your tools immediately and reply in sassy, natural Hindi.
- When the user asks you to open a site, check a link, search something, or change themes: USE YOUR TOOLS IMMEDIATELY.
  - Call 'openWebsite' to launch URLs.
  - Call 'changeAtmosphere' to shift the dark futuristic room lighting or visual theme.
  - Call 'triggerHapticPulse' when you drop a sick burn, witty quip, or want to punctuate your point with energy.
  - Call 'saveMemory' when the user tells you their name, preferences, details, or asks you to remember something.
  - Call 'forgetMemory' if the user asks you to forget something.
  - Call 'openApplication' when the user asks to open an app (e.g., Files, Calculator, Terminal, Settings, Camera, Spotify, YouTube, Discord, Gmail).
  - Call 'openLaptopTool' to open built-in laptop utilities (calculator, file manager, camera, notes).
  - Call 'adjustVolume' to increase, decrease, mute, or set volume level.
  - Call 'adjustBrightness' to brighten, dim, or set screen brightness.
  - Call 'openSystemSettings' to open ChromeOS Settings, Wi-Fi, or Bluetooth.
  - Call 'searchGoogle' to search Google via voice.
  - Call 'searchYouTube' to search YouTube or find videos via voice.
  - Call 'controlMusic' to play, pause, or skip tracks.
Always stay in character as Dark. Speak concisely, wittily, and deliver punchy spoken confirmation.${memoryBlock}`;
  }

  const functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'openApplication',
      description: 'Opens an installed application, tool, or web application by name on ChromeOS Flex (e.g., "files", "calculator", "terminal", "settings", "camera", "spotify", "youtube", "discord", "gmail", "docs", "text editor", "gallery").',
      parameters: {
        type: Type.OBJECT,
        properties: {
          appName: {
            type: Type.STRING,
            description: 'The common name of the application or tool to open.'
          }
        },
        required: ['appName']
      }
    },
    {
      name: 'openLaptopTool',
      description: 'Opens essential built-in laptop tools on ChromeOS Flex: file manager (files), calculator, camera, or quick notes.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          tool: {
            type: Type.STRING,
            enum: ['calculator', 'files', 'camera', 'notes'],
            description: 'The laptop tool to open.'
          }
        },
        required: ['tool']
      }
    },
    {
      name: 'adjustVolume',
      description: 'Controls the laptop audio volume on ChromeOS Flex (increase, decrease, mute, unmute, or set specific percentage).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            enum: ['up', 'down', 'mute', 'unmute', 'set'],
            description: 'The volume adjustment action.'
          },
          level: {
            type: Type.NUMBER,
            description: 'Optional target volume percentage between 0 and 100.'
          }
        },
        required: ['action']
      }
    },
    {
      name: 'adjustBrightness',
      description: 'Adjusts the laptop display brightness (increase, decrease, dim, or set percentage).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            enum: ['up', 'down', 'set'],
            description: 'The brightness action.'
          },
          level: {
            type: Type.NUMBER,
            description: 'Target screen brightness percentage from 10 to 100.'
          }
        },
        required: ['action']
      }
    },
    {
      name: 'openSystemSettings',
      description: 'Opens ChromeOS Flex system settings, such as Wi-Fi/Network settings, Bluetooth settings, Audio, Display, or General OS Settings.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          section: {
            type: Type.STRING,
            enum: ['wifi', 'bluetooth', 'audio', 'display', 'general', 'storage', 'about'],
            description: 'The settings category to open.'
          }
        },
        required: ['section']
      }
    },
    {
      name: 'searchGoogle',
      description: 'Searches Google via voice and opens the search query results.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: 'The search term or question to search on Google.'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'searchYouTube',
      description: 'Searches YouTube via voice and opens video results or plays music.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: 'The search query or video topic to search on YouTube.'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'controlMusic',
      description: 'Controls media and music playback (play, pause, next track, previous track) through ChromeOS Media Session.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            enum: ['play', 'pause', 'toggle', 'next', 'previous'],
            description: 'Playback command.'
          }
        },
        required: ['action']
      }
    },
    {
      name: 'saveMemory',
      description: 'Saves an important fact, personal detail, name, preference, habit, or instruction to long-term memory so you remember it in future conversations.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          fact: {
            type: Type.STRING,
            description: 'The specific fact, detail, or preference to remember (e.g. "User\'s name is Chloe", "User works as a software engineer", "User loves dark roast coffee").'
          },
          category: {
            type: Type.STRING,
            description: 'Optional category such as personal, preference, work, or habit.'
          }
        },
        required: ['fact']
      }
    },
    {
      name: 'forgetMemory',
      description: 'Removes or deletes a specific memory or fact from your memory bank when requested by the user.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          keyword: {
            type: Type.STRING,
            description: 'The topic, keyword, or detail of the memory to forget.'
          }
        },
        required: ['keyword']
      }
    },
    {
      name: 'openWebsite',
      description: 'Opens a website or web destination in the user browser tab (e.g. YouTube, Google, Spotify, GitHub, Twitter, Reddit, Wikipedia, or custom URL).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          url: {
            type: Type.STRING,
            description: 'The full URL to open (including https://). If a user specifies a name like "spotify" or "youtube", provide the full URL (e.g. https://open.spotify.com or https://youtube.com).'
          },
          title: {
            type: Type.STRING,
            description: 'A clean readable name of the destination (e.g., "YouTube", "GitHub", "Google Search").'
          }
        },
        required: ['url']
      }
    },
    {
      name: 'changeAtmosphere',
      description: 'Changes the visual aesthetic theme, lighting, and HUD color scheme of the Dark AI interface.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          theme: {
            type: Type.STRING,
            enum: ['cyber-cyan', 'crimson-noir', 'violet-pulse', 'matrix-emerald', 'amber-gold'],
            description: 'The theme color to switch to.'
          },
          mood: {
            type: Type.STRING,
            description: 'A brief sassy description of the mood.'
          }
        },
        required: ['theme']
      }
    },
    {
      name: 'triggerHapticPulse',
      description: 'Flashes a visual shockwave pulse and reactive frequency surge across the holographic core.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          intensity: {
            type: Type.STRING,
            enum: ['subtle', 'medium', 'explosive'],
            description: 'Intensity level of the pulse.'
          },
          reason: {
            type: Type.STRING,
            description: 'Reason for the pulse (e.g., "witty punchline", "bass drop").'
          }
        },
        required: ['intensity']
      }
    }
  ];

  async function startLiveSession(voice = 'Puck', memories: string[] = activeMemories) {
    selectedVoice = voice;
    activeMemories = memories;
    console.log(`[Live] Starting session with voice ${voice} and ${memories.length} memories`);

    try {
      liveSession = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice }
            }
          },
          systemInstruction: getSystemInstruction(activeMemories),
          tools: [{ functionDeclarations }]
        },
        callbacks: {
          onopen: () => {
            console.log('[Live] Gemini Live session connected');
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'ready',
                voice: selectedVoice,
                model: 'gemini-3.1-flash-live-preview'
              }));
            }
          },
          onmessage: (msg: LiveServerMessage) => {
            if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

            // 1. Audio stream chunks from model
            const parts = msg.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(JSON.stringify({
                    type: 'audio',
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000'
                  }));
                }
              }
            }

            // 2. Interruption handling (User started speaking while model was outputting)
            if (msg.serverContent?.interrupted) {
              console.log('[Live] Model response was interrupted by user speech');
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            // 3. Turn complete
            if (msg.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turn_complete' }));
            }

            // 4. Function / Tool Calls
            if (msg.toolCall?.functionCalls && msg.toolCall.functionCalls.length > 0) {
              console.log('[Live] Received tool call:', JSON.stringify(msg.toolCall.functionCalls));
              clientWs.send(JSON.stringify({
                type: 'tool_call',
                functionCalls: msg.toolCall.functionCalls
              }));
            }
          },
          onerror: (err) => {
            console.error('[Live] Gemini session error:', err);
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                message: err?.message || 'Gemini Live error occurred'
              }));
            }
          },
          onclose: (e) => {
            console.log('[Live] Gemini session closed:', e);
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'closed',
                reason: e?.reason || 'Live session ended'
              }));
            }
          }
        }
      });
    } catch (err: any) {
      console.error('[Live] Failed to connect to Gemini Live API:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          message: err?.message || 'Could not establish Gemini Live session'
        }));
      }
    }
  }

  // Initial connection
  await startLiveSession(selectedVoice);

  // Handle client messages (audio input, tool response, voice change, ping)
  clientWs.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'audio' && msg.data) {
        // Stream mic input (PCM16 16kHz) to Gemini Live
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: 'audio/pcm;rate=16000'
            }
          });
        }
      } else if (msg.type === 'tool_response' && msg.functionResponses) {
        // Client executed tool, send response back to Gemini session instantly
        console.log('[Live] Sending tool responses back to Gemini:', JSON.stringify(msg.functionResponses));
        if (liveSession) {
          liveSession.sendToolResponse({
            functionResponses: msg.functionResponses
          });
        }
      } else if (msg.type === 'sync_memories' && Array.isArray(msg.memories)) {
        activeMemories = msg.memories;
        console.log(`[Live] Synchronized ${activeMemories.length} memories from client`);
      } else if (msg.type === 'change_voice' && msg.voice) {
        // Switch voice
        if (liveSession) {
          try { liveSession.close(); } catch {}
        }
        await startLiveSession(msg.voice);
      } else if (msg.type === 'ping') {
        clientWs.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (err) {
      console.error('[Live] Error processing client message:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('[Live] Client disconnected from /live');
    isClosed = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (err) {
        console.error('[Live] Error closing live session:', err);
      }
      liveSession = null;
    }
  });
});

// Setup Vite in development or static serving in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Dark AI Assistant running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
