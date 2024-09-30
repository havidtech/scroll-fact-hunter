"use client";

import { useEffect, useState } from "react";
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
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch("/api/fact");
        const data = await response.json();
        setFriends(data.summary);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();

    // Set up event listener for mint events
    const setupEventListener = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const chainIdString = process.env.NEXT_PUBLIC_CHAIN_ID;
      if (!chainIdString) {
        console.error("Chain ID is not defined");
        return;
      }
      const chainId = parseInt(chainIdString, 10);
      const contractConfig = deployedContracts[chainId as keyof typeof deployedContracts]?.FriendsOfScroll;
      if (!contractConfig) {
        console.error("Contract configuration not found");
        return;
      }
      const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);

      const transferFilter = contract.filters.Transfer();

      console.log("Transfer filter:", transferFilter);
      const handleTransferEvent = () => {
        fetchFriends();
      };

      contract.on(transferFilter, handleTransferEvent);

      // Return a cleanup function
      return () => {
        contract.off(transferFilter, handleTransferEvent);
      };
    };

    const cleanupListener = setupEventListener();

    // Clean up the event listener when the component unmounts
    return () => {
      cleanupListener.then(cleanup => cleanup && cleanup());
    };
  }, []);

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
          },
        );
      })();

      const token = await new Promise(resolve => {
        if (process.env.NEXT_PUBLIC_CAPTCHA_PROJECT_KEY === undefined) {
          // Generate a random token if NEXT_PUBLIC_CAPTCHA_PROJECT_KEY is undefined
          const randomToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          resolve(randomToken);
        } else {
          // @ts-ignore
          grecaptcha.enterprise.ready(async () => {
            // @ts-ignore
            const captchaToken = await grecaptcha.enterprise.execute(process.env.NEXT_PUBLIC_CAPTCHA_PROJECT_KEY, {
              action: "LOGIN",
            });
            resolve(captchaToken);
          });
        }
      });

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
          captcha_token: token,
        }),
      });

      const data = await response.json();

      if (data.response === "YES" && data.signature && data.token_id) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          deployedContracts[31337].FriendsOfScroll.address,
          deployedContracts[31337].FriendsOfScroll.abi,
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
        <div className="px-5 py-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg shadow-md">
          <h1 className="text-center mb-6">
            <span className="block text-3xl mb-2 text-purple-600">Welcome to</span>
            <span className="block text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
              Friends of Scroll
            </span>
          </h1>
          <div className="flex justify-center items-center space-x-8 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {friends.find(
                  (f: { wallet_address: string; row_count: number }) => f.wallet_address === connectedAddress,
                )?.row_count || 0}
              </p>
              <p className="text-sm text-gray-600">FOS Count</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-600">
                {friends.find((f: { wallet_address: string; id_sum: number }) => f.wallet_address === connectedAddress)
                  ?.id_sum || 0}
              </p>
              <p className="text-sm text-gray-600">FOS Weight</p>
            </div>
          </div>
        </div>

        <div className="flex-grow w-full mt-16 px-8 py-12">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-lg shadow-xl p-8">
            <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
              <div className="w-full max-w-md mx-auto">
                <h2 className="text-3xl font-bold text-white text-center mb-6">Prove your Scroll knowledge</h2>
                <p className="text-white text-center mb-8">
                  Share unique facts about Scroll to increase your FOS count and weight!
                </p>
                <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="statement">
                      Your Unique Scroll Fact
                    </label>
                    <textarea
                      id="statement"
                      value={statement}
                      onChange={e => setStatement(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows={4}
                      placeholder="Share an interesting and unique fact about Scroll..."
                      required
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-full focus:outline-none focus:shadow-outline transform transition hover:scale-105 duration-300 ease-in-out"
                    >
                      Submit Fact
                    </button>
                  </div>
                </form>
                {message && (
                  <div className="fixed bottom-4 right-4 max-w-sm z-50">
                    <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow-xl p-4 animate-fade-in-up">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-blue-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full mt-16 px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">Leaderboard</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-xl">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white">
                  <tr>
                    <th className="py-3 px-4 border-b border-pink-300 text-left">Wallet Address</th>
                    <th className="py-3 px-4 border-b border-pink-300 text-center">FOS Count</th>
                    <th className="py-3 px-4 border-b border-pink-300 text-center">FOS Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {friends.map((friend, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 border-b">{friend.wallet_address}</td>
                      <td className="py-2 px-4 border-b text-center">{friend.row_count}</td>
                      <td className="py-2 px-4 border-b text-center">{friend.id_sum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
