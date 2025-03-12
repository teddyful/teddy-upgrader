<a name="readme-top"></a>
<div align="center">
<h1>Teddy Upgrader</h1>
<p>Upgrade Teddy to the latest official release version.</p>
<p><a href="https://teddyful.com" target="_blank">teddyful.com</a></p>
</div>

## Table of Contents  
[1. Introduction](#introduction)<br/>
[2. Prerequisites](#prerequisites)<br/>
[3. Setup](#setup)<br/>
[4. Usage](#usage)<br/>
[5. Further Information](#information)<br/>
<br/>

## <a name="introduction"></a>1. Introduction

The Teddy upgrader app checks the version number of the latest official Teddy release and then upgrades, if applicable, a specified instance of Teddy.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="prerequisites"></a>2. Prerequisites

Please ensure that the following required software services are installed in your environment.

* <a href="https://git-scm.com/" target="_blank">Git</a> - Distributed version control system.
* <a href="https://nodejs.org/" target="_blank">Node.js</a> - JavaScript runtime environment.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="setup"></a>3. Setup

Clone the `teddy-upgrader` repository to a directory of your choice. Navigate into this directory and ensure that the `main` branch is checked out. Then install the required dependencies using NPM as follows.

```
# Clone the teddy-upgrader app.
git clone https://github.com/teddyful/teddy-upgrader.git

# Navigate into teddy-upgrader.
cd teddy-upgrader

# Checkout the main branch (default).
git checkout main

# Install the required dependencies.
npm install
```

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="usage"></a>4. Usage

### Upgrade Teddy

To upgrade a local instance of Teddy, run either `npm run upgrade` or `node upgrade.js` and provide the following command-line arguments.

#### --path &lt;path&gt; (required)

The absolute path to a local instance of <a href="https://github.com/teddyful/teddy" target="_blank">Teddy</a> that will be upgraded, upon user confirmation, if a newer release version is available.

#### --delete-backup

The Teddy upgrader app will create a backup of the specified instance of Teddy before it attempts to upgrade it. This backup is preserved indefinitely. Provide this option as a command-line argument to delete the backup only if the upgrade is successful.

### Example

```
# Upgrade Teddy.
npm run upgrade -- --path /home/teddyful/teddy

           _     _
          ( \---/ )
           ) . . (
 ____,--._(___Y___)_,--.____
     `--'           `--'
            TEDDY
         teddyful.com
 ___________________________


2025-03-12 20:57:40.773 [Teddy Upgrader] INFO: Started the Teddy upgrader app (v0.0.1).
2025-03-12 20:57:40.774 [Teddy Upgrader] INFO: Teddy path: /home/teddyful/teddy
2025-03-12 20:57:40.775 [Teddy Upgrader] INFO: Stage 1 of 17 - Validating the path...
2025-03-12 20:57:40.775 [Teddy Upgrader] INFO: Stage 2 of 17 - Identifying the current version number...
2025-03-12 20:57:40.777 [Teddy Upgrader] INFO: Stage 3 of 17 - Identifying the latest version number...
2025-03-12 20:57:41.018 [Teddy Upgrader] INFO: Stage 4 of 17 - Comparing version numbers...
2025-03-12 20:57:41.019 [Teddy Upgrader] INFO: Stage 5 of 17 - Awaiting confirmation to upgrade...

A new version of Teddy is available!
Current version: 0.0.1
Latest version: 0.0.2
Please read the release notes at https://github.com/teddyful/teddy/releases before upgrading.
Do you wish to upgrade Teddy to v0.0.2? [Y|n]: Y
Upgrade confirmed. Upgrading Teddy...

2025-03-12 20:57:43.842 [Teddy Upgrader] INFO: Stage 6 of 17 - Creating the download directory...
2025-03-12 20:57:43.843 [Teddy Upgrader] INFO: Stage 7 of 17 - Generating the download URLs...
2025-03-12 20:57:43.844 [Teddy Upgrader] INFO: Stage 8 of 17 - Downloading Teddy v0.0.2...
2025-03-12 20:57:44.994 [Teddy Upgrader] INFO: Stage 9 of 17 - Verifying the download integrity...
2025-03-12 20:57:45.002 [Teddy Upgrader] INFO: Stage 10 of 17 - Extracting the download...
2025-03-12 20:57:45.461 [Teddy Upgrader] INFO: Stage 11 of 17 - Verifying the extraction...
2025-03-12 20:57:45.462 [Teddy Upgrader] INFO: Stage 12 of 17 - Creating the backup directory...
2025-03-12 20:57:45.463 [Teddy Upgrader] INFO: Stage 13 of 17 - Creating a backup of the Teddy instance...
2025-03-12 20:57:47.000 [Teddy Upgrader] INFO: Stage 14 of 17 - Deleting resources from the Teddy instance...
2025-03-12 20:57:47.065 [Teddy Upgrader] INFO: Stage 15 of 17 - Copying upgraded resources to the Teddy instance...
2025-03-12 20:57:47.266 [Teddy Upgrader] INFO: Stage 16 of 17 - Verifying the upgrade...
2025-03-12 20:57:47.267 [Teddy Upgrader] INFO: Stage 17 of 17 - Installing upgraded dependencies...
2025-03-12 20:57:47.276 [Teddy Upgrader] INFO: Successfully finished upgrading Teddy!
2025-03-12 20:57:47.276 [Teddy Upgrader] INFO: Teddy location: /home/teddyful/teddy
2025-03-12 20:57:47.277 [Teddy Upgrader] INFO: Old version: 0.0.1
2025-03-12 20:57:47.277 [Teddy Upgrader] INFO: New version: 0.0.2
2025-03-12 20:57:47.277 [Teddy Upgrader] INFO: Deleting the download directory...
2025-03-12 20:57:47.343 [Teddy Upgrader] INFO: Exiting the Teddy upgrader app (exitCode = 0).
```

### Help

Run `npm run upgrade -- -h` or `node upgrade.js -h` to see a complete list of usage options.

### Backups

The Teddy upgrader app will create a backup of the specified instance of Teddy before it attempts to upgrade it. The backup may be found in `teddy-upgrader/working/backups/${datetime}` where `${datetime}` is the time that the upgrade process was started.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>

## <a name="information"></a>5. Further Information

For further information, please visit <a href="https://teddyful.com" target="_blank">teddyful.com</a>.

<p align="right"><a href="#readme-top">Back to Top &#9650;</a></p>
