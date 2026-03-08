# Step-by-Step Procedure: Implementing Jenkins Local Pipeline

This guide will walk you through setting up a Jenkins pipeline that runs automated testing and builds a Docker image directly from your local Git repository. This is extremely useful for verifying changes before you push them to a remote server.

## Prerequisites
1. **Jenkins** installed locally (or running in a local Docker container).
2. **Git** installed and tracking your current repository.
3. **Docker** Desktop (or Engine) installed and running.
4. **Node.js 20+** installed locally for testing outside containers.

## Step 1: Install Necessary Jenkins Plugins
First, let's ensure your Jenkins instance has what it needs.
1. Open Jenkins in your browser (usually `http://localhost:8080`).
2. Navigate to **Manage Jenkins -> Manage Plugins**.
3. Under the **Available Plugins** tab, search for and install:
   - `Git Plugin`
   - `Docker Pipeline`
   - `Pipeline` (Usually installed by default)
4. Restart Jenkins if prompted.

## Step 2: Ensure Jenkins has Docker Access (Windows Specific)
Jenkins needs permission to run Docker commands.
1. Open Docker Desktop settings.
2. Go to **Advanced** -> Enable `Expose daemon on tcp://localhost:2375 without TLS`.
3. Alternatively, add the Jenkins service user to the `docker-users` group using Windows Computer Management.
   - Run `compmgmt.msc`.
   - Go to `Local Users and Groups` -> `Groups` -> `docker-users`.
   - Add the user running Jenkins (often `Network Service` or `System`).

## Step 3: Create the Pipeline Job
We'll hook up Jenkins to reading `Jenkinsfile.local`.
1. Go back to the Jenkins Dashboard.
2. Click **New Item**.
3. Enter a name (e.g., `visual-learning-local-pipeline`).
4. Select **Pipeline** and click **OK**.

## Step 4: Configure the Pipeline Definition
1. Scroll down to the **Pipeline** section.
2. Under **Definition**, keep it to **Pipeline script**.
3. In the script textbox, use a script that pulls your local repository and then calls your local Jenkinsfile.
   
```groovy
pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                // IMPORTANT: Replace this path with the ABSOLUTE path to your visual-learning repo
                // Example: 'file:///D:/visual-learning'
                git url: 'file:///D:/visual-learning' 
            }
        }
        stage('Load Local Jenkinsfile') {
            steps {
                // Execute the Jenkinsfile that is checked out from the repo
                load 'Jenkinsfile.local'
            }
        }
    }
}
```

## Step 5: Run the Pipeline
1. Save your configuration.
2. Click **Build Now** on the left menu.
3. The pipeline will:
   - Checkout the local files from the path you provided.
   - Run `npm install` and your test suite (Jest tests we created).
   - Build a `visual-learning-local:latest` Docker image.

## Step 6: Reviewing Output
1. Click the `#1` under Build History.
2. Click **Console Output** to view the live logs of Jest tests running and the Docker image building.
3. You can verify the Docker image built via terminal: `docker images | grep visual-learning-local`.
