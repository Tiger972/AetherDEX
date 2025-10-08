"use client";

import { useState } from "react";
import { ethers } from "ethers";
import SimpleDEX from "@/abi/SimpleDEX.json";

type SwapBoxProps = {
  onSwapComplete?: () => void;
};

const DEX_ADDRESS = "0x1d61EE6cc145A68Da54Ced80F6956498bcCaCF02";

export default function SwapBox({
  onSwapComplete,
}: SwapBoxProps): JSX.Element {
  const [ethAmount, setEthAmount] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const numericAmount = Number(ethAmount);
  const isAmountValid =
    Number.isFinite(numericAmount) && numericAmount > 0;

  async function handleSwap(): Promise<void> {
    try {
      if (!window.ethereum) {
        setStatusMessage("MetaMask not detected. Install the extension to continue.");
        return;
      }

      if (!isAmountValid) {
        setStatusMessage("Enter an ETH amount greater than 0.");
        return;
      }

      setIsSwapping(true);
      setStatusMessage("Submitting transaction...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dex = new ethers.Contract(DEX_ADDRESS, SimpleDEX.abi, signer);

      const tx = await dex.swapETHForToken({
        value: ethers.parseEther(ethAmount),
      });

      setStatusMessage("Waiting for confirmation...");
      await tx.wait();

      setStatusMessage(`Swap confirmed. Hash: ${tx.hash}`);
      setEthAmount("");
      onSwapComplete?.();
    } catch (error) {
      console.error("Swap failed:", error);
      const message =
        error instanceof Error ? error.message : "Unexpected error occurred.";
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

      <div className="dashboard-card__cta">
        <button
          onClick={handleSwap}
          disabled={isSwapping || !isAmountValid}
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
