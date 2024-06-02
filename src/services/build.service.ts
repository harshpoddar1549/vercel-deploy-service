import { exec } from 'child_process'
import path from 'path'

export const buildProject = (repo_id: string) => {
    return new Promise((resolve, reject) => {
        let parentPath = __dirname.replace("dist/services", "")
        console.log("[INFO] Starting Build!")
        const child = exec(`cd ${path.join(parentPath, `repos/${repo_id}`)} && npm install --verbose && npm run build`)

        child.stdout?.on('data', function(data) {
            console.log('stdout: ' + data);
        });
        child.stderr?.on('data', function(data) {
            console.log('stderr: ' + data);
        });

        child.on('close', function(code) {
            console.log(`[INFO] Build Finish!`)
           resolve("")
        });
    })
}