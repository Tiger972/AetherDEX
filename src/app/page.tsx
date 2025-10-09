"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import type { MetaMaskInpageProvider } from "@metamask/providers";
import SwapBox from "@/components/SwapBox";
import abi from "../abi/SimpleDEX.json";

const DEFAULT_DEX_ADDRESS = "0x1d61EE6cc145A68Da54Ced80F6956498bcCaCF02";
const DEX_ADDRESS =
  process.env.NEXT_PUBLIC_DEX_ADDRESS ?? DEFAULT_DEX_ADDRESS;

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [reserveETH, setReserveETH] = useState<string | null>(null);
  const [reserveToken, setReserveToken] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);
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

  const loadReserves = useCallback(async () => {
    setIsLoading(true);
    setReserveError(null);

    try {
      const infuraId = process.env.NEXT_PUBLIC_INFURA_ID;
      let provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null =
        null;

      if (infuraId) {
        provider = new ethers.JsonRpcProvider(
          `https://sepolia.infura.io/v3/${infuraId}`
        );
      } else if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      }

      if (!provider) {
        throw new Error(
          "Set NEXT_PUBLIC_INFURA_ID or connect MetaMask to view reserves."
        );
      }
      const dexAddress = DEX_ADDRESS;

      if (!ethers.isAddress(dexAddress)) {
        throw new Error(
          "Invalid DEX contract address. Set NEXT_PUBLIC_DEX_ADDRESS to a valid address."
        );
      }

      const code = await provider.getCode(dexAddress);
      if (!code || code === "0x") {
        throw new Error(
          "No SimpleDEX contract found at the configured address on this network. Deploy to Sepolia and update NEXT_PUBLIC_DEX_ADDRESS."
        );
      }

      const dex = new ethers.Contract(dexAddress, abi.abi, provider);
      const [ethReserve, tokenReserve] = await Promise.all([
        dex.reserveETH(),
        dex.reserveToken(),
      ]);

      setReserveETH(parseFloat(ethers.formatEther(ethReserve)).toFixed(3));
      setReserveToken(parseFloat(ethers.formatEther(tokenReserve)).toFixed(3));
    } catch (error) {
      console.error("Failed to load reserves:", error);
      const message = getReadableReserveError(error);
      setReserveError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReserves();
  }, [loadReserves]);

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
              <p>
                Reserve ETH:{" "}
                {reserveError
                  ? "N/A"
                  : isLoading || reserveETH === null
                  ? "..."
                  : `${reserveETH} ETH`}
              </p>
              <p>
                Reserve Token:{" "}
                {reserveError
                  ? "N/A"
                  : isLoading || reserveToken === null
                  ? "..."
                  : `${reserveToken} TKN`}
              </p>
            </div>

            <div className="dashboard-card__cta">
              <button
                onClick={loadReserves}
                disabled={isLoading}
                className="btn-primary dashboard-button"
              >
                {isLoading ? "Refreshing..." : "🔄 Refresh"}
              </button>
              {reserveError && (
                <p className="text-sm text-red-400">{reserveError}</p>
              )}
            </div>
          </article>

          <SwapBox onSwapComplete={loadReserves} />
        </div>
      </section>

      <footer className="dashboard-footer">
        Built with Next.js + Tailwind + Ethers.js
      </footer>
    </main>
  );
}

function getReadableReserveError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const maybeCode = (error as { code?: string }).code;
    if (maybeCode === "NETWORK_ERROR") {
      return "Unable to reach Sepolia RPC. Check your internet or Infura key.";
    }
    if (maybeCode === "CALL_EXCEPTION") {
      return "Contract call reverted. Ensure you are connected to Sepolia or provide NEXT_PUBLIC_INFURA_ID.";
    }
    if (maybeCode === "BAD_DATA") {
      return "The RPC returned empty data for reserveETH(). Double-check the DEX address, network, and deployment.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error while loading reserves.";
}
