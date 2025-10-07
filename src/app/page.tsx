"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "../abi/SimpleDEX.json";

const DEX_ADDRESS = "0x1d61EE6cc145A68Da54Ced80F6956498bcCaCF02";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [reserveETH, setReserveETH] = useState<string>("0");
  const [reserveToken, setReserveToken] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  }

  async function loadReserves() {
    try {
      setIsLoading(true);
      const provider = new ethers.JsonRpcProvider(
        `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`
      );
      const dex = new ethers.Contract(DEX_ADDRESS, abi.abi, provider);

      const eth = await dex.reserveETH();
      const token = await dex.reserveToken();

      setReserveETH(parseFloat(ethers.formatEther(eth)).toFixed(3));
      setReserveToken(parseFloat(ethers.formatEther(token)).toFixed(3));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReserves();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0c10] text-white flex flex-col items-center justify-center p-10 space-y-12">
      <h1 className="text-3xl font-bold text-center mb-8 glow">
        💧 Simple DEX Dashboard
      </h1>

     {/* Cards container */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl justify-items-center">
  {/* Wallet Card */}
  <div className="card text-center p-5 w-full max-w-sm">
    <h2 className="text-xl font-semibold mb-4">💳 Wallet</h2>

    <button
      onClick={connectWallet}
      className="btn-primary w-full py-2 mb-3"
    >
      {account
        ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
        : "Connect Wallet"}
    </button>

    {account && (
      <p className="text-sm text-gray-300">
        Wallet connected successfully ✅
      </p>
    )}
  </div>

  {/* Liquidity Pool Card */}
  <div className="card text-center p-5 w-full max-w-sm">
    <h2 className="text-xl font-semibold mb-4">💧 Liquidity Pool</h2>

    <div className="space-y-2 text-gray-200">
      <p>Reserve ETH: {isLoading ? "..." : `${reserveETH} ETH`}</p>
      <p>Reserve Token: {isLoading ? "..." : `${reserveToken} TKN`}</p>
    </div>

    <button
      onClick={loadReserves}
      disabled={isLoading}
      className="btn-primary w-full mt-4"
    >
      {isLoading ? "Refreshing..." : "🔄 Refresh"}
    </button>
  </div>
</div>

      <footer className="text-sm text-gray-400 mt-12">
        Built with ❤️ using Next.js + Tailwind + Ethers.js
      </footer>
    </main>
  );
}
