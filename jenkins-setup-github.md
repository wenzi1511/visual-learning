# Step-by-Step Procedure: Jenkins Pipeline for GitHub

This guide will walk you through setting up a Jenkins pipeline to trigger automatically when code is pushed to your GitHub repository.

## Prerequisites
1. **GitHub Repository** for your `visual-learning` project.
2. **Jenkins** installed and accessible over the internet (or using ngrok locally to expose a webhook URL).
3. **Jenkins Plugins** Installed:
   - `GitHub Integration Plugin`
   - `GitHub plugin`
   - `Docker Pipeline`
   - `Pipeline`

## Step 1: Create a GitHub Personal Access Token (PAT)
Jenkins needs permission to access your repository securely.
1. Log into GitHub and go to **Settings** -> **Developer Settings** -> **Personal access tokens** -> **Tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Name it "Jenkins CI".
4. Check the scopes `repo` and `admin:repo_hook`.
5. Generate the token and copy it immediately (it won't be shown again).

## Step 2: Add Credentials to Jenkins
1. Go to your Jenkins Dashboard at `http://localhost:8080/` (or your public IP).
2. Go to **Manage Jenkins** -> **Credentials** -> **System** -> **Global credentials**.
3. Click **Add Credentials**.
4. Set Kind to **Secret text**.
5. Paste your GitHub PAT into the **Secret** field.
6. Set the ID to `github-token`.
7. Click **Create**.

## Step 3: Configure GitHub Server in Jenkins
1. Go to **Manage Jenkins** -> **System**.
2. Scroll to the **GitHub** section.
3. Click **Add GitHub Server**.
4. Name it "GitHub Server".
5. For Credentials, select the `github-token` from Step 2.
6. Click **Test connection** to ensure Jenkins can reach GitHub using the PAT.
7. Click **Save**.

## Step 4: Create the Pipeline Job
1. Go back to Jenkins Dashboard and click **New Item**.
2. Name it `visual-learning-github-pipeline`.
3. Select **Pipeline** and click **OK**.

## Step 5: Configure GitHub Webhook and SCM Polling
1. In the Pipeline configuration, check **GitHub hook trigger for GITScm polling**.
2. Scroll down to the **Pipeline** section.
3. Under **Definition**, select `Pipeline script from SCM`.
4. Set **SCM** to `Git`.
5. In **Repository URL**, enter your repository URL (e.g., `https://github.com/realprudhvi/visual-learning.git`).
6. Under **Credentials**, you can add your standard Git SSH keys or leave blank if it's a public repository.
7. Under **Script Path**, make sure it says `Jenkinsfile.github` -- this tells Jenkins to look for our designated pipeline file.
8. Click **Save**.

## Step 6: Setup GitHub Webhooks
If your Jenkins is publicly accessible (or exposed via `ngrok` for testing):
1. Go to your GitHub Repository -> **Settings** -> **Webhooks**.
2. Click **Add webhook**.
3. Set the **Payload URL** to your Jenkins server with `/github-webhook/` appended (e.g., `http://jenkins.yourdomain.com/github-webhook/`).
4. Set **Content type** to `application/json`.
5. Under "Which events would you like to trigger this webhook?", select **Just the push event**.
6. Ensure **Active** is checked and click **Add webhook**.

## Step 7: Testing the Pipeline
1. Make a small code change locally and commit it.
2. Run `git push origin main`.
3. Go to your Jenkins Dashboard. The `visual-learning-github-pipeline` should automatically start running.
4. You can click on the build number and view the **Console Output** to verify it is checking out the new commit, running Jest tests, and building your Production Docker Image using `Dockerfile.github`.
