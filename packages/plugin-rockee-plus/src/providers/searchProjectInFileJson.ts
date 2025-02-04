
import fs from "fs/promises"
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const files = [
    path.join(__dirname, "../src/data/projects.json"),

];

export const searchProjectInFileJson = async(name:string)=>{
    const results = await Promise.all(
        files.map(async (file) => {
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
export const searchCategoriesInFileJson = async(nameCategories :string= "Meme")=>{
    const results = await Promise.all(
        files.map(async (file) => {
            try {
                const data = await fs.readFile(file, 'utf8');
                const projects = JSON.parse(data);

                const project = projects.filter(item => item.categories.includes(nameCategories)).map(project => project.symbol);

                return project
            } catch (err) {
                console.error(`Error reading file ${file}:`, err);
                return null;
            }
        })
    );


    return results.find(result => result !== null) || null;
}