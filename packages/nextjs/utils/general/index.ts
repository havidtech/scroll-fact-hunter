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

    // Recreate the message that was signed
    const message = `${wallet_address}:${signature_data}`;

    // Recover the address from the signature
    const msgHash = ethers.hashMessage(message);
    const recoveredAddress = ethers.recoverAddress(msgHash, signature);

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
