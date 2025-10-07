"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import type { MetaMaskInpageProvider } from "@metamask/providers";
import abi from "../abi/SimpleDEX.json";

const DEX_ADDRESS = "0x1d61EE6cc145A68Da54Ced80F6956498bcCaCF02";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [reserveETH, setReserveETH] = useState<string>("0");
  const [reserveToken, setReserveToken] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function connectWallet(): Promise<void> {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const ethereum = window.ethereum as MetaMaskInpageProvider;
      const provider = new ethers.BrowserProvider(ethereum);
      const accounts: string[] = await provider.send("eth_requestAccounts", []);

      if (!accounts.length) {
        alert("No accounts returned from MetaMask.");
        return;
      }

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
    <main className="dashboard-main">
      <header className="dashboard-header">
        <h1 className="dashboard-title glow">AetherDEX</h1>
        <h2 className="dashboard-subtitle">
          AetherDEX is a decentralized exchange prototype built with Solidity,
          Next.js, TailwindCSS, and Ethers.js, designed to help users swap
          tokens and monitor liquidity pools directly from their browser.
          <br />
          <br />
          It connects to MetaMask for wallet authentication and retrieves
          on-chain data such as ETH and token reserves using smart-contract
          interactions on the Sepolia test network.
          <br />
          <br />
          The goal of this project is to demystify how automated market makers
          (AMMs) like Uniswap work by rebuilding their core logic from scratch —
          including liquidity pools, reserves, and swap functions — while
          providing a clean, responsive front-end UI inspired by modern DEX
          dashboards.
        </h2>
      </header>

      <section className="dashboard-body">
        <div className="dashboard-row">
          {/* Wallet Card */}
          <article className="card dashboard-card">
            <h2 className="dashboard-card__title">Wallet</h2>

            {account && (
              <p className="dashboard-card__meta">
                Wallet connected successfully ✅
              </p>
            )}

            <div className="dashboard-card__cta">
              <button
                onClick={connectWallet}
                className="btn-primary dashboard-button"
              >
                {account
                  ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
                  : "Connect Wallet"}
              </button>
            </div>
          </article>

          {/* Liquidity Pool Card */}
          <article className="card dashboard-card">
            <h2 className="dashboard-card__title">💧 Liquidity Pool</h2>

            <div className="dashboard-card__info">
              <p>Reserve ETH: {isLoading ? "..." : `${reserveETH} ETH`}</p>
              <p>Reserve Token: {isLoading ? "..." : `${reserveToken} TKN`}</p>
            </div>

            <div className="dashboard-card__cta">
              <button
                onClick={loadReserves}
                disabled={isLoading}
                className="btn-primary dashboard-button"
              >
                {isLoading ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>
          </article>
        </div>
      </section>

      <footer className="dashboard-footer">
        Built with Next.js + Tailwind + Ethers.js
      </footer>
    </main>
  );
}
