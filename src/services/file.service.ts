import fs from 'fs/promises'
import path from 'path'
import {Dirent} from 'fs'

export const FileService = {
    listAllTheFiles : async (repo_id:string) => {
        //console.log(__dirname)
        const folderPath = path.join(__dirname.replace("dist/services", `repos`), `${repo_id}`, 'dist')
        //console.log(folderPath)
        let filesArr = []
        const files:Dirent[] = await fs.readdir(folderPath, {recursive: true, withFileTypes: true})
        //console.log(files)
        for (let file of files){
            if(!file.isDirectory()){
                filesArr.push(path.join(file.path, file.name))
            }
        }
        return filesArr
    },
    deleteRepoFromLocal: async (repo_id:string) => {
        const folderPath = path.join(__dirname.replace("dist/services", `repos`), `${repo_id}`)
        await fs.rm(folderPath, {recursive: true})
    }
}