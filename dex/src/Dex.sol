// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SimpleDEX is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    uint256 public reserveETH;
    uint256 public reserveToken;

    mapping(address => uint256) public liquidity;
    uint256 public totalLiquidity;

    uint256 private constant FEE_DENOMINATOR = 10_000;
    uint256 private constant FEE_BPS = 30; // 0.30%

    event LiquidityAdded(
        address indexed provider,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 mintedLiquidity
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 burnedLiquidity
    );
    event Swap(
        address indexed trader,
        bool ethToToken,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "token required");
        token = IERC20(tokenAddress);
    }

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "expired");
        _;
    }

    receive() external payable {
        require(msg.sender != tx.origin, "direct deposits disabled");
    }

    function addLiquidity(uint256 tokenAmount) external payable nonReentrant {
        require(msg.value > 0, "eth required");
        require(tokenAmount > 0, "token required");

        if (reserveETH == 0 && reserveToken == 0) {
            liquidity[msg.sender] += msg.value;
            totalLiquidity += msg.value;
            reserveETH = msg.value;
            reserveToken = tokenAmount;

            token.safeTransferFrom(msg.sender, address(this), tokenAmount);
            emit LiquidityAdded(msg.sender, msg.value, tokenAmount, msg.value);
            return;
        }

        uint256 tokenNeeded = (msg.value * reserveToken) / reserveETH;
        require(tokenAmount >= tokenNeeded, "ratio mismatch");

        uint256 liquidityMinted = (msg.value * totalLiquidity) / reserveETH;
        require(liquidityMinted > 0, "liquidity too small");

        liquidity[msg.sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;

        reserveETH += msg.value;
        reserveToken += tokenNeeded;

        token.safeTransferFrom(msg.sender, address(this), tokenNeeded);
        emit LiquidityAdded(msg.sender, msg.value, tokenNeeded, liquidityMinted);
    }

    function removeLiquidity(
        uint256 liquidityAmount,
        uint256 minEthOut,
        uint256 minTokenOut,
        uint256 deadline
    ) external nonReentrant ensure(deadline) {
        require(liquidityAmount > 0, "no liquidity");
        require(liquidity[msg.sender] >= liquidityAmount, "insufficient liquidity");
        require(totalLiquidity > 0, "pool empty");

        uint256 ethOut = (liquidityAmount * reserveETH) / totalLiquidity;
        uint256 tokenOut = (liquidityAmount * reserveToken) / totalLiquidity;
        require(ethOut >= minEthOut, "ETH slippage");
        require(tokenOut >= minTokenOut, "token slippage");

        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;

        reserveETH -= ethOut;
        reserveToken -= tokenOut;

        (bool success, ) = msg.sender.call{value: ethOut}("");
        require(success, "ETH transfer failed");
        token.safeTransfer(msg.sender, tokenOut);

        emit LiquidityRemoved(msg.sender, ethOut, tokenOut, liquidityAmount);
    }

    function swapETHForToken(uint256 minTokensOut, uint256 deadline)
        external
        payable
        nonReentrant
        ensure(deadline)
    {
        require(msg.value > 0, "no eth");
        require(reserveETH > 0 && reserveToken > 0, "pool empty");

        uint256 ethIn = msg.value;
        uint256 tokensOut = _getAmountOut(ethIn, reserveETH, reserveToken);
        require(tokensOut >= minTokensOut, "token slippage");
        require(tokensOut > 0, "insufficient output");

        reserveETH += ethIn;
        reserveToken -= tokensOut;

        token.safeTransfer(msg.sender, tokensOut);
        emit Swap(msg.sender, true, ethIn, tokensOut);
    }

    function swapTokenForETH(
        uint256 tokenAmount,
        uint256 minEthOut,
        uint256 deadline
    ) external nonReentrant ensure(deadline) {
        require(tokenAmount > 0, "no token");
        require(reserveETH > 0 && reserveToken > 0, "pool empty");

        token.safeTransferFrom(msg.sender, address(this), tokenAmount);

        uint256 ethOut = _getAmountOut(tokenAmount, reserveToken, reserveETH);
        require(ethOut >= minEthOut, "ETH slippage");
        require(ethOut > 0, "insufficient output");
        require(reserveETH >= ethOut, "insufficient eth reserve");

        reserveToken += tokenAmount;
        reserveETH -= ethOut;

        (bool success, ) = msg.sender.call{value: ethOut}("");
        require(success, "ETH transfer failed");

        emit Swap(msg.sender, false, tokenAmount, ethOut);
    }

    function getTokenAmount(uint256 ethIn) external view returns (uint256) {
        if (ethIn == 0 || reserveETH == 0 || reserveToken == 0) {
            return 0;
        }
        return _getAmountOut(ethIn, reserveETH, reserveToken);
    }

    function getETHAmount(uint256 tokenIn) external view returns (uint256) {
        if (tokenIn == 0 || reserveETH == 0 || reserveToken == 0) {
            return 0;
        }
        return _getAmountOut(tokenIn, reserveToken, reserveETH);
    }

    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) private pure returns (uint256) {
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_BPS);
        uint256 denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;
        require(denominator != 0, "bad denominator");
        return (amountInWithFee * reserveOut) / denominator;
    }
}
