// grpc-library/src/server.ts
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { stringToUuid } from "@elizaos/core";
import { composeContext } from "@elizaos/core";
import { generateMessageResponse } from "@elizaos/core";
import { messageCompletionFooter } from "@elizaos/core";
import { AgentRuntime } from "@elizaos/core";
import {
    Content,
    Memory,
    ModelClass,
} from "@elizaos/core";
import {
    elizaLogger,
    getEmbeddingZeroVector,
} from "@elizaos/core";
import { hashUserMsg } from "./utilities/format";

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
const PROTO_PATH = path.resolve(__dirname, './protos/index.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
const { Greeter } = grpcObject.helloworld;

export class GrpcServer {
  private server: grpc.Server;
  private readonly port: string = '0.0.0.0:50051';
  private agents: Map<string, any>; // container management

  constructor() {
    this.server = new grpc.Server();
    this.agents = new Map();
    this.initializeServices();
  }

  private initializeServices() {
    this.server.addService(Greeter.service, {
      SayHello: (call: any, callback: any) => {
        callback(null, { message: `Hello, ${call.request.name}!` });
      },
      SayGoodbye: (call: any, callback: any) => {
        callback(null, { message: `Goodbye, ${call.request.name}!` });
      },
      GetUserDetails: (call: any, callback: any) => {
        callback(null, { user_id: call.request.user_id, name: 'John Doe', email: 'johndoe@example.com' });
      },
      SendMessage: async (call: any, callback: any) => {
        let { agentId, userId, roomId, text, attachments,userName,name } = call.request;
        console.log(`Received message for agent ${agentId}`);
        roomId = stringToUuid(
            roomId ?? "default-room-" + agentId
        );
        userId = stringToUuid(userId ?? "user");


        let runtime = this.agents.get(agentId);
        if (!runtime) {
          runtime = Array.from(this.agents.values()).find(
            (a) => a.character.name.toLowerCase() === agentId.toLowerCase()
          );
        }

        if (!runtime) {
          callback({ code: grpc.status.NOT_FOUND, message: 'Agent not found' });
          return;
        }

        await runtime.ensureConnection(userId, roomId, userName, name, 'direct');

        const messageId = stringToUuid(Date.now().toString());
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
        await runtime.messageManager.createMemory(memory);
        let state = await runtime.composeState(userMessage, {
            agentName: runtime.character.name,
        });
        let msgHash = hashUserMsg(userMessage, "direct_client:");
        let response: Content = await runtime.cacheManager.get(msgHash);
        if(!response){
            const context = composeContext({
                state,
                template: messageHandlerTemplate,
            });

            response = await generateMessageResponse({
                runtime: runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            if (!response) {
                callback(null, { message: `response` });
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
        await runtime.evaluate(memory, state);

        // Check if we should suppress the initial message
        const action = runtime.actions.find(
            (a) => a.name === response.action
        );
        const shouldSuppressInitialMessage =
            action?.suppressInitialMessage;

        if (!shouldSuppressInitialMessage) {
            if (message) {
                callback(null,[response, message])

            } else {
                callback(null,[response])
            }
        } else {
            if (message) {
                callback(null,[message])
            } else {
                callback(null,[])
            }
        }
      },
      SendFileStream: (call: any, callback: any) => {
        let fileData: Buffer[] = [];
        let fileName = '';

        call.on('data', (chunk: any) => {
          if (chunk.fileName) {
            fileName = chunk.fileName;
          }
          if (chunk.fileData) {
            fileData.push(chunk.fileData);
          }
        });

        call.on('end', () => {
          const filePath = path.join(__dirname, 'uploads', fileName);
          require('fs').writeFileSync(filePath, Buffer.concat(fileData));
          console.log(`File saved: ${filePath}`);
          callback(null, { message: `File received: ${fileName}` });
        });
      },
    });
  }
    public registerAgent(runtime: AgentRuntime) {
        this.agents.set(runtime.agentId, runtime);
    }

    public unregisterAgent(runtime: AgentRuntime) {
        this.agents.delete(runtime.agentId);
    }
  public start() {
    this.server.bindAsync(this.port, grpc.ServerCredentials.createInsecure(), (err) => {
      if (err) {
        console.error('Failed to bind gRPC server:', err);
        return;
      }
      console.log(`gRPC Server running on port ${this.port}`);
    });
    // Handle graceful shutdown
    const gracefulShutdown = () => {
        elizaLogger.info("Received shutdown signal, closing server...");
        this.server.tryShutdown(() => {
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
    this.server.tryShutdown((err) => {
      if (err) {
        console.error('Error shutting down server:', err);
      } else {
        console.log('gRPC Server stopped successfully');
      }
    });
  }
}
