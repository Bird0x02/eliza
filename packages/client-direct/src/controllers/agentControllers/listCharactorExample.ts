import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
    elizaLogger,
} from "@elizaos/core";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplesDir = path.join(__dirname, '../../../characters/samples');
const mapDataPath = path.join(__dirname, '../../../characters/data/mapData.json')
export default async function index(req,res){

    await updateFileMapData();
    fs.readFile(mapDataPath, 'utf8', (readErr, data) => {
        if (readErr) {
            elizaLogger.info('error read file mapData.json:', readErr);
            return;
        }
        let mapData: any = JSON.parse(data);
        for (const key in mapData) {
            if (mapData.hasOwnProperty(key)) {
                delete mapData[key].clone;
            }
        }
        try {
            // return JSON.parse(data)
            return res.status(200).json({
                data:mapData
            })
        } catch (parseErr) {
            elizaLogger.info('error parse JSON:', parseErr);
            return;
        }
    });
}

async function updateFileMapData(){
    fs.readdir(samplesDir, (err, files) => {
        if (err) {
            elizaLogger.info('Error read folder:', err);
            return;
        }

        const keys = files.map(file => file.split('.')[0]);

        fs.readFile(mapDataPath, 'utf8', (readErr, data) => {
            if (readErr) {
                elizaLogger.info('error read file mapData.json:', readErr);
                return;
            }


            let mapData: { [key: string]: any[] } = {};
            try {
                mapData = JSON.parse(data);
            } catch (parseErr) {
                elizaLogger.info('error parse JSON:', parseErr);
                return;
            }

            keys.forEach(key => {
                if (!(key in mapData)) {
                    mapData[key] = [];
                }
            });

            fs.writeFile(mapDataPath, JSON.stringify(mapData, null, 4), 'utf8', writeErr => {
                if (writeErr) {
                    elizaLogger.info('error write file mapData.json:', writeErr);
                    return;
                }
            });
        });
    });
}
