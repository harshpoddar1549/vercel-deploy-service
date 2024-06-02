import { S3Client, ListObjectsV2Command, GetObjectCommand, _Object } from '@aws-sdk/client-s3'
import { fromEnv } from '@aws-sdk/credential-providers'
import fs from 'fs' 
import path from 'path'
import {
    WritableStream
} from 'node:stream/web'
import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage';

const connectToR2 = () => {
    const s3 = new S3Client({
        endpoint: process.env.CLOUDFLARE_ENDPOINT,
        credentials: fromEnv(),
        region: process.env.BUCKET_REGION
    })
    return s3
}

export const getAllFilesFromR2 = async (sessionId: string) => {
    const allFiles = await listFilesOnR2(`repos/${sessionId}`)
    return new Promise(async (resolve, reject) => {
        try{
            console.log("[INFO] Awaiting")
            const allPromises = allFiles?.map(({ Key }) => {
                return Key && downloadAFileFromR2(Key, getLocalPathForRepoFolder(Key))
            })
            await Promise.all(allPromises)
            resolve("success")
        }
        catch(err){
            console.log("err")
            reject("err")
        }
    })
}

export const downloadAFileFromR2 = (actualPathOnR2:string, localPathToStore: string) => {
    const s3 = connectToR2()
    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: actualPathOnR2
    })
    return new Promise(async (resolve, reject) => {
        try{
            //logic to download the files from the location and store it here inside localPathToStore folder
            const {Body} = await s3.send(command)
            if(Body){
                /* finalOutputPath is my writeStream */
                const finalOutputPath = fs.createWriteStream(localPathToStore)
                /* webstream is my ReadableStream */
                const webStream = await Body.transformToWebStream()
                /* IN order to pipe my outputs from readable stream to a writestream it needs to be
                a writeAble Stream */
                const writableStream = new WritableStream({
                    write(chunk) {
                      finalOutputPath.write(chunk);
                    },
                });
                /* The below code checks if the dir exists or not. if not, it creates them before writing files in them */
                if(!fs.existsSync(path.dirname(localPathToStore))){
                    fs.mkdirSync(path.dirname(localPathToStore), {recursive: true})
                }
                webStream.pipeTo(writableStream).then(() => {
                    console.log(`>>> Downloaded File ${actualPathOnR2} to ${localPathToStore}`)
                    resolve("success")
                }).catch((err) => {
                    console.log(err)
                    reject("err")
                })
            }
              
        }catch(err){
            console.log(err)
            reject("err")
        }
    })
    
}

// prefix will be looking like `repos/{id}`
export const listFilesOnR2 = async (prefix: string):Promise<_Object[]> => {
    const s3 = connectToR2()
    try{
        const command = new ListObjectsV2Command({
            Bucket: process.env.BUCKET_NAME,
            Prefix: prefix
        })
        const allFiles = await s3.send(command)
        return allFiles.Contents ? allFiles.Contents : []
    }catch(err){
        console.log(err)
        return []
    }
}

export const getLocalPathForRepoFolder = (pathFromR2:string):string =>{
    let parentPath = __dirname.replace("dist/services", "")
    const splitedPath = pathFromR2.split('/')
    for (let part of splitedPath){
        parentPath = path.join(parentPath, part)
    }
    return parentPath
} 

export const uploadBuildToR2 = async (filePathArr: string[]) => {
    const promises = filePathArr.map((filePath) => {
        return new Promise(async (resolve, reject) => {
            const file = fs.readFileSync(filePath)
            const filePathOnR2 = filePath.match(/repos\/.*$/)
            try{
                if(filePathOnR2){
                    const key = filePathOnR2[0].replace("repos", "build")
                    /* Connect to S3 and push it there */
                    const s3 = new S3({
                        endpoint: process.env.CLOUDFLARE_ENDPOINT,
                        credentials: fromEnv(),
                        region: process.env.BUCKET_REGION
                    })
    
                    const parallelUpload = new Upload({
                        client: s3,
                        params: {
                            Body: file,
                            Bucket: process.env.BUCKET_NAME,
                            Key: key
                        }
                    })
            
                    const status = await parallelUpload.done()
                    console.log("[INFO]", `${filePathOnR2[0]} uploaded with HTTP status code ${status.$metadata.httpStatusCode}`)
                    resolve(1)
                }
            }catch(err){
                reject(err)
                console.log(err)
            }
        })
    })
    await Promise.all(promises)
}