import axios from "axios";
import { ethers } from "ethers";
import OpenAI from "openai";

const openai = new OpenAI({
  organization: process.env.CHATGPT_ORGANIZATION,
  project: process.env.CHATGPT_PROJECT_ID,
});

export async function verifyRecaptcha(token: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
  );
  return response.data.success;
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
        chainId: 534351, // Scroll Sepolia testnet chain ID
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
  // const response = await openai.chat.completions.create({
  //   model: "gpt-3.5-turbo",
  //   messages: conversation,
  // });

  // console.log("response ==> ", response);

  const randomResponse = Math.random() < 0.5 ? "YES." : "NO.";
  return randomResponse;
}
