"use client";

import { useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [statement, setStatement] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Submitting...");

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await (async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return signer.signTypedData(
          {
            name: "Scroll",
            version: "1",
            chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
          },
          {
            ProveScrollWalletOwnership: [
              { name: "wallet", type: "address" },
              { name: "timestamp", type: "uint256" },
              { name: "statement", type: "string" },
            ],
          },
          {
            wallet: connectedAddress,
            timestamp,
            statement: "I am proving ownership of this Scroll wallet to submit a fact to Scroll of Fans.",
          }
        );
      })();

      const response = await fetch("/api/fact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: connectedAddress,
          statement,
          signature,
          timestamp,
          captcha_token: "", // Add logic to generate captcha token
        }),
      });

      const data = await response.json();

      if (data.response === "YES" && data.signature && data.token_id) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          deployedContracts[31337].ScrollOfFans.address,
          deployedContracts[31337].ScrollOfFans.abi,
          await signer,
        );

        console.log(data);
        const tx = await contract.mint(data.token_id, data.signature);
        await tx.wait();

        setMessage("Fact submitted and NFT minted successfully!");
      } else {
        setMessage("Fact submission failed: " + data.error);
      }
    } catch (error) {
      console.error("Error submitting fact:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scroll of FANS</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="w-full max-w-md mx-auto mt-8">
              <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="statement">
                    Statement of Fact
                  </label>
                  <textarea
                    id="statement"
                    value={statement}
                    onChange={e => setStatement(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Submit
                  </button>
                </div>
              </form>
              {message && <p className="text-center text-red-500 text-xs italic">{message}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
