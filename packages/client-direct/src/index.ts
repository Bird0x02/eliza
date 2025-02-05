import bodyParser from "body-parser";
import cors from "cors";
import express
// , { Request as ExpressRequest}
        from "express";
import multer from "multer";
import {
    elizaLogger,
    // generateCaption,
    // generateImage,
    Media,
    getEmbeddingZeroVector,
    CacheOptions
} from "@elizaos/core";
import { composeContext } from "@elizaos/core";
import { generateMessageResponse } from "@elizaos/core";
import { messageCompletionFooter } from "@elizaos/core";
import { AgentRuntime } from "@elizaos/core";
import {
    Content,
    Memory,
    ModelClass,
    Client,
    IAgentRuntime,
} from "@elizaos/core";
import { stringToUuid } from "@elizaos/core";
import { settings } from "@elizaos/core";
import  createApiRouter from "./routes/index";
import * as fs from "fs";
import * as path from "path";
import crypto from 'crypto';
import { hashUserMsg } from "./utilities/format";

function normalizeText(text: string): string {
    return text
        .toLowerCase()           // Convert to lowercase
        .replace(/\s+/g, ' ')   // Replace multiple spaces/newlines with a single space
        .trim();                 // Trim leading and trailing spaces
}

function hashText(text: string): string {
    return crypto.createHash('sha256')
                 .update(text, 'utf8')
                 .digest('hex');
}

function normalizeUserMsg(userMsg: any): string {
    const text = normalizeText(userMsg.content.text);
    return hashText("direct_client:" + userMsg.agentId + userMsg.roomId + userMsg.userId + text);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "data", "uploads");
        // Create the directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({ storage });

export const messageHandlerTemplate0 =
    // {{goals}}
    `# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

{{actions}}

# Instructions: Write the next message for {{agentName}}.

` + messageCompletionFooter;


export const messageHandlerTemplate =
    // {{goals}}
    `
# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)
# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing plaintext only.

{{recentMessages}}

{{actions}}

# Instructions: Write the next message for {{agentName}}.

` + messageCompletionFooter;

export class DirectClient {
    public app: express.Application;
    private agents: Map<string, AgentRuntime>; // container management
    private server: any; // Store server instance
    public startAgent: Function; // Store startAgent functor
    constructor() {
        elizaLogger.info("DirectClient constructor");
        this.app = express();
        this.app.use(cors());
        this.agents = new Map();

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        // Serve both uploads and generated images
        this.app.use(
            "/media/uploads",
            express.static(path.join(process.cwd(), "/data/uploads"))
        );
        this.app.use(
            "/media/generated",
            express.static(path.join(process.cwd(), "/generatedImages"))
        );

        const apiRouter = createApiRouter(this.agents, this);
        this.app.use(apiRouter);

        // Define an interface that extends the Express Request interface
            // interface CustomRequest extends ExpressRequest {
            //     file?: Express.Multer.File;
            // }

        // Update the route handler to use CustomRequest instead of express.Request
        // this.app.post(
        //     "/:agentId/whisper",
        //     upload.single("file"),
        //     async (req: CustomRequest, res: express.Response) => {
        //         const audioFile = req.file; // Access the uploaded file using req.file
        //         const agentId = req.params.agentId;

        //         if (!audioFile) {
        //             res.status(400).send("No audio file provided");
        //             return;
        //         }

        //         let runtime = this.agents.get(agentId);

        //         // if runtime is null, look for runtime with the same name
        //         if (!runtime) {
        //             runtime = Array.from(this.agents.values()).find(
        //                 (a) =>
        //                     a.character.name.toLowerCase() ===
        //                     agentId.toLowerCase()
        //             );
        //         }

        //         if (!runtime) {
        //             res.status(404).send("Agent not found");
        //             return;
        //         }

        //         const formData = new FormData();
        //         const audioBlob = new Blob([audioFile.buffer], {
        //             type: audioFile.mimetype,
        //         });
        //         formData.append("file", audioBlob, audioFile.originalname);
        //         formData.append("model", "whisper-1");

        //         const response = await fetch(
        //             "https://api.openai.com/v1/audio/transcriptions",
        //             {
        //                 method: "POST",
        //                 headers: {
        //                     Authorization: `Bearer ${runtime.token}`,
        //                 },
        //                 body: formData,
        //             }
        //         );

        //         const data = await response.json();
        //         res.json(data);
        //     }
        // );

        this.app.post(
            "/:agentId/message",
            upload.single("file"),
            async (req: express.Request, res: express.Response) => {
                elizaLogger.info("Validate ...");
                const agentId = req.params.agentId;
                const roomId = stringToUuid(
                    req.body.roomId ?? "default-room-" + agentId
                );
                const userId = stringToUuid(req.body.userId ?? "user");

                let runtime = this.agents.get(agentId);

                // if runtime is null, look for runtime with the same name
                if (!runtime) {
                    runtime = Array.from(this.agents.values()).find(
                        (a) =>
                            a.character.name.toLowerCase() ===
                            agentId.toLowerCase()
                    );
                }

                if (!runtime) {
                    res.status(404).send("Agent not found");
                    return;
                }

                await runtime.ensureConnection(
                    userId,
                    roomId,
                    req.body.userName,
                    req.body.name,
                    "direct"
                );

                const text = req.body.text;
                const messageId = stringToUuid(Date.now().toString());

                const attachments: Media[] = [];
                if (req.file) {
                    const filePath = path.join(
                        process.cwd(),
                        "data",
                        "uploads",
                        req.file.filename
                    );
                    attachments.push({
                        id: Date.now().toString(),
                        url: filePath,
                        title: req.file.originalname,
                        source: "direct",
                        description: `Uploaded file: ${req.file.originalname}`,
                        text: "",
                        contentType: req.file.mimetype,
                    });
                }

                const content: Content = {
                    text,
                    attachments,
                    source: "direct",
                    inReplyTo: undefined,
                };

                const userMessage = {
                    content,
                    userId,
                    roomId,
                    agentId: runtime.agentId,
                };

                const memory: Memory = {
                    id: stringToUuid(messageId + "-" + userId),
                    ...userMessage,
                    agentId: runtime.agentId,
                    userId,
                    roomId,
                    content,
                    createdAt: Date.now(),
                };
                elizaLogger.info("---memory sniffer 1 ----");
                elizaLogger.info(JSON.stringify(memory));
                elizaLogger.info("---------------------");

                // elizaLogger.info("addEmbeddingToMemory...");
                // await runtime.messageManager.addEmbeddingToMemory(memory);
                // elizaLogger.info("addEmbeddingToMemory ...done >>>");
                // elizaLogger.info("---memory sniffer 2 ----");
                // elizaLogger.info(JSON.stringify(memory));
                // elizaLogger.info("---------------------");

                elizaLogger.info("createMemory ...");
                await runtime.messageManager.createMemory(memory);
                elizaLogger.info("createMemory ...done!");

                elizaLogger.info("ai compose state ...");
                let state = await runtime.composeState(userMessage, {
                    agentName: runtime.character.name,
                });
                elizaLogger.info("ai compose state ...done!");

                let msgHash = hashUserMsg(userMessage, "direct_client:");
                let response: Content = await runtime.cacheManager.get(msgHash);

                if(!response){
                    elizaLogger.info("ai compose text ...");
                    const context = composeContext({
                        state,
                        template: messageHandlerTemplate,
                    });
                    elizaLogger.info("ai compose text ...done!");

                    elizaLogger.info("------ context >>>> ",context)

                    elizaLogger.info("ai compose response ...");
                    response = await generateMessageResponse({
                        runtime: runtime,
                        context,
                        modelClass: ModelClass.SMALL,
                    });
                    elizaLogger.info("ai compose response ...done!");

                    if (!response) {
                        res.status(500).send(
                            "No response from generateMessageResponse"
                        );
                        return;
                    }

                    elizaLogger.info("set cache >>>>", msgHash, response);
                    await runtime.cacheManager.set(msgHash, response, {expires: Date.now() + 300000});
                }
                else{
                    elizaLogger.info("[direct-client] use cache: ", msgHash, response);
                }

                const responseMessage: Memory = {
                    id: stringToUuid(messageId + "-" + runtime.agentId),
                    ...userMessage,
                    userId: runtime.agentId,
                    content: response,
                    embedding: getEmbeddingZeroVector(),
                    createdAt: Date.now(),
                };
                await runtime.messageManager.createMemory(responseMessage);

                state = await runtime.updateRecentMessageState(state);

                elizaLogger.info("process actions...");
                let message = null as Content | null;
                await runtime.processActions(
                    memory,
                    [responseMessage],
                    state,
                    async (newMessages) => {
                        message = newMessages;
                        return [memory];
                    }
                );
                elizaLogger.info("process actions...done!");

                elizaLogger.info("evaluate...");
                await runtime.evaluate(memory, state);
                elizaLogger.info("evaluate...done!");

                // Check if we should suppress the initial message
                const action = runtime.actions.find(
                    (a) => a.name === response.action
                );
                const shouldSuppressInitialMessage =
                    action?.suppressInitialMessage;

                if (!shouldSuppressInitialMessage) {
                    if (message) {
                        res.json([response, message]);
                    } else {
                        res.json([response]);
                    }
                } else {
                    if (message) {
                        res.json([message]);
                    } else {
                        res.json([]);
                    }
                }
            }
        );

        // this.app.post(
        //     "/:agentId/image",
        //     async (req: express.Request, res: express.Response) => {
        //         const agentId = req.params.agentId;
        //         const agent = this.agents.get(agentId);
        //         if (!agent) {
        //             res.status(404).send("Agent not found");
        //             return;
        //         }

        //         const images = await generateImage({ ...req.body }, agent);
        //         const imagesRes: { image: string; caption: string }[] = [];
        //         if (images.data && images.data.length > 0) {
        //             for (let i = 0; i < images.data.length; i++) {
        //                 const caption = await generateCaption(
        //                     { imageUrl: images.data[i] },
        //                     agent
        //                 );
        //                 imagesRes.push({
        //                     image: images.data[i],
        //                     caption: caption.title,
        //                 });
        //             }
        //         }
        //         res.json({ images: imagesRes });
        //     }
        // );

        // this.app.post(
        //     "/fine-tune",
        //     async (req: express.Request, res: express.Response) => {
        //         try {
        //             const response = await fetch(
        //                 "https://api.bageldb.ai/api/v1/asset",
        //                 {
        //                     method: "POST",
        //                     headers: {
        //                         "Content-Type": "application/json",
        //                         "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
        //                     },
        //                     body: JSON.stringify(req.body),
        //                 }
        //             );

        //             const data = await response.json();
        //             res.json(data);
        //         } catch (error) {
        //             res.status(500).json({
        //                 error: "Please create an account at bakery.bagel.net and get an API key. Then set the BAGEL_API_KEY environment variable.",
        //                 details: error.message,
        //             });
        //         }
        //     }
        // );
        // this.app.get(
        //     "/fine-tune/:assetId",
        //     async (req: express.Request, res: express.Response) => {
        //         const assetId = req.params.assetId;
        //         const downloadDir = path.join(
        //             process.cwd(),
        //             "downloads",
        //             assetId
        //         );

        //         elizaLogger.info("Download directory:", downloadDir);

        //         try {
        //             elizaLogger.info("Creating directory...");
        //             await fs.promises.mkdir(downloadDir, { recursive: true });

        //             elizaLogger.info("Fetching file...");
        //             const fileResponse = await fetch(
        //                 `https://api.bageldb.ai/api/v1/asset/${assetId}/download`,
        //                 {
        //                     headers: {
        //                         "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
        //                     },
        //                 }
        //             );

        //             if (!fileResponse.ok) {
        //                 throw new Error(
        //                     `API responded with status ${fileResponse.status}: ${await fileResponse.text()}`
        //                 );
        //             }

        //             elizaLogger.info("Response headers:", fileResponse.headers);

        //             const fileName =
        //                 fileResponse.headers
        //                     .get("content-disposition")
        //                     ?.split("filename=")[1]
        //                     ?.replace(/"/g, /* " */ "") || "default_name.txt";

        //             elizaLogger.info("Saving as:", fileName);

        //             const arrayBuffer = await fileResponse.arrayBuffer();
        //             const buffer = Buffer.from(arrayBuffer);

        //             const filePath = path.join(downloadDir, fileName);
        //             elizaLogger.info("Full file path:", filePath);

        //             await fs.promises.writeFile(filePath, buffer);

        //             // Verify file was written
        //             const stats = await fs.promises.stat(filePath);
        //             elizaLogger.info(
        //                 "File written successfully. Size:",
        //                 stats.size,
        //                 "bytes"
        //             );

        //             res.json({
        //                 success: true,
        //                 message: "Single file downloaded successfully",
        //                 downloadPath: downloadDir,
        //                 fileCount: 1,
        //                 fileName: fileName,
        //                 fileSize: stats.size,
        //             });
        //         } catch (error) {
        //             console.error("Detailed error:", error);
        //             res.status(500).json({
        //                 error: "Failed to download files from BagelDB",
        //                 details: error.message,
        //                 stack: error.stack,
        //             });
        //         }
        //     }
        // );

        // this.app.post("/:agentId/speak", async (req, res) => {
        //     const agentId = req.params.agentId;
        //     const roomId = stringToUuid(req.body.roomId ?? "default-room-" + agentId);
        //     const userId = stringToUuid(req.body.userId ?? "user");
        //     const text = req.body.text;

        //     if (!text) {
        //         res.status(400).send("No text provided");
        //         return;
        //     }

        //     let runtime = this.agents.get(agentId);

        //     // if runtime is null, look for runtime with the same name
        //     if (!runtime) {
        //         runtime = Array.from(this.agents.values()).find(
        //             (a) => a.character.name.toLowerCase() === agentId.toLowerCase()
        //         );
        //     }

        //     if (!runtime) {
        //         res.status(404).send("Agent not found");
        //         return;
        //     }

        //     try {
        //         // Process message through agent (same as /message endpoint)
        //         await runtime.ensureConnection(
        //             userId,
        //             roomId,
        //             req.body.userName,
        //             req.body.name,
        //             "direct"
        //         );

        //         const messageId = stringToUuid(Date.now().toString());

        //         const content: Content = {
        //             text,
        //             attachments: [],
        //             source: "direct",
        //             inReplyTo: undefined,
        //         };

        //         const userMessage = {
        //             content,
        //             userId,
        //             roomId,
        //             agentId: runtime.agentId,
        //         };

        //         const memory: Memory = {
        //             id: messageId,
        //             agentId: runtime.agentId,
        //             userId,
        //             roomId,
        //             content,
        //             createdAt: Date.now(),
        //         };

        //         await runtime.messageManager.createMemory(memory);

        //         const state = await runtime.composeState(userMessage, {
        //             agentName: runtime.character.name,
        //         });

        //         const context = composeContext({
        //             state,
        //             template: messageHandlerTemplate,
        //         });

        //         const response = await generateMessageResponse({
        //             runtime: runtime,
        //             context,
        //             modelClass: ModelClass.LARGE,
        //         });

        //         // save response to memory
        //         const responseMessage = {
        //             ...userMessage,
        //             userId: runtime.agentId,
        //             content: response,
        //         };

        //         await runtime.messageManager.createMemory(responseMessage);

        //         if (!response) {
        //             res.status(500).send("No response from generateMessageResponse");
        //             return;
        //         }

        //         await runtime.evaluate(memory, state);

        //         const _result = await runtime.processActions(
        //             memory,
        //             [responseMessage],
        //             state,
        //             async () => {
        //                 return [memory];
        //             }
        //         );

        //         // Get the text to convert to speech
        //         const textToSpeak = response.text;

        //         // Convert to speech using ElevenLabs
        //         const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`;
        //         const apiKey = process.env.ELEVENLABS_XI_API_KEY;

        //         if (!apiKey) {
        //             throw new Error("ELEVENLABS_XI_API_KEY not configured");
        //         }

        //         const speechResponse = await fetch(elevenLabsApiUrl, {
        //             method: "POST",
        //             headers: {
        //                 "Content-Type": "application/json",
        //                 "xi-api-key": apiKey,
        //             },
        //             body: JSON.stringify({
        //                 text: textToSpeak,
        //                 model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
        //                 voice_settings: {
        //                     stability: parseFloat(process.env.ELEVENLABS_VOICE_STABILITY || "0.5"),
        //                     similarity_boost: parseFloat(process.env.ELEVENLABS_VOICE_SIMILARITY_BOOST || "0.9"),
        //                     style: parseFloat(process.env.ELEVENLABS_VOICE_STYLE || "0.66"),
        //                     use_speaker_boost: process.env.ELEVENLABS_VOICE_USE_SPEAKER_BOOST === "true",
        //                 },
        //             }),
        //         });

        //         if (!speechResponse.ok) {
        //             throw new Error(`ElevenLabs API error: ${speechResponse.statusText}`);
        //         }

        //         const audioBuffer = await speechResponse.arrayBuffer();

        //         // Set appropriate headers for audio streaming
        //         res.set({
        //             'Content-Type': 'audio/mpeg',
        //             'Transfer-Encoding': 'chunked'
        //         });

        //         res.send(Buffer.from(audioBuffer));

        //     } catch (error) {
        //         console.error("Error processing message or generating speech:", error);
        //         res.status(500).json({
        //             error: "Error processing message or generating speech",
        //             details: error.message
        //         });
        //     }
        // });
    }

    // agent/src/index.ts:startAgent calls this
    public registerAgent(runtime: AgentRuntime) {
        this.agents.set(runtime.agentId, runtime);
    }

    public unregisterAgent(runtime: AgentRuntime) {
        this.agents.delete(runtime.agentId);
    }

    public start(port: number) {
        this.server = this.app.listen(port, '0.0.0.0', () => {
            elizaLogger.success(
                `REST API bound to 0.0.0.0:${port}. If running locally, access it at http://localhost:${port}.`
            );
        });

        // Handle graceful shutdown
        const gracefulShutdown = () => {
            elizaLogger.info("Received shutdown signal, closing server...");
            this.server.close(() => {
                elizaLogger.success("Server closed successfully");
                process.exit(0);
            });

            // Force close after 5 seconds if server hasn't closed
            setTimeout(() => {
                elizaLogger.error(
                    "Could not close connections in time, forcefully shutting down"
                );
                process.exit(1);
            }, 5000);
        };

        // Handle different shutdown signals
        process.on("SIGTERM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);
    }

    public stop() {
        if (this.server) {
            this.server.close(() => {
                elizaLogger.success("Server stopped");
            });
        }
    }
}

export const DirectClientInterface: Client = {
    start: async (_runtime: IAgentRuntime) => {
        elizaLogger.info("DirectClientInterface start");
        const client = new DirectClient();
        const serverPort = parseInt(settings.SERVER_PORT || "3000");
        client.start(serverPort);
        return client;
    },
    stop: async (_runtime: IAgentRuntime, client?: Client) => {
        if (client instanceof DirectClient) {
            client.stop();
        }
    },
};

export default DirectClientInterface;
