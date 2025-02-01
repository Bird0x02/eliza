import Redis from "ioredis";
import { type IDatabaseCacheAdapter, type UUID, elizaLogger } from "@elizaos/core";

export class RedisClient implements IDatabaseCacheAdapter {
    private client: Redis;

    constructor(redisUrl: string) {
        this.client = new Redis(redisUrl);

        this.client.on("connect", () => {
            elizaLogger.success("Connected to Redis");
        });

        this.client.on("error", (err) => {
            elizaLogger.error("Redis error:", err);
        });
    }

    // Key-Value Operations
    async getCache(params: { agentId: UUID; key: string }): Promise<string | undefined> {
        try {
            const redisKey = this.buildKey(params.agentId, params.key);
            const value = await this.client.get(redisKey);
            return value || undefined;
        } catch (err) {
            elizaLogger.error("Error getting cache:", err);
            return undefined;
        }
    }

    async setCache(params: { agentId: UUID; key: string; value: string }): Promise<boolean> {
        try {
            const redisKey = this.buildKey(params.agentId, params.key);
            await this.client.set(redisKey, params.value);
            return true;
        } catch (err) {
            elizaLogger.error("Error setting cache:", err);
            return false;
        }
    }

    async deleteCache(params: { agentId: UUID; key: string }): Promise<boolean> {
        try {
            const redisKey = this.buildKey(params.agentId, params.key);
            const result = await this.client.del(redisKey);
            return result > 0;
        } catch (err) {
            elizaLogger.error("Error deleting cache:", err);
            return false;
        }
    }

    async setValue(params: { key: string; value: string; ttl?: number }): Promise<boolean> {
        try {
            await this.client.set(params.key, params.value, 'EX', params.ttl || 300);
            return true;
        } catch (err) {
            elizaLogger.error("Error setting value:", err);
            return false;
        }
    }

    async getValue(params: { key: string }): Promise<string | undefined> {
        try {
            const value = await this.client.get(params.key);
            return value || undefined;
        } catch (err) {
            elizaLogger.error("Error getting value:", err);
            return undefined;
        }
    }

    // Hash Operations
    async hSet(hash: string, key: string, value: string): Promise<boolean> {
        try {
            await this.client.hset(hash, key, value);
            return true;
        } catch (err) {
            elizaLogger.error("Error setting hash value:", err);
            return false;
        }
    }

    async hGet(hash: string, key: string): Promise<string | null> {
        try {
            return await this.client.hget(hash, key);
        } catch (err) {
            elizaLogger.error("Error getting hash value:", err);
            return null;
        }
    }

    // List Operations
    async lPush(list: string, value: string): Promise<number> {
        try {
            return await this.client.lpush(list, value);
        } catch (err) {
            elizaLogger.error("Error pushing to list:", err);
            return 0;
        }
    }

    async rPop(list: string): Promise<string | null> {
        try {
            return await this.client.rpop(list);
        } catch (err) {
            elizaLogger.error("Error popping from list:", err);
            return null;
        }
    }

    // Set Operations
    async sAdd(set: string, value: string): Promise<number> {
        try {
            return await this.client.sadd(set, value);
        } catch (err) {
            elizaLogger.error("Error adding to set:", err);
            return 0;
        }
    }

    async sMembers(set: string): Promise<string[]> {
        try {
            return await this.client.smembers(set);
        } catch (err) {
            elizaLogger.error("Error retrieving set members:", err);
            return [];
        }
    }

    // Counter Operations
    async increment(key: string, ttl?: number): Promise<number> {
        try {
            const result = await this.client.incr(key);
            if (ttl) {
                await this.client.expire(key, ttl);
            }
            return result;
        } catch (err) {
            elizaLogger.error("Error incrementing value:", err);
            return 0;
        }
    }

    async decrement(key: string): Promise<number> {
        try {
            return await this.client.decr(key);
        } catch (err) {
            elizaLogger.error("Error decrementing value:", err);
            return 0;
        }
    }

    // Lock Operations
    async acquireLock(lockKey: string, ttl: number = 5000): Promise<boolean> {
        try {
            const result = await this.client.set(lockKey, "locked", "PX", ttl, "NX");
            return result === "OK";
        } catch (err) {
            elizaLogger.error("Error acquiring lock:", err);
            return false;
        }
    }

    async releaseLock(lockKey: string): Promise<boolean> {
        try {
            const result = await this.client.del(lockKey);
            return result > 0;
        } catch (err) {
            elizaLogger.error("Error releasing lock:", err);
            return false;
        }
    }

    // Disconnect
    async disconnect(): Promise<void> {
        try {
            await this.client.quit();
            elizaLogger.success("Disconnected from Redis");
        } catch (err) {
            elizaLogger.error("Error disconnecting from Redis:", err);
        }
    }

    private buildKey(agentId: UUID, key: string): string {
        return `${agentId}:${key}`;
    }
}

export default RedisClient;