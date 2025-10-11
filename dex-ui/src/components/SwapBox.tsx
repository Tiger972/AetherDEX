"use client";

import { ReactElement, useState } from "react";
import { ethers } from "ethers";
import SimpleDEX from "@/abi/SimpleDEX.json";

type SwapBoxProps = {
  dexAddress: string | null;
  onSwapComplete?: () => void;
};

const REQUIRED_CHAIN_ID = 11155111n;

export default function SwapBox({
  dexAddress,
  onSwapComplete,
}: SwapBoxProps): ReactElement {
  const [ethAmount, setEthAmount] = useState<string>("");
  const [slippageTolerance, setSlippageTolerance] = useState<string>("1");
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const numericAmount = Number(ethAmount);
  const isAmountValid =
    Number.isFinite(numericAmount) && numericAmount > 0;
  const numericSlippage = Number(slippageTolerance);
  const isSlippageValid =
    Number.isFinite(numericSlippage) &&
    numericSlippage >= 0 &&
    numericSlippage < 100;

  async function handleSwap(): Promise<void> {
    try {
      setStatusMessage("");

      if (!window.ethereum) {
        setStatusMessage("MetaMask not detected. Install the extension to continue.");
        return;
      }

      if (!dexAddress) {
        setStatusMessage("DEX address not configured. Set NEXT_PUBLIC_DEX_ADDRESS.");
        return;
      }

      if (!ethers.isAddress(dexAddress)) {
        setStatusMessage("Configured DEX address is invalid.");
        return;
      }

      if (!isAmountValid) {
        setStatusMessage("Enter an ETH amount greater than 0.");
        return;
      }

      if (!isSlippageValid) {
        setStatusMessage("Provide a slippage tolerance between 0 and 99.99%.");
        return;
      }

      setIsSwapping(true);
      setStatusMessage("Submitting transaction...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== REQUIRED_CHAIN_ID) {
        setStatusMessage("Switch MetaMask to the Sepolia test network before swapping.");
        return;
      }

      const signer = await provider.getSigner();
      const dex = new ethers.Contract(dexAddress, SimpleDEX.abi, signer);

      const ethAmountWei = ethers.parseEther(ethAmount);
      const estimatedTokens = await dex.getTokenAmount(ethAmountWei);

      if (estimatedTokens === 0n) {
        setStatusMessage("Pool currently cannot fulfill this swap (insufficient liquidity).");
        return;
      }

      const slippageBps = Math.round(numericSlippage * 100);
      const minTokensOut =
        estimatedTokens -
        (estimatedTokens * BigInt(slippageBps)) / 10_000n;

      if (minTokensOut <= 0n) {
        setStatusMessage("Slippage tolerance too high for this swap size.");
        return;
      }

      const deadline = Math.floor(Date.now() / 1000) + 60 * 5;

      const tx = await dex.swapETHForToken(minTokensOut, deadline, {
        value: ethAmountWei,
      });

      setStatusMessage("Waiting for confirmation...");
      await tx.wait();

      setStatusMessage(`Swap confirmed. Hash: ${tx.hash}`);
      setEthAmount("");
      onSwapComplete?.();
    } catch (error) {
      console.error("Swap failed:", error);
      const message = getReadableSwapError(error);
      setStatusMessage(`Swap failed: ${message}`);
    } finally {
      setIsSwapping(false);
    }
  }

  return (
    <article className="card dashboard-card">
      <h2 className="dashboard-card__title">Swap ETH to Token</h2>
      <p className="dashboard-card__meta">
        Trade ETH for the AetherDEX token directly from your wallet.
      </p>

      <div className="dashboard-card__info">
        <label
          className="text-left text-xs uppercase tracking-wide text-gray-400"
          htmlFor="swap-eth-amount"
        >
          ETH amount
        </label>
        <input
          id="swap-eth-amount"
          type="number"
          min="0"
          step="any"
          value={ethAmount}
          onChange={(event) => setEthAmount(event.target.value)}
          placeholder="0.10"
          className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
        />
      </div>

      <div className="dashboard-card__info">
        <label
          className="text-left text-xs uppercase tracking-wide text-gray-400"
          htmlFor="swap-slippage"
        >
          Slippage tolerance (%)
        </label>
        <input
          id="swap-slippage"
          type="number"
          min="0"
          step="0.1"
          value={slippageTolerance}
          onChange={(event) => setSlippageTolerance(event.target.value)}
          placeholder="1"
          className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
        />
      </div>

      <div className="dashboard-card__cta">
        <button
          onClick={handleSwap}
          disabled={
            isSwapping ||
            !isAmountValid ||
            !isSlippageValid ||
            !dexAddress
          }
          className="btn-primary dashboard-button disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSwapping ? "Swapping..." : "Swap"}
        </button>

        {statusMessage && (
          <p className="text-sm text-gray-300">{statusMessage}</p>
        )}
      </div>
    </article>
  );
}

function getReadableSwapError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const maybeCode = (error as { code?: string | number }).code;
    if (maybeCode === 4001) {
      return "Transaction rejected in wallet.";
    }
    if (maybeCode === "ACTION_REJECTED") {
      return "Transaction rejected in wallet.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred.";
}
