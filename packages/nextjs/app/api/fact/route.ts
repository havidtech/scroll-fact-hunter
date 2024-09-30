// app/api/hello/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Facts } from "../../../models/facts";
import { RateLimitedAddresses } from "../../../models/rate_limited_addresses";
import { ethers } from "ethers";
import { Op } from "sequelize";
import sequelize from "sequelize/lib/sequelize";
import { callChatGPT, verifyRecaptcha, verifySignature } from "~~/utils/general";

// Create a mutex for handling concurrent requests
const mutex = new (class Mutex {
  private locked = false;
  private queue: (() => void)[] = [];

  isLocked(): boolean {
    return this.locked;
  }

  lock(): Promise<void> {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  unlock(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
})();

export async function POST(req: NextRequest) {
  // Try to acquire the lock, but don't wait if it's already locked
  if (mutex.isLocked()) {
    return NextResponse.json(
      { response: "NO", error: "Someone else is already adding a fact. Please try again later." },
      { status: 503 },
    );
  }

  await mutex.lock();

  // Add a 5-second delay
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const { wallet_address, statement, signature, timestamp, captcha_token } = await req.json();
    if (!wallet_address || !statement || !signature || !timestamp || !captcha_token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify reCAPTCHA token
    const isCaptchaValid = await verifyRecaptcha(captcha_token);
    if (!isCaptchaValid) {
      return NextResponse.json({ response: "NO", error: "Friends of Scroll must be human" }, { status: 400 });
    }
    // 1. Assert that the wallet address is not still rate limited
    const rateLimit = await RateLimitedAddresses.findOne({
      where: {
        wallet_address,
        retry_at: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (rateLimit) {
      return NextResponse.json(
        { response: "NO", error: `Rate limited. Please try again after ${rateLimit.retry_at.toLocaleString()}` },
        { status: 429 },
      );
    }

    // 2. Assert that the signature actually belongs to the wallet address and the timestamp is not too old
    const isSignatureValid = verifySignature(wallet_address, signature, timestamp);
    if (!isSignatureValid) {
      return NextResponse.json({ response: "NO", error: "Invalid signature" }, { status: 400 });
    }

    // Fetch all statements so far in DB
    const existingStatements = await Facts.findAll({
      attributes: ["statement"],
    });

    const systemMessage = {
      role: "system",
      content: `You are a judge. I tell you a unique fact I know about the Scroll blockchain, and you verify the accuracy and originality of the fact. If it's verified and unique, you simply say 'YES'; otherwise, you say 'NO.' If I provide a question, a command,  an exclamation or a conditional sentence or any non-factual statement, you must respond 'NO.' Your responses will always be limited to 'YES' or 'NO.'`,
    };

    const conversation = existingStatements.flatMap(fact => {
      const parsedFact = JSON.parse(fact.statement);
      return [parsedFact, { role: "assistant", content: "YES." }];
    });

    conversation.push({ role: "user", content: statement });

    // 3. Call ChatGPT API
    const chatGPTResponse = await callChatGPT([systemMessage, ...conversation]);

    // Set retry_at for the wallet address to one day from current date
    const retryAt = new Date();
    retryAt.setDate(retryAt.getDate() + 1);

    await RateLimitedAddresses.upsert({
      wallet_address,
      retry_at: retryAt,
    });

    if (chatGPTResponse === "YES.") {
      // Store the statement in DB
      const fact = await Facts.create({
        wallet_address,
        statement: JSON.stringify({ role: "user", content: statement }),
      });

      // Sign the ID of the inserted fact using personal sign
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
      const valueHex = ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [wallet_address, fact.id]);
      console.log("Value hex:", valueHex);
      const messageHash = ethers.getBytes(ethers.keccak256(valueHex));

      console.log("Message hash:", ethers.keccak256(valueHex));
      console.log("private key:", process.env.PRIVATE_KEY);
      const signature = await wallet.signMessage(messageHash);

      // Recover the address from the signature
      const recoveredAddress = ethers.recoverAddress(ethers.hashMessage(messageHash), signature);

      console.log("Recovered address:", recoveredAddress);
      console.log("Wallet address:", wallet.address);

      return NextResponse.json({ response: "YES", signature, token_id: fact.id }, { status: 200 });
    } else {
      return NextResponse.json({ response: "NO", error: "Fact not correct or unique" }, { status: 200 });
    }
  } finally {
    // Release the lock after processing the request
    mutex.unlock();
  }
}

export async function GET(req: NextRequest) {
  try {
    const summary = await Facts.findAll({
      attributes: [
        "wallet_address",
        [sequelize.fn("COUNT", sequelize.col("id")), "row_count"],
        [sequelize.fn("SUM", sequelize.col("id")), "id_sum"],
      ],
      group: ["wallet_address"],
      order: [[sequelize.literal("id_sum"), "DESC"]],
    });

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error("Error fetching summary:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
