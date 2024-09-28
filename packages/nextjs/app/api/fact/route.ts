// app/api/hello/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Facts } from "../../../models/facts";
import { RateLimitedAddresses } from "../../../models/rate_limited_addresses";
import { ethers } from "ethers";
import { Op } from "sequelize";
import { callChatGPT, verifyRecaptcha, verifySignature } from "~~/utils/general";

// Import crypto module

export async function POST(req: NextRequest) {
  // return NextResponse.json({ response: "YES" }, { status: 200 });

  const { wallet_address, statement, signature, signature_data, captcha_token } = await req.json();
  if (!wallet_address || !statement || !signature || !signature_data || !captcha_token) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  // 2. Assert that the Google reCAPTCHA token is valid
  // const isCaptchaValid = await verifyRecaptcha(captcha_token);
  // if (!isCaptchaValid) {
  //   return NextResponse.json({ error: "Invalid captcha" }, { status: 400 });
  // }

  // 3. Assert that the signature actually belongs to the wallet address and the signature_data is not too old
  const isSignatureValid = verifySignature(wallet_address, signature, signature_data);
  if (!isSignatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Fetch all statements so far in DB
  const existingStatements = await Facts.findAll({
    attributes: ["statement"],
  });

  console.log("existingStatements", existingStatements);

  const systemMessage = {
    role: "system",
    content: `You are a judge. I tell you a unique fact I know about the Scroll blockchain, and you verify the accuracy and originality of the fact. If it's verified and unique, you simply say 'YES'; otherwise, you say 'NO.' If I provide a question, a command,  an exclamation or a conditional sentence or any non-factual statement, you must respond 'NO.' Your responses will always be limited to 'YES' or 'NO.'`,
  };

  const conversation = existingStatements.flatMap(fact => {
    const parsedFact = JSON.parse(fact.statement);
    return [parsedFact, { role: "assistant", content: "YES." }];
  });

  conversation.push({ role: "user", content: statement });

  // 4. Call ChatGPT API
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
    const messageHash = ethers.hashMessage(fact.id.toString());
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json(
      { response: "YES", signature, token_id: fact.id, signed_data: fact.id.toString() },
      { status: 200 },
    );
  } else {
    return NextResponse.json({ response: "NO" }, { status: 200 });
  }
}
