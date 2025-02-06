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
