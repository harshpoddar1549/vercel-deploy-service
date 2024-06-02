import { commandOptions, createClient } from "redis"
import { getAllFilesFromR2, uploadBuildToR2 } from "./cloudflare.service";
import { buildProject } from "./build.service";
import { FileService } from "./file.service";

const subscriber = createClient();
subscriber.on('error', (err) => console.log(`Redis Client creation Err: ${err}`))
subscriber.connect().then(()=> console.log(`[INFO] Redis Server connected successfully. `)).catch((err)=> console.log(err))

export const RedisService = {
    bIdFetch: async ():Promise<string> => {
        /* to create a loop that's running continously and fetching id from the redis queue */
        /* Why do we use Command Options and what does isolated: true means? */
        /* For blocking calls like brpop or blpop, which keeps waiting until the element is received */
        /* We want to isolate these conections so that the other non blocking connections are not affected */
        /* ON the same connection i.e. the redis connection */
        /* 0 means, wait for infinite time */
        /* 'build-queue' is the key, from where the deque has to happen */
        while(1){
            const repo_id = await subscriber.brPop(commandOptions({isolated: true}),"build-queue", 0)
            if (repo_id){
                await getAllFilesFromR2(repo_id.element)
                await buildProject(repo_id?.element)
                // to push the build back to S3
                const filePathArr = await FileService.listAllTheFiles(repo_id.element) //repo_id.element
                console.log(`[INFO] Starting Upload`)
                await uploadBuildToR2(filePathArr)
                console.log(`[INFO] Upload Finish`)
                console.log(`[INFO] Starting removal of folder repos/${repo_id.element}`)
                await FileService.deleteRepoFromLocal(repo_id.element)
                console.log(`[INFO] Successfully removed from the local system.`)
            }
            
            // Now we need to build it
        }
        return ""
    }
}