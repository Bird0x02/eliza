
import fs from "fs/promises"
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const stake_pool_info = [
    path.join(__dirname, "../src/data/stake_pools_navi.json"),
];
export const searchPoolInFileJson = async(name:string)=>{
    const results = await Promise.all(
        stake_pool_info.map(async (file) => {
            try {
                const data = await fs.readFile(file, 'utf8');
                const projects = JSON.parse(data);

                const foundProject = projects.find(
                    (project: { name: string }) => {
                        return (
                            (project.name && project.name.toLowerCase().includes(name.toLowerCase()) )
                        );
                    }
                );

                return foundProject || null;
            } catch (err) {
                console.error(`Error reading file ${file}:`, err);
                return null;
            }
        })
    );


    return results.find(result => result !== null) || null;
}
export const listPoolsInFileJson = async()=>{
    const results = await Promise.all(
        stake_pool_info.map(async (file) => {
            try {
                const data = await fs.readFile(file, 'utf8');
                const listPools = JSON.parse(data);



                return listPools || null;
            } catch (err) {
                console.error(`Error reading file ${file}:`, err);
                return null;
            }
        })
    );


    return results;
}