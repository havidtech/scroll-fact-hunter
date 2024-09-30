# Friends of Scroll
![image](https://github.com/user-attachments/assets/69cd21a7-6831-4049-920c-ea46dca9e990)

## Description
Friends of Scroll is a decentralized application (dApp) that allows users to prove their knowledge about the Scroll blockchain by submitting unique facts. Users can submit only one fact per day, ensuring a steady and thoughtful contribution process. Upon submission, users mint an NFT called FOS (Friends of Scroll) as proof of their contribution. The number of FOS tokens a user holds indicates their frequent interest in Scroll, while the weight of their FOS tokens reflects their in-depth knowledge of the Scroll ecosystem. These contributions are then displayed on a leaderboard, showcasing both the quantity and quality of users' Scroll knowledge. The project leverages Scroll smart contracts, Next.js for the frontend, and various web3 tools to create an engaging and interactive experience for blockchain enthusiasts, encouraging continuous learning and participation in the Scroll community. The fact submission process includes a validation step to ensure the accuracy and uniqueness of each contribution, maintaining the quality of information shared within the platform.

## Video Demo
Check out our [video demo](https://drive.google.com/file/d/1ZNGBefwwW8VEhSTCS86MOj3GZvdtzs30/view?usp=sharing) to see the project in action!


## Deployed Smart Contract
Our smart contract is deployed and verified on Scroll. You can view the contract [here](https://sepolia.scrollscan.com/address/0x007fF1Fc2709f6eCedAB3021804f0C330c83eA72#code).

## Alchemy RPC Configuration
We have integrated Alchemy RPC in our project. Below are the configuration details:

## Alchemy RPC Configuration
We have integrated Alchemy RPC in our project. Below are the configuration details:

### Main Files

- [Hardhat Configuration](packages/hardhat/hardhat.config.ts)
- [API Route](packages/nextjs/app/api/fact/route.ts)
- [Frontend Page](packages/nextjs/app/page.tsx)

## Environment Variables

To run this project, you need to set up the following environment variables:

### Hardhat Environment Variables

Create a `.env` file in the `packages/hardhat` directory with the following content:

```
ALCHEMY_API_KEY=<your_alchemy_api_key>
DEPLOYER_PRIVATE_KEY=<you can copy the first private key in hardhat chain>
SCROLL_SCAN_API_KEY=<your_scrollscan_api_key>
DEFAULT_NETWORK=scrollSepolia
```

### Next.js Environment Variables

NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_CHAIN_ID=your_chain_id


# PostgreSQL connection details

```
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=your_postgres_port
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=your_postgres_db
```

# Optional

```
OPENAI_API_KEY=your_openai_api_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
CHATGPT_PROJECT_ID=your_chatgpt_project_id
CHATGPT_ORGANIZATION=your_chatgpt_organization
PRIVATE_KEY=your_private_key used to sign auth needed when users mint FOS nfts
NEXT_PUBLIC_CHAIN_ID=your_chain_id
NEXT_PUBLIC_CAPTCHA_PROJECT_KEY=your_captcha_project_key
```

## Setup Steps

After setting up the environment variables, follow these steps to get the project running:

1. Install dependencies:
   ```
   yarn install
   ```

2. Run database migrations:
   ```
   npx sequelize-cli db:migrate
   ```

3. Compile and deploy smart contracts:
   ```
   cd packages/hardhat
   yarn compile
   yarn deploy
   ```

4. Start the Next.js development server:
   ```
   cd packages/nextjs
   yarn dev
   ```

Your project should now be up and running. Access the frontend by opening a web browser and navigating to `http://localhost:3000` (or the port specified by Next.js).

