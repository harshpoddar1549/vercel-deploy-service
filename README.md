# vercel-deploy-service
Deploy service which will read the redis queue for any id and if it's there, it will perform the build and store the built files inside my r2 storage /built/{id} folder
