import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import {
    AgentRuntime,
    elizaLogger,
    getEnvVariable,
    validateCharacterConfig,
} from "@elizaos/core";

import { REST, Routes } from "discord.js";
import { DirectClient } from "../index";
import { stringToUuid } from "@elizaos/core";
// import authMiddleware from "../middleware/auth";
import listCharactorExample from "../controllers/agentControllers/listCharactorExample"

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function createAgentRouter(
    agents: Map<string, AgentRuntime>,
    directClient: DirectClient
) {
    const router = express.Router();

    router.use(cors());
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));
    router.use(
        express.json({
            limit: getEnvVariable("EXPRESS_MAX_PAYLOAD") || "100kb",
        })
    );

    router.get("/", (req, res) => {
        const agentsList = Array.from(agents.values()).map((agent) => ({
            id: agent.agentId,
            name: agent.character.name,
            clients: Object.keys(agent.clients),
        }));
        res.json({ agents: agentsList });
    });
    router.get("/examples", listCharactorExample)
    router.get("/:agentId", (req, res) => {
        const agentId = req.params.agentId;
        const agent = agents.get(agentId);

        if (!agent) {
            res.status(404).json({ error: "Agent not found" });
            return;
        }

        res.json({
            id: agent.agentId,
            character: agent.character,
        });
    });

    router.post("/:agentId/set", async (req, res) => {

        const agentId = req.params.agentId;
        console.log("agentId", agentId);
        let agent: AgentRuntime = agents.get(agentId);

        // update character
        if (agent) {
            // stop agent
            agent.stop();
            directClient.unregisterAgent(agent);
            // if it has a different name, the agentId will change
        }

        // load character from body
        const character = req.body;
        try {
            validateCharacterConfig(character);
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            res.status(400).json({
                success: false,
                message: e.message,
            });
            return;
        }

        // start it up (and register it)
        agent = await directClient.startAgent(character);
        elizaLogger.info(`${character.name} started`);

        res.json({
            id: character.id,
            character: character,
        });
    });

    router.get("/:agentId/stop", async (req, res) => {
        const agentId = req.params.agentId;
        console.log("agentId", agentId);
        const agent: AgentRuntime = agents.get(agentId);
        try {
            if (agent) {
                agent.stop();
                directClient.unregisterAgent(agent);
            }
            res.json({
                code: 200,
                status: "success",
                message: "Agent stopped",
            });
        } catch (error) {
            console.log("/:agentId/stop", error)
            res.json({
                code: 400,
                status: "success",
                message: "Agent stopped",
            });
        }
        // update character


    })
    router.post("/new2", async (req, res) => {
        // const samepleAgentId = req.params.sampleAgentId
        const {sampleAgentId, name} = req.body;
        console.info('1');
        // const samplesDir = path.join(__dirname, '../../../characters/data/samples');
        const mapDataPath = path.join(__dirname, '../../../characters/data/mapData.json');
        let sampleAgents;
        try {
            const data = await fs.promises.readFile(mapDataPath, 'utf8');
            sampleAgents = JSON.parse(data);
        } catch (readErr) {
            elizaLogger.info('error read file mapData.json:', readErr);
        }
        let sampleAgentInfo = Array.isArray(sampleAgents) ? sampleAgents.find((e) => e.id === sampleAgentId) : null;
        const agentSamplePath = path.join(__dirname, `../../../characters/samples/${sampleAgentInfo.name}.character.json`);
        let sampleAgentCharacterData;
        let sampleAgentWriteFile;

        const data = await fs.promises.readFile(agentSamplePath, 'utf8');
        sampleAgentCharacterData = JSON.parse(data);
        elizaLogger.info('sampleAgentCharacterData:', data);
        sampleAgentWriteFile = sampleAgentCharacterData

        sampleAgentCharacterData.name = name;
        sampleAgentWriteFile.name = name;
        try {
            validateCharacterConfig(sampleAgentCharacterData);
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            res.status(400).json({
                success: false,
                message: e.message,
            });
            return;
        }

        // start it up (and register it)
        await directClient.startAgent(sampleAgentCharacterData);
        elizaLogger.info(`${sampleAgentCharacterData.name} started`);
        const newCharacterPath = path.join(__dirname, `../../../characters/data/${sampleAgentCharacterData.id}.${sampleAgentInfo.name}.character.json`);
        try {
            await fs.promises.writeFile(newCharacterPath, JSON.stringify(sampleAgentWriteFile, null, 2), 'utf8');
            elizaLogger.info(`Character data saved to ${newCharacterPath}`);
        } catch (writeErr) {
            elizaLogger.error(`Error writing character data to file: ${writeErr}`);
            res.status(500).json({
            success: false,
            message: "Failed to save character data",
            });
            return;
        }

        // Update mapData.json with new character
        sampleAgents.push({
            id: sampleAgentCharacterData.id,
            name: sampleAgentCharacterData.name,
        });

        try {
            const updatedSampleAgents = sampleAgents.map(agent => {
                if (agent.id === sampleAgentId) {
                    return {
                        ...agent,
                        clone: [...(agent.clone || []), sampleAgentCharacterData.id]
                    };
                }
                return agent;
            });
            await fs.promises.writeFile(mapDataPath, JSON.stringify(updatedSampleAgents, null, 2), 'utf8');
            elizaLogger.info(`mapData.json updated with new character`);
        } catch (writeErr) {
            elizaLogger.error(`Error updating mapData.json: ${writeErr}`);
            res.status(500).json({
            success: false,
            message: "Failed to update mapData.json",
            });
            return;
        }
        res.json({
            id: sampleAgentCharacterData.id,
            character: sampleAgentCharacterData,
        });
    });
    router.post("/new", async (req, res) => {
        // load character from body
        const character = req.body;
        try {
            validateCharacterConfig(character);
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            res.status(400).json({
                success: false,
                message: e.message,
            });
            return;
        }

        // start it up (and register it)
        await directClient.startAgent(character);
        elizaLogger.info(`${character.name} started`);

        res.json({
            id: character.id,
            character: character,
        });
    });

    router.get("/:agentId/channels",async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = agents.get(agentId);

        if (!runtime) {
            res.status(404).json({ error: "Runtime not found" });
            return;
        }

        const API_TOKEN = runtime.getSetting("DISCORD_API_TOKEN") as string;
        const rest = new REST({ version: "10" }).setToken(API_TOKEN);

        try {
            const guilds = (await rest.get(Routes.userGuilds())) as Array<any>;

            res.json({
                id: runtime.agentId,
                guilds: guilds,
                serverCount: guilds.length,
            });
        } catch (error) {
            console.error("Error fetching guilds:", error);
            res.status(500).json({ error: "Failed to fetch guilds" });
        }
    });

    router.get("/:agentId/:roomId/memories", async (req, res) => {
        const agentId = req.params.agentId;
        const roomId = stringToUuid(req.params.roomId);
        let runtime = agents.get(agentId);

        // if runtime is null, look for runtime with the same name
        if (!runtime) {
            runtime = Array.from(agents.values()).find(
                (a) => a.character.name.toLowerCase() === agentId.toLowerCase()
            );
        }

        if (!runtime) {
            res.status(404).send("Agent not found");
            return;
        }

        try {
            const memories = await runtime.messageManager.getMemories({
                roomId,
            });
            const response = {
                agentId,
                roomId,
                memories: memories.map((memory) => ({
                    id: memory.id,
                    userId: memory.userId,
                    agentId: memory.agentId,
                    createdAt: memory.createdAt,
                    content: {
                        text: memory.content.text,
                        action: memory.content.action,
                        source: memory.content.source,
                        url: memory.content.url,
                        inReplyTo: memory.content.inReplyTo,
                        attachments: memory.content.attachments?.map(
                            (attachment) => ({
                                id: attachment.id,
                                url: attachment.url,
                                title: attachment.title,
                                source: attachment.source,
                                description: attachment.description,
                                text: attachment.text,
                                contentType: attachment.contentType,
                            })
                        ),
                    },
                    embedding: memory.embedding,
                    roomId: memory.roomId,
                    unique: memory.unique,
                    similarity: memory.similarity,
                })),
            };

            res.json(response);
        } catch (error) {
            console.error("Error fetching memories:", error);
            res.status(500).json({ error: "Failed to fetch memories" });
        }
    });

    return router;
}
