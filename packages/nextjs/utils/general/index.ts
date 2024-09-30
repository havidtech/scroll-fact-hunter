import axios from "axios";
import { ethers } from "ethers";
import OpenAI from "openai";

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.CHATGPT_ORGANIZATION,
    project: process.env.CHATGPT_PROJECT_ID,
  });
}

export async function verifyRecaptcha(token: string) {
  if (process.env.NEXT_PUBLIC_CAPTCHA_PROJECT_KEY === undefined) {
    return true; // Return as though valid if NEXT_PUBLIC_CAPTCHA_PROJECT_KEY is undefined
  }

  const API_KEY = process.env.RECAPTCHA_SECRET_KEY;
  const response = await axios.post(
    `https://recaptchaenterprise.googleapis.com/v1/projects/friends-of-scrol-1727698767536/assessments?key=${API_KEY}`,
    {
      event: {
        token: token,
        expectedAction: "USER_ACTION",
        siteKey: process.env.NEXT_PUBLIC_CAPTCHA_PROJECT_KEY,
      }
    }
  );
  console.log("response ==> ", response.data);
  return response.data.tokenProperties.valid;
}

export function verifySignature(wallet_address: string, signature: string, signature_data: string): boolean {
  try {
    // Parse the signature data (timestamp)
    const timestamp = parseInt(signature_data, 10);
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if the signature is not older than 5 minutes
    if (currentTime - timestamp > 300) {
      return false;
    }

    // Create the EIP-712 typed data
    const typedData = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
        ],
        ProveScrollWalletOwnership: [
          { name: "wallet", type: "address" },
          { name: "timestamp", type: "uint256" },
          { name: "statement", type: "string" },
        ],
      },
      primaryType: "ProveScrollWalletOwnership",
      domain: {
        name: "Scroll",
        version: "1",
        chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID), // Scroll Sepolia testnet chain ID
      },
      message: {
        wallet: wallet_address,
        timestamp: timestamp,
        statement: "I am proving ownership of this Scroll wallet to submit a fact to Scroll of Fans.",
      },
    };

    // Recover the address from the signature
    const recoveredAddress = ethers.verifyTypedData(
      typedData.domain,
      { ProveScrollWalletOwnership: typedData.types.ProveScrollWalletOwnership },
      typedData.message,
      signature,
    );

    // Compare the recovered address with the provided wallet address
    return recoveredAddress.toLowerCase() === wallet_address.toLowerCase();
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

export async function callChatGPT(conversation: Array<any>) {
  if (process.env.OPENAI_API_KEY === undefined) {
    return mockChatGPTResponse(conversation);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: conversation,
  });

  return response.choices[0].message.content;
}

function mockChatGPTResponse(conversation: Array<any>): string {
  const correctStatements = [
    "Scroll is a Layer 2 scaling solution for Ethereum.",
    "Scroll uses zk-rollup technology to increase transaction throughput.",
    "The Scroll team is committed to open-source development.",
    "Scroll aims to maintain full EVM compatibility.",
    "Scroll's testnet is called Scroll Sepolia.",
    "Scroll uses zero-knowledge proofs to ensure security and scalability.",
    "Scroll is designed to reduce gas fees for Ethereum transactions.",
    "The Scroll ecosystem includes a native bridge for asset transfers.",
    "Scroll supports smart contract deployment and execution.",
    "Scroll's architecture includes sequencers and provers for transaction processing."
  ];

  const lastStatement = conversation[conversation.length - 1].content;
  
  if (correctStatements.some(statement => statement.toLowerCase() === lastStatement.toLowerCase())) {
    return "YES.";
  } else {
    return "NO.";
  }
}
